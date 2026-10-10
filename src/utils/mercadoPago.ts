export interface CouponItem {
  code: string;
  days: number;
  label: string;
  description: string;
  active: boolean;
  createdAt?: string;
}

export interface MercadoPagoConfig {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  recurringMonthlyCardUrl: string;
  annualCardUrl: string;
  mpPublicKey?: string;
  mpAccessToken?: string;
  testModeOneReal?: boolean;
  supportWhatsapp?: string;
}

export const PLAN_PRICES = {
  MONTHLY_CARD_RECURRING: 39.9,
  MONTHLY_PIX: 44.9,
  ANNUAL_PIX: 299.0,
  ANNUAL_CARD: 299.0,
} as const;

// Links oficiais de Assinatura Recorrente criados na conta Mercado Pago do BellaDoor
export const OFFICIAL_MP_RECURRING_PLAN_URL =
  'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=f4e6eb70b041464cad245ab253662b93';

export const TEST_MP_RECURRING_PLAN_URL =
  'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=97d6cd95f1f34972ac4d3f90f98654d5';

export const DEFAULT_MP_CONFIG: MercadoPagoConfig = {
  pixKey: 'financeiro@belladoor.app',
  merchantName: 'BELLADOOR PLATAFORMA',
  merchantCity: 'BRASILIA',
  recurringMonthlyCardUrl: OFFICIAL_MP_RECURRING_PLAN_URL,
  annualCardUrl: '',
  mpPublicKey: (import.meta as any).env?.VITE_MP_PUBLIC_KEY || '',
  mpAccessToken: (import.meta as any).env?.VITE_MP_ACCESS_TOKEN || '',
  testModeOneReal: false,
  supportWhatsapp: '',
};

export const DEFAULT_MVP_COUPONS: CouponItem[] = [
  {
    code: 'VIP1ANO',
    days: 365,
    label: '1 Ano Livre (365 dias)',
    description: 'Acesso completo gratuito por 1 ano para embaixadoras e parceiras estratégicas.',
    active: true,
  },
  {
    code: 'PARCEIRA1ANO',
    days: 365,
    label: '1 Ano Livre (365 dias)',
    description: 'Doação de 1 ano de acesso Pro completo para divulgação da plataforma.',
    active: true,
  },
  {
    code: 'PARCEIRA90',
    days: 90,
    label: '90 Dias Livres (3 Meses)',
    description: '3 meses completos de acesso Pro para profissionais parceiras testarem e divulgarem.',
    active: true,
  },
  {
    code: 'MVP30',
    days: 30,
    label: '30 Dias Livres (1 Mês)',
    description: '1 mês completo de acesso gratuito para validação de MVP.',
    active: true,
  },
  {
    code: 'PARCEIRA30',
    days: 30,
    label: '30 Dias Livres (1 Mês)',
    description: '30 dias livres para parceiras de lançamento.',
    active: true,
  },
  {
    code: 'TESTE15',
    days: 15,
    label: '+15 Dias Livres',
    description: '15 dias extras de teste gratuito no painel profissional.',
    active: true,
  },
];

function formatEmvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function computeCRC16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Gera um código PIX Copia e Cola válido (padrão EMV BR Code do Banco Central)
 * com o valor exato do plano selecionado (R$ 44,90 no PIX Mensal ou R$ 299,00 no PIX Anual).
 * O campo 02 ("Assinatura BellaDoor Pro") aparece como `description` no extrato da API do Mercado Pago!
 */
