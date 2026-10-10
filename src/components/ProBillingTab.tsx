import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Gift,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trash2,
  Zap,
} from 'lucide-react';
import { UiDialogPayload } from '../types/belladoor';
import {
  CouponItem,
  MercadoPagoConfig,
  OFFICIAL_MP_RECURRING_PLAN_URL,
  PLAN_PRICES,
  checkRecentMercadoPagoApproval,
  createMercadoPagoAnnualSingleCardCheckout,
  generatePixBrCode,
  getMercadoPagoRecurringSubscriptionUrl,
} from '../utils/mercadoPago';

interface ProBillingTabProps {
  subscriptionStatus: 'TRIAL' | 'ACTIVE';
  planInterval: 'MONTHLY' | 'ANNUAL';
  trialDaysLeft: number;
  trialTotalDays: number;
  trialEndDateFormatted: string;
  userEmail?: string;
  userFullName?: string;
  appliedCoupon?: string;
  paymentMethod?: 'PIX' | 'CARD_RECURRING' | 'COUPON';
  autoRenewCanceled?: boolean;
  showCheckoutModal: boolean;
  checkoutMethod: 'PIX' | 'CARD';
  isPaymentProcessing: boolean;
  coupons: CouponItem[];
  mpConfig: MercadoPagoConfig;
  onSelectPlanInterval: (interval: 'MONTHLY' | 'ANNUAL') => void;
  onOpenCheckoutModal: () => void;
  onCloseCheckoutModal: () => void;
  onSelectCheckoutMethod: (method: 'PIX' | 'CARD') => void;
  onToggleSimulationStatus: () => void;
  onConfirmPaymentSimulation: () => void;
  onVerifyMercadoPagoNow: () => void;
  onCancelRecurringSubscription: () => void;
  onReactivateRecurringSubscription: () => void;
  onApplyCoupon: (code: string) => void;
  onCreateCoupon: (coupon: CouponItem) => void;
  onDeleteCoupon: (code: string) => void;
  onUpdateMpConfig: (config: MercadoPagoConfig) => void;
  onShowUiDialog: (dialog: UiDialogPayload) => void;
  onOpenAdminUsers?: () => void;
}

