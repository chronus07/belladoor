import React from 'react';
import {
  CheckCircle,
  Clock,
  CreditCard,
  Loader2,
  QrCode,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { UiDialogPayload } from '../types/belladoor';

interface ProBillingTabProps {
  subscriptionStatus: 'TRIAL' | 'ACTIVE';
  planInterval: 'MONTHLY' | 'ANNUAL';
  showCheckoutModal: boolean;
  checkoutMethod: 'PIX' | 'CARD';
  isPaymentProcessing: boolean;
  onSelectPlanInterval: (interval: 'MONTHLY' | 'ANNUAL') => void;
  onOpenCheckoutModal: () => void;
  onCloseCheckoutModal: () => void;
  onSelectCheckoutMethod: (method: 'PIX' | 'CARD') => void;
  onToggleSimulationStatus: () => void;
  onConfirmPaymentSimulation: () => void;
  onShowUiDialog: (dialog: UiDialogPayload) => void;
}

export const ProBillingTab: React.FC<ProBillingTabProps> = ({
  subscriptionStatus,
  planInterval,
  showCheckoutModal,
  checkoutMethod,
  isPaymentProcessing,
  onSelectPlanInterval,
  onOpenCheckoutModal,
  onCloseCheckoutModal,
  onSelectCheckoutMethod,
  onToggleSimulationStatus,
  onConfirmPaymentSimulation,
  onShowUiDialog,
}) => {
  return (
    <>
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-sm text-stone-900">Assinatura BellaDoor Pro</h3>
          <p className="text-xs text-stone-500">
            Gerencie sua mensalidade e desbloqueie agendamentos ilimitados
          </p>
        </div>

        {/* Status Atual da Conta */}
        <div
          className={`p-4 rounded-2xl border ${
            subscriptionStatus === 'ACTIVE'
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-amber-50/70 border-amber-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl text-white ${
                subscriptionStatus === 'ACTIVE' ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
            >
              {subscriptionStatus === 'ACTIVE' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-stone-900">
                  {subscriptionStatus === 'ACTIVE'
                    ? `Assinatura Ativa (${planInterval === 'ANNUAL' ? 'Plano Anual' : 'Plano Mensal'})`
                    : 'Período de Testes Ativo'}
                </h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    subscriptionStatus === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {subscriptionStatus === 'ACTIVE' ? 'Regular' : '12 dias restantes'}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1">
                {subscriptionStatus === 'ACTIVE'
                  ? 'Seu acesso profissional está 100% liberado com renovação automática.'
                  : 'Aproveite seu período de teste grátis sem compromisso até 19/10/2026.'}
              </p>
            </div>
          </div>
        </div>

        {/* Seletor de Planos: Mensal vs Anual */}
        <div className="bg-stone-50 p-1.5 rounded-2xl border border-stone-200 flex text-xs font-bold">
          <button
            type="button"
            onClick={() => onSelectPlanInterval('ANNUAL')}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              planInterval === 'ANNUAL'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Anual (R$ 299/ano)
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
              -37% OFF
            </span>
          </button>
          <button
            type="button"
            onClick={() => onSelectPlanInterval('MONTHLY')}
            className={`flex-1 py-2.5 rounded-xl transition ${
              planInterval === 'MONTHLY'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Mensal (R$ 39,90/mês)
          </button>
        </div>

        {/* Card do Plano Selecionado */}
        <div className="p-5 rounded-2xl border-2 border-rose-500 bg-white shadow-sm space-y-4 relative overflow-hidden">
          {planInterval === 'ANNUAL' && (
            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-rose-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl shadow-sm">
              MAIS ECONÔMICO
            </div>
          )}

          <div>
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              {planInterval === 'ANNUAL' ? 'Plano BellaDoor Pro Anual' : 'Plano BellaDoor Pro Mensal'}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-stone-900">
                R$ {planInterval === 'ANNUAL' ? '299,00' : '39,90'}
              </span>
              <span className="text-xs text-stone-500">
                {planInterval === 'ANNUAL' ? '/ ano (apenas R$ 24,91/mês)' : '/ mês'}
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1">
              {planInterval === 'ANNUAL'
                ? 'Você economiza R$ 179,80 ao ano em relação ao plano mensal!'
                : 'Cobrança mensal sem fidelidade, cancele quando desejar.'}
            </p>
          </div>

          {/* Lista de Vantagens do Plano Pro */}
          <div className="space-y-2 pt-2 border-t border-stone-100 text-xs text-stone-700">
            {[
              'Link exclusivo e limpo na bio (belladoor.app/seu-nome)',
              'Agendamentos a domicílio ilimitados',
              'Cálculo inteligente de deslocamento e trânsito',
              'Configuração de taxas por bairro atendido',
              'Confirmação com mensagem pronta no WhatsApp',
              'Navegação GPS 1-toque com Waze e Google Maps',
              'Fotos ilimitadas de portfólio',
              'Suporte prioritário da equipe BellaDoor',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Botão de Ação de Pagamento */}
          <div className="pt-2">
            <button
              onClick={onOpenCheckoutModal}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              <Zap className="w-4 h-4" />
              {subscriptionStatus === 'ACTIVE'
                ? 'Alterar Forma de Pagamento / Plano'
                : `Ativar Assinatura por R$ ${planInterval === 'ANNUAL' ? '299,00' : '39,90'}`}
            </button>
          </div>
        </div>

        {/* Reset para testes (Caso o usuário queira alternar) */}
        <div className="text-center pt-2">
          <button
            onClick={onToggleSimulationStatus}
            className="text-[11px] text-stone-400 hover:text-stone-700 underline"
          >
            [Simular Alternância: Mudar para{' '}
            {subscriptionStatus === 'ACTIVE' ? 'Modo Teste' : 'Assinante Ativo'}]
          </button>
        </div>
      </div>

      {/* MODAL DE CHECKOUT / PAGAMENTO SAAS (PIX & CARTÃO) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">💳</span>
                <h3 className="font-bold text-sm text-stone-900">Assinatura BellaDoor Pro</h3>
              </div>
              <button
                onClick={onCloseCheckoutModal}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Valor a pagar */}
            <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-100 flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-stone-900">
                  {planInterval === 'ANNUAL' ? 'Plano Anual' : 'Plano Mensal'}
                </p>
                <p className="text-[11px] text-stone-500">Acesso profissional completo</p>
              </div>
              <span className="text-base font-extrabold text-rose-600">
                R$ {planInterval === 'ANNUAL' ? '299,00' : '39,90'}
              </span>
            </div>

            {/* Abas de Pagamento: PIX vs Cartão */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => onSelectCheckoutMethod('PIX')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition ${
                  checkoutMethod === 'PIX'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                PIX (Instantâneo)
              </button>
              <button
                type="button"
                onClick={() => onSelectCheckoutMethod('CARD')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition ${
                  checkoutMethod === 'CARD'
                    ? 'bg-rose-50 border-rose-500 text-rose-800'
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}
              >
                <CreditCard className="w-4 h-4 text-rose-600" />
                Cartão de Crédito
              </button>
            </div>

            {/* Tela de PIX */}
            {checkoutMethod === 'PIX' ? (
              <div className="space-y-3 text-center">
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 inline-block mx-auto">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020126580014br.gov.bcb.pix0136belladoor@belladoor.app"
                    alt="QR Code PIX"
                    className="w-36 h-36 mx-auto rounded-lg"
                  />
                </div>
                <p className="text-[11px] text-stone-500">
                  Abra o app do seu banco, escolha <strong>Pagar via Pix</strong> e aponte a câmera
                  para o QR Code acima.
                </p>

                <div className="bg-stone-100 p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-[11px] text-stone-500 truncate mr-2 font-mono">
                    00020126580014br.gov.bcb.pix0136belladoor...
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        '00020126580014br.gov.bcb.pix0136belladoor-pagamentos@belladoor.app520400005303986'
                      );
                      onShowUiDialog({
                        emoji: '📋',
                        badge: 'PIX Copia e Cola',
                        title: 'Código PIX Copiado!',
                        message:
                          'A chave PIX Copia e Cola foi copiada para a sua área de transferência. Abra o aplicativo do seu banco e cole na opção PIX Copia e Cola.',
                        highlight: '00020126580014br.gov.bcb.pix0136belladoor...',
                        buttonText: 'Perfeito, vou colar no banco',
                        variant: 'success',
                      });
                    }}
                    className="text-xs text-rose-600 font-bold hover:underline shrink-0 cursor-pointer"
                  >
                    Copiar Código
                  </button>
                </div>
              </div>
            ) : (
              /* Tela de Cartão */
              <div className="space-y-2.5 text-xs text-left">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Número do Cartão:
                  </label>
                  <input
                    type="text"
                    placeholder="4532 •••• •••• 9812"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Validade:
                    </label>
                    <input
                      type="text"
                      placeholder="MM/AA"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">CVV:</label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Nome no Cartão:
                  </label>
                  <input
                    type="text"
                    placeholder="Como impresso no cartão"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Botão de Confirmação Simulada */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isPaymentProcessing}
                onClick={onConfirmPaymentSimulation}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                {isPaymentProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando Pagamento...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Simular Confirmação de Pagamento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