export function generatePixBrCode(params: {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txid?: string;
}): string {
  const cleanKey = (params.pixKey || 'financeiro@belladoor.app').trim();
  const cleanName = (params.merchantName || 'BELLADOOR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .slice(0, 25);
  const cleanCity = (params.merchantCity || 'BRASILIA')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .slice(0, 15);
  const amountStr = params.amount.toFixed(2);
  const txid = (params.txid || 'BELLADOORPRO').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || 'BELLADOOR';

  const gui = formatEmvField('00', 'br.gov.bcb.pix');
  const keyField = formatEmvField('01', cleanKey);
  const descField = formatEmvField('02', 'Assinatura BellaDoor Pro');
  const merchantAccountInfo = formatEmvField('26', `${gui}${keyField}${descField}`);

  const payloadWithoutCrc =
    formatEmvField('00', '01') +
    merchantAccountInfo +
    formatEmvField('52', '0000') +
    formatEmvField('53', '986') +
    formatEmvField('54', amountStr) +
    formatEmvField('58', 'BR') +
    formatEmvField('59', cleanName) +
    formatEmvField('60', cleanCity) +
    formatEmvField('62', formatEmvField('05', txid)) +
    '6304';

  const crc = computeCRC16(payloadWithoutCrc);
  return `${payloadWithoutCrc}${crc}`;
}

/**
 * 1. CONSULTA EM TEMPO REAL NA API DO MERCADO PAGO SE O PIX (OU CARTÃO) FOI APROVADO
 * Usa Simple GET Request (?access_token=...) sem headers customizados para evitar 100% erros de CORS no navegador!
 */
export async function checkRecentMercadoPagoApproval(params: {
  accessToken: string;
  expectedAmount?: number;
  payerEmail?: string;
  sinceTimestampMs?: number;
}): Promise<{
  approved: boolean;
  paymentId?: string;
  amount?: number;
  method?: 'PIX' | 'CARD_RECURRING';
  planInterval?: 'MONTHLY' | 'ANNUAL';
}> {
  const token = params.accessToken.trim();
  if (!token) return { approved: false };

  try {
    const url = `https://api.mercadopago.com/v1/payments/search?access_token=${encodeURIComponent(
      token
    )}&status=approved&sort=date_created&criteria=desc&limit=15`;

    // Simple GET sem header Authorization = ZERO preflight OPTIONS = ZERO NetworkError no navegador!
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return { approved: false };

    const data = await res.json();
    const results: any[] = data?.results || [];
    const cleanEmail = (params.payerEmail || '').trim().toLowerCase();
    const minTimeMs = params.sinceTimestampMs || Date.now() - 20 * 60 * 1000;

    for (const item of results) {
      if (item.status !== 'approved') continue;
      const approvedMs = new Date(item.date_approved || item.date_created).getTime();
      if (Number.isNaN(approvedMs) || approvedMs < minTimeMs) continue;

      const desc = String(item.description || '').toLowerCase();
      const extRef = String(item.external_reference || '').toLowerCase();
      const txAmount = Number(item.transaction_amount);

      const isBellaDoorPayment =
        desc.includes('belladoor') ||
        (cleanEmail && extRef === cleanEmail) ||
        (params.expectedAmount !== undefined && Math.abs(txAmount - params.expectedAmount) < 0.05);

      if (!isBellaDoorPayment) continue;

      if (
        params.expectedAmount !== undefined &&
        Math.abs(txAmount - params.expectedAmount) > 0.05
      ) {
        continue;
      }

      const isAnnual = txAmount >= 250 || txAmount === 2 || desc.includes('anual');
      const isPix = item.payment_method_id === 'pix';

      return {
        approved: true,
        paymentId: String(item.id),
        amount: txAmount,
        method: isPix ? 'PIX' : 'CARD_RECURRING',
        planInterval: isAnnual ? 'ANNUAL' : 'MONTHLY',
      };
    }

    return { approved: false };
  } catch {
    return { approved: false };
  }
}

/**
 * 2. RETORNA O LINK OFICIAL DE ASSINATURA MENSAL RECORRENTE NO CARTÃO (R$ 39,90/mês ou R$ 2,00 no modo teste)
 */
export function getMercadoPagoRecurringSubscriptionUrl(params: {
  customUrl?: string;
  testModeOneReal?: boolean;
}): string {
  if (params.testModeOneReal) {
    return TEST_MP_RECURRING_PLAN_URL;
  }
  if (params.customUrl && params.customUrl.trim().startsWith('http')) {
    return params.customUrl.trim();
  }
  return OFFICIAL_MP_RECURRING_PLAN_URL;
}

/**
 * 3. CRIAÇÃO DE PAGAMENTO ÚNICO NO CARTÃO DE CRÉDITO PARA O PLANO ANUAL (/checkout/preferences - R$ 299,00)
 * O endpoint /checkout/preferences possui suporte completo a CORS no navegador (retorna 200 no OPTIONS e 201 no POST).
 */
export async function createMercadoPagoAnnualSingleCardCheckout(params: {
  accessToken: string;
  payerEmail: string;
  payerName: string;
  returnUrl: string;
  amount?: number;
}): Promise<{
  preferenceId?: string;
  initPoint?: string;
  error?: string;
}> {
  const token = params.accessToken.trim();
  if (!token) return { error: 'Access Token do Mercado Pago não configurado.' };

  const safeBackUrl = params.returnUrl.startsWith('https://')
    ? params.returnUrl
    : 'https://bellador.web.app/?mp_subscription=verified';

  const unitPrice = params.amount ? Number(params.amount.toFixed(2)) : PLAN_PRICES.ANNUAL_CARD;

  try {
    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            id: 'BELLADOOR-ANUAL-299',
            title: 'BellaDoor Pro - Plano Anual (Pagamento Unico - 12 Meses)',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: unitPrice,
          },
        ],
        external_reference: params.payerEmail.trim().toLowerCase(),
        statement_descriptor: 'BELLADOOR',
        payment_methods: {
          excluded_payment_types: [{ id: 'ticket' }],
          installments: 12,
        },
        back_urls: {
          success: safeBackUrl,
          pending: safeBackUrl,
          failure: safeBackUrl,
        },
        auto_return: 'approved',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        error:
          data?.message ||
          'Erro ao criar checkout anual de pagamento único no Mercado Pago.',
      };
    }

    return {
      preferenceId: String(data.id),
      initPoint: data.init_point,
    };
  } catch (err: any) {
    return { error: err?.message || 'Falha ao conectar com Mercado Pago Checkout.' };
  }
}