export const ProBillingTab: React.FC<ProBillingTabProps> = ({
  subscriptionStatus,
  planInterval,
  trialDaysLeft,
  trialTotalDays,
  trialEndDateFormatted,
  userEmail,
  userFullName,
  appliedCoupon,
  paymentMethod,
  autoRenewCanceled,
  showCheckoutModal,
  checkoutMethod,
  isPaymentProcessing,
  coupons,
  mpConfig,
  onSelectPlanInterval,
  onOpenCheckoutModal,
  onCloseCheckoutModal,
  onSelectCheckoutMethod,
  onToggleSimulationStatus,
  onConfirmPaymentSimulation,
  onVerifyMercadoPagoNow,
  onCancelRecurringSubscription,
  onReactivateRecurringSubscription,
  onApplyCoupon,
  onCreateCoupon,
  onDeleteCoupon,
  onUpdateMpConfig,
  onShowUiDialog,
  onOpenAdminUsers,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Estados de carregamento e última URL de checkout aberta
  const [mpLoadingApi, setMpLoadingApi] = useState<boolean>(false);
  const [mpApiError, setMpApiError] = useState<string | null>(null);
  const [lastOpenedCheckoutUrl, setLastOpenedCheckoutUrl] = useState<string | null>(null);
  const [modalOpenedAtMs, setModalOpenedAtMs] = useState<number>(() => Date.now());

  const handleContactSupportWhatsApp = (customTopic?: string) => {
    const proName = userFullName || 'Profissional BellaDoor';
    const proMail = userEmail || 'Não informado';
    const statusText =
      subscriptionStatus === 'ACTIVE'
        ? `Assinante Ativa (${trialDaysLeft} dias restantes)`
        : trialDaysLeft > 0
        ? `Período Grátis (${trialDaysLeft} dias restantes)`
        : 'Período Grátis Encerrado (Aguardando Ativação)';

    const msg =
      `Olá, Suporte BellaDoor! 👋✨\n\n` +
      `Sou *${proName}* (${proMail}).\n` +
      `📌 *Status atual:* ${statusText}\n` +
      (customTopic ? `💬 *Assunto:* ${customTopic}\n\n` : `\n`) +
      `Podem me ajudar com minha assinatura / cupom na plataforma?`;

    const rawPhone = (mpConfig.supportWhatsapp || '').replace(/\D/g, '');
    if (rawPhone.length >= 10) {
      const normalized = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
      window.open(
        `https://wa.me/${normalized}?text=${encodeURIComponent(msg)}`,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }

    // Caso o admin ainda não tenha configurado um número fixo, copia a mensagem e abre opção de WhatsApp / E-mail oficial
    navigator.clipboard?.writeText(msg);
    window.open(
      `https://wa.me/?text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const hasMpApiToken = Boolean(mpConfig.mpAccessToken && mpConfig.mpAccessToken.trim().length > 15);

  const isTestPriceMode = Boolean(mpConfig.testModeOneReal);

  // Cálculo dinâmico do valor conforme plano (Mensal vs Anual), método (PIX vs Cartão) e Modo Teste R$ 1,00
  const currentCheckoutAmount = isTestPriceMode
    ? planInterval === 'ANNUAL'
      ? 2.0
      : checkoutMethod === 'PIX'
      ? 1.0
      : 2.0
    : planInterval === 'ANNUAL'
    ? checkoutMethod === 'PIX'
      ? PLAN_PRICES.ANNUAL_PIX
      : PLAN_PRICES.ANNUAL_CARD
    : checkoutMethod === 'PIX'
    ? PLAN_PRICES.MONTHLY_PIX
    : PLAN_PRICES.MONTHLY_CARD_RECURRING;

  const formattedCheckoutAmount = currentCheckoutAmount.toFixed(2).replace('.', ',');

  const activePixCode = generatePixBrCode({
    pixKey: mpConfig.pixKey || 'financeiro@belladoor.app',
    merchantName: mpConfig.merchantName || 'BELLADOOR',
    merchantCity: mpConfig.merchantCity || 'BRASILIA',
    amount: currentCheckoutAmount,
    txid: planInterval === 'ANNUAL' ? 'BELLADOORANUAL' : 'BELLADOORMENSAL',
  });

  // Registra o momento em que o modal foi aberto para o polling automático do PIX
  useEffect(() => {
    if (showCheckoutModal) {
      setModalOpenedAtMs(Date.now() - 60 * 1000);
      setMpApiError(null);
    }
  }, [showCheckoutModal, checkoutMethod, planInterval]);

  // Polling automático a cada 5 segundos via Simple GET (sem erro de CORS!) para aprovar o PIX assim que o banco confirmar
  useEffect(() => {
    if (!showCheckoutModal || checkoutMethod !== 'PIX' || !hasMpApiToken) {
      return;
    }

    const timer = setInterval(async () => {
      const check = await checkRecentMercadoPagoApproval({
        accessToken: mpConfig.mpAccessToken || '',
        expectedAmount: currentCheckoutAmount,
        payerEmail: userEmail,
        sinceTimestampMs: modalOpenedAtMs,
      });
      if (check.approved) {
        clearInterval(timer);
        onConfirmPaymentSimulation();
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [
    showCheckoutModal,
    checkoutMethod,
    hasMpApiToken,
    currentCheckoutAmount,
    userEmail,
    modalOpenedAtMs,
  ]);

  const handleStartRecurringCardSubscription = async () => {
    setMpApiError(null);

    // 1. PLANO MENSAL — CARTÃO DE CRÉDITO RECORRENTE (R$ 39,90/mês ou R$ 2,00/mês em modo teste)
    // Abre a página oficial de Assinatura Recorrente do Mercado Pago para digitar os dados do cartão!
    if (planInterval === 'MONTHLY') {
      const targetRecurringUrl = getMercadoPagoRecurringSubscriptionUrl({
        customUrl: mpConfig.recurringMonthlyCardUrl,
        testModeOneReal: isTestPriceMode,
      });

      setLastOpenedCheckoutUrl(targetRecurringUrl);
      window.open(targetRecurringUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // 2. PLANO ANUAL — PAGAMENTO ÚNICO NO CARTÃO (R$ 299,00 ou R$ 2,00 em modo teste)
    if (hasMpApiToken) {
      setMpLoadingApi(true);
      const returnUrl = `${window.location.origin}/?mp_subscription=verified`;

      const res = await createMercadoPagoAnnualSingleCardCheckout({
        accessToken: mpConfig.mpAccessToken || '',
        payerEmail: userEmail || 'profissional@belladoor.app',
        payerName: userFullName || 'Profissional BellaDoor',
        returnUrl,
        amount: currentCheckoutAmount,
      });

      setMpLoadingApi(false);

      if (res.initPoint) {
        setLastOpenedCheckoutUrl(res.initPoint);
        window.open(res.initPoint, '_blank', 'noopener,noreferrer');
        return;
      } else if (res.error) {
        setMpApiError(res.error);
        return;
      }
    }

    if (mpConfig.annualCardUrl) {
      setLastOpenedCheckoutUrl(mpConfig.annualCardUrl);
      window.open(mpConfig.annualCardUrl, '_blank', 'noopener,noreferrer');
      return;
    }
  };

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponInput.trim().toUpperCase();
    if (!clean) return;
    if ((clean === 'ADMIN' || clean === 'ADMINBELLADOOR') && onOpenAdminUsers) {
      onOpenAdminUsers();
      setCouponInput('');
      return;
    }
    onApplyCoupon(clean);
    setCouponInput('');
  };

  const isMasterAdmin = Boolean(
    userEmail && userEmail.trim().toLowerCase() === 'evertonrcsilva@gmail.com'
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-sm text-stone-900">
              Assinatura BellaDoor Pro • Mercado Pago
            </h3>
            <p className="text-xs text-stone-500">
              Cartão de crédito recorrente automático, PIX ou Cupom de Parceira
            </p>
          </div>
          {isMasterAdmin && (
            <div className="flex items-center gap-2">
              {hasMpApiToken && (
                <button
                  type="button"
                  onClick={onVerifyMercadoPagoNow}
                  className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full transition cursor-pointer"
                  title="Sincronizar status da assinatura com sua conta Mercado Pago"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-600" />
                  Sincronizar Mercado Pago
                </button>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-1 rounded-full">
                🔒 {hasMpApiToken ? 'API Mercado Pago Conectada' : 'Checkout Mercado Pago'}
              </span>
            </div>
          )}
        </div>

        {/* Status Atual da Conta / Contador de 7 Dias Grátis / Bloqueio Pós-7 Dias */}
        {subscriptionStatus !== 'ACTIVE' && trialDaysLeft <= 0 ? (
          <div className="p-4 rounded-2xl border-2 border-red-300 bg-gradient-to-br from-red-50 via-rose-50 to-amber-50/50 space-y-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-600 text-white shrink-0 shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="font-extrabold text-xs sm:text-sm text-red-950">
                    🔒 Período de 7 Dias Grátis Encerrado — Plataforma Bloqueada
                  </h4>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-600 text-white">
                    0 de {trialTotalDays} dias restantes
                  </span>
                </div>
                <p className="text-xs text-red-900/90 mt-1.5 leading-relaxed">
                  Seus <strong>{trialTotalDays} dias gratuitos</strong> encerraram em{' '}
                  <strong>{trialEndDateFormatted}</strong>. O acesso à sua{' '}
                  <strong>Agenda, Vitrine, Serviços e Regiões</strong> foi temporariamente bloqueado.
                  Para liberar sua plataforma imediatamente, <strong>escolha um plano abaixo</strong>{' '}
                  (PIX ou Cartão) ou <strong>aplique um cupom de desconto</strong>.
                </p>
              </div>
            </div>
            <div className="w-full bg-red-200/80 h-2 rounded-full overflow-hidden">
              <div className="bg-red-600 h-full w-full rounded-full" />
            </div>
          </div>
        ) : (
          <div
            className={`p-4 rounded-2xl border ${
              subscriptionStatus === 'ACTIVE'
                ? 'bg-emerald-50/70 border-emerald-200'
                : appliedCoupon
                ? 'bg-purple-50/70 border-purple-200'
                : 'bg-amber-50/70 border-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl text-white ${
                  subscriptionStatus === 'ACTIVE'
                    ? 'bg-emerald-600'
                    : appliedCoupon
                    ? 'bg-purple-600'
                    : 'bg-amber-500'
                }`}
              >
                {subscriptionStatus === 'ACTIVE' ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : appliedCoupon ? (
                  <Gift className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="font-bold text-xs text-stone-900">
                    {subscriptionStatus === 'ACTIVE'
                      ? appliedCoupon && paymentMethod === 'COUPON'
                        ? `Acesso VIP Liberado via Cupom (${appliedCoupon})`
                        : `Assinatura Ativa (${planInterval === 'ANNUAL' ? 'Plano Anual' : 'Plano Mensal'})`
                      : appliedCoupon
                      ? `Período Gratuito Expandido • Cupom ${appliedCoupon}`
                      : `Contador do Teste Grátis (${trialTotalDays} Dias)`}
                  </h4>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      subscriptionStatus === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : appliedCoupon
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {subscriptionStatus === 'ACTIVE'
                      ? appliedCoupon && paymentMethod === 'COUPON'
                        ? `${trialDaysLeft} dias livres disponíveis`
                        : 'Plano Pago Ativo'
                      : `${trialDaysLeft} de ${trialTotalDays} ${trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'}`}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  {subscriptionStatus === 'ACTIVE'
                    ? appliedCoupon && paymentMethod === 'COUPON'
                      ? `Seu cupom liberou acesso profissional completo gratuito até ${trialEndDateFormatted}.`
                      : paymentMethod === 'PIX'
                      ? `Plano pago via PIX • Acesso completo liberado até ${trialEndDateFormatted}.`
                      : 'Seu acesso profissional está 100% liberado no Crédito Recorrente Mercado Pago.'
                    : `Aproveite seu período gratuito até ${trialEndDateFormatted}. Após os ${trialTotalDays} dias, será necessário ativar um plano ou cupom para continuar usando a plataforma.`}
                </p>

                {subscriptionStatus !== 'ACTIVE' && (
                  <div className="mt-2.5 space-y-1">
                    <div className="w-full bg-amber-200/70 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(8, Math.round((trialDaysLeft / Math.max(1, trialTotalDays)) * 100))
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CARD DE CUPOM DE PARCEIRA / ACESSO LIVRE (MVP) */}
        <div className="bg-gradient-to-r from-rose-50 via-amber-50/60 to-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-600 text-white rounded-xl shadow-2xs">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-stone-900">
                  Possui um Cupom de Parceira ou Acesso Livre?
                </h4>
                <p className="text-[11px] text-stone-600">
                  Digite seu cupom para liberar mais dias grátis ou até 1 ano livre no painel Pro
                </p>
              </div>
            </div>
            {appliedCoupon && (
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                ✅ Cupom {appliedCoupon} Ativo
              </span>
            )}
          </div>

          <form onSubmit={handleCouponSubmit} className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="Digite seu cupom"
              className="flex-1 bg-white border border-rose-200 rounded-xl px-3.5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-stone-900 placeholder:font-normal placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 shadow-xs"
            >
              Aplicar Cupom
            </button>
          </form>
        </div>

        {/* Seletor de Planos: Mensal vs Anual */}
        <div className="bg-stone-50 p-1.5 rounded-2xl border border-stone-200 flex text-xs font-bold">
          <button
            type="button"
            onClick={() => onSelectPlanInterval('MONTHLY')}
            className={`flex-1 py-2.5 rounded-xl transition cursor-pointer ${
              planInterval === 'MONTHLY'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Mensal (R$ 39,90 Cartão / R$ 44,90 PIX)
          </button>
          <button
            type="button"
            onClick={() => onSelectPlanInterval('ANNUAL')}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              planInterval === 'ANNUAL'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Anual (R$ 299,00/ano)
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
              ECONOMIZE
            </span>
          </button>
        </div>

        {/* Card do Plano Selecionado */}
        <div className="p-5 rounded-2xl border-2 border-rose-500 bg-white shadow-sm space-y-4 relative overflow-hidden">
          {planInterval === 'ANNUAL' ? (
            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-rose-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl shadow-sm">
              PIX OU CARTÃO • R$ 299,00/ANO
            </div>
          ) : (
            <div className="absolute top-0 right-0 bg-gradient-to-l from-sky-600 to-indigo-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl shadow-sm">
              RECORRENTE MERCADO PAGO
            </div>
          )}

          {planInterval === 'MONTHLY' ? (
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                  Plano BellaDoor Pro Mensal
                </span>
                <p className="text-xs text-stone-600 mt-0.5">
                  Escolha entre cobrança recorrente automática no cartão ou pagamento avulso no PIX:
                </p>
              </div>

              {/* Comparativo lado a lado: Cartão Recorrente R$ 39,90 vs PIX R$ 44,90 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div
                  onClick={() => {
                    onSelectCheckoutMethod('CARD');
                    onOpenCheckoutModal();
                  }}
                  className="p-3.5 rounded-2xl border-2 border-rose-500 bg-rose-50/40 hover:bg-rose-50/80 transition cursor-pointer relative"
                >
                  <span className="text-[9px] font-extrabold uppercase bg-rose-600 text-white px-2 py-0.5 rounded-md">
                    Mais vantajoso • Automático
                  </span>
                  <div className="flex items-center gap-1.5 mt-2">
                    <CreditCard className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-extrabold text-stone-900">
                      Cartão Crédito Recorrente
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-extrabold text-stone-900">R$ 39,90</span>
                    <span className="text-[11px] text-stone-500">/ mês</span>
                  </div>
                  <p className="text-[10px] text-stone-600 mt-1">
                    Desconta todo mês automaticamente no cartão via Mercado Pago sem ocupar seu limite.
                  </p>
                </div>

                <div
                  onClick={() => {
                    onSelectCheckoutMethod('PIX');
                    onOpenCheckoutModal();
                  }}
                  className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 hover:border-emerald-400 hover:bg-emerald-50/30 transition cursor-pointer"
                >
                  <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                    30 Dias de Acesso
                  </span>
                  <div className="flex items-center gap-1.5 mt-2">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-extrabold text-stone-900">
                      PIX Mensal (Avulso)
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-extrabold text-stone-900">R$ 44,90</span>
                    <span className="text-[11px] text-stone-500">/ mês</span>
                  </div>
                  <p className="text-[10px] text-stone-600 mt-1">
                    Pague via QR Code ou PIX Copia e Cola e libere 30 dias imediatos no painel.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                Plano BellaDoor Pro Anual (12 Meses)
              </span>
              <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
                <span className="text-3xl font-extrabold text-stone-900">R$ 299,00</span>
                <span className="text-xs text-stone-500">
                  / ano no PIX ou Cartão de Crédito (equivale a R$ 24,91/mês)
                </span>
              </div>
              <p className="text-xs text-emerald-700 font-semibold mt-1">
                Você economiza até R$ 239,80 ao ano! Mesmo valor no PIX ou no Cartão de Crédito.
              </p>
            </div>
          )}

          {/* Lista de Vantagens do Plano Pro */}
          <div className="space-y-2 pt-2 border-t border-stone-100 text-xs text-stone-700">
            {[
              'Link exclusivo e limpo na bio (bellador.web.app/?pro=seu-nome)',
              'Agendamentos a domicílio ilimitados (0% de comissão)',
              'Cálculo inteligente de deslocamento por CEP e Cidade/Bairro',
              'Liberação de avaliações verificadas somente após atendimento concluído',
              'Confirmação com mensagem pronta no WhatsApp e GPS Waze/Maps',
              'Fotos ilimitadas de portfólio na sua Vitrine',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Botões de Ação de Pagamento */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onSelectCheckoutMethod('CARD');
                onOpenCheckoutModal();
              }}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              {planInterval === 'ANNUAL'
                ? 'Pagar no Cartão • R$ 299,00/ano'
                : 'Assinar Cartão Recorrente • R$ 39,90/mês'}
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectCheckoutMethod('PIX');
                onOpenCheckoutModal();
              }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              {planInterval === 'ANNUAL'
                ? 'Pagar no PIX • R$ 299,00/ano'
                : 'Pagar no PIX • R$ 44,90/mês'}
            </button>
          </div>
        </div>

        {/* BLOCO DE GERENCIAMENTO E CANCELAMENTO DO CRÉDITO RECORRENTE (EXIBIDO SOMENTE SE ATIVOU CRÉDITO RECORRENTE MENSAL) */}
        {subscriptionStatus === 'ACTIVE' &&
          paymentMethod === 'CARD_RECURRING' &&
          planInterval === 'MONTHLY' && (
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-stone-500" />
                    Gerenciar Cobrança Recorrente no Cartão
                  </span>
                  {autoRenewCanceled ? (
                    <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                      Renovação Automática Cancelada
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-stone-200/80 text-stone-700 px-2 py-0.5 rounded-full">
                      Sem fidelidade • Cancele quando quiser
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {autoRenewCanceled
                    ? `Sua renovação mensal automática foi cancelada. Você continuará com acesso Pro completo até o final do seu período atual (${trialEndDateFormatted}) sem novas cobranças.`
                    : `Assinou o plano mensal no Cartão Recorrente (R$ 39,90/mês) e deseja cancelar as próximas cobranças? Ao cancelar, você não perde os dias já pagos e usa normalmente até ${trialEndDateFormatted}.`}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {autoRenewCanceled ? (
                  <button
                    type="button"
                    onClick={onReactivateRecurringSubscription}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-2xs"
                  >
                    Reativar Renovação Automática
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="px-3.5 py-2 bg-white hover:bg-red-50 text-stone-700 hover:text-red-700 border border-stone-300 hover:border-red-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancelar Crédito Recorrente
                  </button>
                )}
              </div>
            </div>
          )}

        {/* ==================================================================== */}
        {/* CENTRAL DE SUPORTE RÁPIDO & DÚVIDAS FREQUENTES (FAQ DE ASSINATURA)   */}
        {/* ==================================================================== */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
          <div className="space-y-3 border-b border-stone-100 pb-4">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
                💬 Atendimento Humanizado • BellaDoor
              </span>
              <h4 className="text-sm font-extrabold text-stone-900">
                Precisa de ajuda com sua assinatura ou cupom de parceria?
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Nossa equipe responde rápido no WhatsApp para tirar dúvidas sobre PIX, Cartão ou Cupons.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleContactSupportWhatsApp('Dúvida sobre Assinatura / Cupom')}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <span>💬</span>
              <span>Falar com Suporte no WhatsApp</span>
            </button>
          </div>

          {/* Selo tranquilizador de preservação dos dados */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-950 leading-relaxed">
              <strong>Garantia de Preservação de Dados:</strong> Seus dados cadastrais, fotos de portfólio, tabela de serviços, preços e regiões de atendimento continuam <strong>100% salvos e protegidos</strong> mesmo após o término dos 7 dias grátis. Assim que ativar seu plano ou cupom, sua vitrine volta ao ar imediatamente!
            </p>
          </div>

          {/* Perguntas Frequentes (Acordeão Rápido) */}
          <div className="space-y-2">
            <p className="text-[11px] font-extrabold text-stone-700 uppercase tracking-wider">
              Perguntas Frequentes (Toque para ver a resposta)
            </p>

            {[
              {
                q: '1. O Plano Mensal no Cartão (R$ 39,90/mês) consome o limite total do cartão?',
                a: 'Não! Ele funciona igual Netflix ou Spotify: desconta apenas R$ 39,90 por mês no seu cartão de crédito, sem comprometer seu limite anual e sem fidelidade. Você pode cancelar a renovação quando quiser com 1 clique.',
              },
              {
                q: '2. Em quanto tempo o pagamento via PIX libera minha Vitrine e Agenda?',
                a: 'Em poucos segundos! Após escanear o QR Code ou usar o PIX Copia e Cola no aplicativo do seu banco, basta clicar no botão verde "Já Paguei o PIX" na janela de pagamento e o sistema valida e libera sua conta na hora.',
              },
              {
                q: '3. Recebi um Cupom de Parceria. Preciso cadastrar cartão de crédito?',
                a: 'Não precisa! Basta digitar o código recebido no campo "Possui um Cupom de Parceria?" logo acima e clicar em "Aplicar Cupom". Seus dias gratuitos serão somados imediatamente sem nenhuma cobrança.',
              },
              {
                q: '4. E se meus 7 dias grátis acabarem antes de eu assinar? Perco minhas fotos e serviços?',
                a: 'Jamais! Tudo o que você configurou na sua Vitrine (fotos, bio, serviços, preços e bairros atendidos) fica 100% guardado na nuvem do BellaDoor. Quando você assinar ou aplicar um cupom, tudo volta exatamente como deixou.',
              },
            ].map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/60"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 text-xs font-bold text-stone-800 hover:bg-stone-100/80 transition cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <span className="text-stone-400 text-xs font-extrabold shrink-0">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3 pt-1 text-[11px] text-stone-600 leading-relaxed border-t border-stone-100 bg-white">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL DE CANCELAMENTO DO CRÉDITO RECORRENTE (SEM PERDER DIAS PAGOS) */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in duration-200 my-auto">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <div>
                  <h3 className="font-bold text-sm text-stone-900">
                    Cancelar Renovação Automática
                  </h3>
                  <p className="text-[10px] text-stone-500">
                    Você mantém 100% dos seus dias já pagos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1.5">
              <p className="font-extrabold">
                ✅ Seus dias já pagos continuam garantidos!
              </p>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Ao cancelar o <strong>Crédito Recorrente (R$ 39,90/mês)</strong>, sua Vitrine e sua Agenda continuarão <strong>100% liberadas até {trialEndDateFormatted}</strong> ({trialDaysLeft} dias restantes). Nenhuma nova cobrança será feita após essa data.
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  onCancelRecurringSubscription();
                }}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                Confirmar Cancelamento da Renovação no BellaDoor
              </button>

              <a
                href="https://www.mercadopago.com.br/subscriptions"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                Abrir Minhas Assinaturas no Mercado Pago (Encerrar no Cartão){' '}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Voltar e Manter Assinatura Recorrente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CHECKOUT MERCADO PAGO (PIX & CARTÃO RECORRENTE) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in duration-200 my-auto">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">💳</span>
                <div>
                  <h3 className="font-bold text-sm text-stone-900">
                    Checkout Seguro • Mercado Pago
                  </h3>
                  <p className="text-[10px] text-stone-500">
                    Liberação automática da sua Vitrine e Agenda Pro
                  </p>
                </div>
              </div>
              <button
                onClick={onCloseCheckoutModal}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Seletor Rápido do Ciclo dentro do Modal */}
            <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => onSelectPlanInterval('MONTHLY')}
                className={`py-2 rounded-lg transition cursor-pointer ${
                  planInterval === 'MONTHLY'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Plano Mensal
              </button>
              <button
                type="button"
                onClick={() => onSelectPlanInterval('ANNUAL')}
                className={`py-2 rounded-lg transition cursor-pointer ${
                  planInterval === 'ANNUAL'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Plano Anual (R$ 299)
              </button>
            </div>

            {/* Abas de Pagamento: Cartão vs PIX */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => onSelectCheckoutMethod('CARD')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  checkoutMethod === 'CARD'
                    ? 'bg-rose-50 border-rose-500 text-rose-900 ring-1 ring-rose-500'
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-rose-600" />
                  <span>{planInterval === 'ANNUAL' ? 'Cartão (Pagamento Único)' : 'Cartão Recorrente'}</span>
                </div>
                <span className="text-[11px] font-extrabold text-rose-600">
                  R$ {planInterval === 'ANNUAL' ? '299,00/ano' : '39,90/mês'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectCheckoutMethod('PIX')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  checkoutMethod === 'PIX'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>PIX Instantâneo</span>
                </div>
                <span className="text-[11px] font-extrabold text-emerald-600">
                  R$ {planInterval === 'ANNUAL' ? '299,00/ano' : '44,90/mês'}
                </span>
              </button>
            </div>

            {/* Resumo do Valor Selecionado */}
            <div className="bg-stone-900 text-white p-3.5 rounded-2xl flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-white">
                  {planInterval === 'ANNUAL'
                    ? `Plano Anual (${checkoutMethod === 'PIX' ? 'PIX' : 'Cartão de Crédito'})`
                    : checkoutMethod === 'CARD'
                    ? 'Plano Mensal • Crédito Recorrente'
                    : 'Plano Mensal • PIX (30 dias)'}
                </p>
                <p className="text-[10px] text-stone-300 mt-0.5">
                  {planInterval === 'ANNUAL'
                    ? '12 meses completos de acesso (R$ 24,91/mês)'
                    : checkoutMethod === 'CARD'
                    ? 'Desconta R$ 39,90 todo mês automaticamente no cartão'
                    : 'Libera 30 dias completos sem renovação automática'}
                </p>
              </div>
              <span className="text-lg font-extrabold text-emerald-400 shrink-0 ml-2">
                R$ {formattedCheckoutAmount}
              </span>
            </div>

            {mpApiError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2 rounded-xl text-[11px] font-medium">
                ⚠️ {mpApiError}
              </div>
            )}

            {/* Tela de PIX */}
            {checkoutMethod === 'PIX' ? (
              <div className="space-y-3 text-center">
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 inline-block mx-auto relative">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      activePixCode
                    )}`}
                    alt="QR Code PIX Mercado Pago"
                    className="w-36 h-36 mx-auto rounded-lg"
                  />
                </div>

                {hasMpApiToken && (
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-xl">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    Aguardando confirmação automática na sua conta Mercado Pago...
                  </div>
                )}

                <p className="text-[11px] text-stone-600">
                  Escaneie o QR Code acima no app do seu banco ou copie o código{' '}
                  <strong>PIX Copia e Cola</strong> no valor de{' '}
                  <strong>R$ {formattedCheckoutAmount}</strong>:
                </p>

                <div className="bg-stone-100 p-2.5 rounded-xl flex items-center justify-between text-xs border border-stone-200">
                  <span className="text-[10px] text-stone-600 truncate mr-2 font-mono">
                    {activePixCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(activePixCode);
                      onShowUiDialog({
                        emoji: '📋',
                        badge: 'PIX Copia e Cola • Mercado Pago',
                        title: `Código PIX de R$ ${formattedCheckoutAmount} Copiado!`,
                        message:
                          'Abra o aplicativo do seu banco, escolha a opção PIX Copia e Cola e cole o código copiado para concluir sua assinatura.',
                        highlight: `Valor: R$ ${formattedCheckoutAmount} (${
                          planInterval === 'ANNUAL' ? 'Plano Anual 365 dias' : 'Plano Mensal 30 dias'
                        })`,
                        buttonText: 'Perfeito, vou colar no banco',
                        variant: 'success',
                      });
                    }}
                    className="text-xs text-rose-600 font-extrabold hover:underline shrink-0 cursor-pointer"
                  >
                    Copiar Código
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    disabled={isPaymentProcessing || mpLoadingApi}
                    onClick={hasMpApiToken ? onVerifyMercadoPagoNow : onConfirmPaymentSimulation}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    {isPaymentProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verificando Pagamento no Mercado Pago...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        {`Já Paguei o PIX de R$ ${formattedCheckoutAmount} (Verificar Agora)`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Tela de Cartão de Crédito Mercado Pago */
              <div className="space-y-3 text-xs text-left">
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-[11px] text-sky-900 space-y-1">
                  <p className="font-extrabold text-sky-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                    {planInterval === 'MONTHLY'
                      ? `Assinatura Automática Mensal (R$ ${formattedCheckoutAmount}/mês)`
                      : `Pagamento Único Anual no Cartão (R$ ${formattedCheckoutAmount})`}
                  </p>
                  <p className="text-sky-800 leading-relaxed">
                    {planInterval === 'MONTHLY'
                      ? `Ao clicar abaixo, abrirá a página segura do Mercado Pago para digitar os dados do cartão de crédito. O valor de R$ ${formattedCheckoutAmount} será cobrado automaticamente todo mês.`
                      : `Ao clicar abaixo, abrirá o Checkout Seguro do Mercado Pago para digitar os dados do cartão e pagar R$ ${formattedCheckoutAmount} (à vista ou parcelado) com liberação de 1 ano.`}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={mpLoadingApi || isPaymentProcessing}
                  onClick={handleStartRecurringCardSubscription}
                  className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  {mpLoadingApi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Abrindo Checkout do Cartão no Mercado Pago...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      {planInterval === 'ANNUAL'
                        ? `Digitar Cartão no Mercado Pago (R$ ${formattedCheckoutAmount} Único)`
                        : `Digitar Cartão no Mercado Pago (R$ ${formattedCheckoutAmount}/mês)`}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                {/* Botão auxiliar exclusivo para o administrador testar logado na conta Mercado Pago */}
                {isMasterAdmin && (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-stone-600 leading-tight">
                      💡 <strong>Testando como dono da conta?</strong> Copie o link e abra em uma{' '}
                      <strong>Janela Anônima</strong> para ver os campos de digitar o cartão:
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        let urlToCopy = lastOpenedCheckoutUrl;
                        if (!urlToCopy) {
                          if (planInterval === 'MONTHLY') {
                            urlToCopy = getMercadoPagoRecurringSubscriptionUrl({
                              customUrl: mpConfig.recurringMonthlyCardUrl,
                              testModeOneReal: isTestPriceMode,
                            });
                          } else if (hasMpApiToken) {
                            setMpLoadingApi(true);
                            const res = await createMercadoPagoAnnualSingleCardCheckout({
                              accessToken: mpConfig.mpAccessToken || '',
                              payerEmail: userEmail || 'profissional@belladoor.app',
                              payerName: userFullName || 'Profissional BellaDoor',
                              returnUrl: `${window.location.origin}/?mp_subscription=verified`,
                              amount: currentCheckoutAmount,
                            });
                            setMpLoadingApi(false);
                            urlToCopy = res.initPoint || null;
                          }
                        }
                        if (urlToCopy) {
                          setLastOpenedCheckoutUrl(urlToCopy);
                          navigator.clipboard?.writeText(urlToCopy);
                          onShowUiDialog({
                            emoji: '🔗',
                            badge: 'Link do Cartão Copiado',
                            title: 'Abra em uma Janela Anônima para Testar!',
                            message:
                              'Como o navegador atual está logado na sua própria conta recebedora do Mercado Pago, cole este link em uma Janela Anônima (Ctrl+Shift+N ou Ctrl+Shift+P) para ver exatamente a tela de digitar o cartão que suas clientes verão.',
                            highlight: urlToCopy,
                            buttonText: 'Entendi',
                            variant: 'success',
                          });
                        }
                      }}
                      className="px-2.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-[10px] font-extrabold shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copiar Link
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isPaymentProcessing}
                  onClick={hasMpApiToken ? onVerifyMercadoPagoNow : onConfirmPaymentSimulation}
                  className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-stone-600 ${isPaymentProcessing ? 'animate-spin' : ''}`} />
                  Já paguei com Cartão no Mercado Pago • Validar e Liberar Acesso
                </button>
              </div>
            )}

            {/* Rodapé de ajuda rápida dentro do Checkout */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2 text-[11px] text-stone-500">
              <span>Dificuldade no pagamento ou liberação?</span>
              <button
                type="button"
                onClick={() =>
                  handleContactSupportWhatsApp(
                    `Ajuda no Checkout (${checkoutMethod === 'PIX' ? 'PIX' : 'Cartão'} - R$ ${formattedCheckoutAmount})`
                  )
                }
                className="font-extrabold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>💬</span> Falar com Suporte no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
