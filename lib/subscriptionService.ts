// ==============================================================================
// BELLADOOR - SERVIÇO DE ASSINATURAS SAAS E COBRANÇA RECORRENTE
// Suporte a PIX Recorrente e Cartão de Crédito (Asaas / Mercado Pago)
// ==============================================================================

export interface PlanConfig {
  id: 'MONTHLY' | 'ANNUAL';
  name: string;
  price: number;
  interval: 'month' | 'year';
  description: string;
  discountBadge?: string;
  features: string[];
}

export const BELLADOOR_PLANS: Record<'MONTHLY' | 'ANNUAL', PlanConfig> = {
  MONTHLY: {
    id: 'MONTHLY',
    name: 'Plano Pro Mensal',
    price: 39.90,
    interval: 'month',
    description: 'Flexibilidade total, cancele quando quiser.',
    features: [
      'Link público exclusivo na bio (belladoor.app/seu-nome)',
      'Agendamentos a domicílio ilimitados',
      'Cálculo de margem de deslocamento entre clientes',
      'Configuração de taxas por bairro atendido',
      'Confirmação direta no WhatsApp com endereço formatado',
      'Navegação GPS (Waze e Google Maps) em 1 clique',
      'Fotos de portfólio e catálogo de serviços',
    ],
  },
  ANNUAL: {
    id: 'ANNUAL',
    name: 'Plano Pro Anual',
    price: 299.00,
    interval: 'year',
    discountBadge: 'Economize mais de 37% (Apenas R$ 24,91/mês)',
    description: 'Mais econômico, faturamento em parcela única.',
    features: [
      'Tudo incluído no Plano Mensal',
      'Economia de R$ 179,80 ao ano',
      'Selo VIP Ouro no perfil de atendimento',
      'Acesso antecipado aos recursos de aplicativo mobile',
      'Suporte prioritário via WhatsApp',
    ],
  },
};

/**
 * Simulação de geração de cobrança PIX com QR Code dinâmico
 */
export function generatePixCheckout(planId: 'MONTHLY' | 'ANNUAL', professionalName: string) {
  const plan = BELLADOOR_PLANS[planId];
  return {
    qrCodeText: `00020126580014br.gov.bcb.pix0136belladoor-pagamentos@belladoor.app520400005303986540${plan.price.toFixed(2)}5802BR5925BELLADOOR TECNOLOGIA LTDA6009SAO PAULO62070503***6304ABCD`,
    qrCodeImage: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=belladoor_pix_simulado',
    amount: plan.price,
    planName: plan.name,
    expiresInMinutes: 30,
  };
}