/**
 * 4. VERIFICAÇÃO AUTOMÁTICA DE ASSINATURA E PAGAMENTOS DA PROFISSIONAL (SEM ERRO DE CORS)
 * Usa Simple GET em /v1/payments/search?access_token=... para confirmar:
 * - Assinatura Mensal Recorrente no Cartão (R$ 39,90/mês)
 * - Pagamento Único Plano Anual no Cartão (R$ 299,00)
 * - Pagamento PIX Mensal (R$ 44,90) ou Anual (R$ 299,00)
 */
export async function verifyProfessionalSubscriptionInMercadoPago(params: {
  accessToken: string;
  payerEmail: string;
  preapprovalId?: string;
}): Promise<{
  isAuthorized: boolean;
  planInterval?: 'MONTHLY' | 'ANNUAL';
  paymentMethod?: 'PIX' | 'CARD_RECURRING';
  nextPaymentDate?: string;
  statusDetail?: string;
}> {
  const token = params.accessToken.trim();
  const cleanEmail = params.payerEmail.trim().toLowerCase();
  if (!token) {
    return { isAuthorized: false };
  }

  try {
    // Simple GET sem header Authorization para evitar bloqueio de CORS no navegador
    const searchPayRes = await fetch(
      `https://api.mercadopago.com/v1/payments/search?access_token=${encodeURIComponent(
        token
      )}&status=approved&sort=date_created&criteria=desc&limit=25`,
      {
        method: 'GET',
      }
    );

    if (!searchPayRes.ok) {
      return { isAuthorized: false };
    }

    const searchPayData = await searchPayRes.json();
    const payResults: any[] = searchPayData?.results || [];

    // Procura pagamento recente aprovado do BellaDoor (nos últimos 15 minutos se foi PIX via QR Code ou vinculado ao e-mail da profissional)
    const now = Date.now();
    const matchedPayment = payResults.find((item) => {
      if (item.status !== 'approved') return false;
      const desc = String(item.description || '').toLowerCase();
      const ext = String(item.external_reference || '').toLowerCase();
      const approvedMs = new Date(item.date_approved || item.date_created).getTime();

      if (cleanEmail && ext === cleanEmail) {
        return true;
      }
      // Se foi pago pelo QR Code PIX do BellaDoor ou Assinatura BellaDoor recentemente (últimos 30 minutos)
      if (desc.includes('belladoor') && now - approvedMs < 30 * 60 * 1000) {
        return true;
      }
      return false;
    });

    if (matchedPayment) {
      const approvedDate = new Date(
        matchedPayment.date_approved || matchedPayment.date_created
      ).getTime();
      const txAmount = Number(matchedPayment.transaction_amount);
      const desc = String(matchedPayment.description || '').toLowerCase();
      const isAnnual = txAmount >= 250 || txAmount === 2 || desc.includes('anual');
      const isPix = matchedPayment.payment_method_id === 'pix';
      const validDays = isAnnual ? 365 : 30;
      const expiresAt = approvedDate + validDays * 24 * 60 * 60 * 1000;

      if (expiresAt > Date.now()) {
        return {
          isAuthorized: true,
          planInterval: isAnnual ? 'ANNUAL' : 'MONTHLY',
          paymentMethod: isPix ? 'PIX' : 'CARD_RECURRING',
          nextPaymentDate: new Date(expiresAt).toISOString(),
          statusDetail: isAnnual
            ? `Plano Anual (${isPix ? 'PIX' : 'Cartão'} - R$ ${txAmount
                .toFixed(2)
                .replace('.', ',')}) confirmado no Mercado Pago!`
            : `Plano Mensal (${isPix ? 'PIX' : 'Cartão Recorrente'} - R$ ${txAmount
                .toFixed(2)
                .replace('.', ',')}) confirmado no Mercado Pago!`,
        };
      }
    }

    return { isAuthorized: false };
  } catch {
    return { isAuthorized: false };
  }
}

