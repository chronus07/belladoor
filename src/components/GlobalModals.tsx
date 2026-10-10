import React, { useState } from 'react';
import { CheckCircle, ShieldCheck, Ticket, X, Zap } from 'lucide-react';
import { UiDialogPayload } from '../types/belladoor';

interface GlobalModalsProps {
  showTrialModal: boolean;
  userFullName?: string;
  selectedTrialPlan: 'MONTHLY' | 'ANNUAL';
  uiDialog: UiDialogPayload | null;
  onCloseTrialModal: () => void;
  onSelectTrialPlan: (plan: 'MONTHLY' | 'ANNUAL') => void;
  onActivateFreeTrial: () => void;
  onApplyCouponFromModal?: (code: string) => void;
  onPayNowFromModal?: () => void;
  onCloseUiDialog: () => void;
}

export const GlobalModals: React.FC<GlobalModalsProps> = ({
  showTrialModal,
  userFullName,
  selectedTrialPlan,
  uiDialog,
  onCloseTrialModal,
  onSelectTrialPlan,
  onActivateFreeTrial,
  onApplyCouponFromModal,
  onPayNowFromModal,
  onCloseUiDialog,
}) => {
  const [modalCoupon, setModalCoupon] = useState('');

  return (
    <>
      {/* ============================================================ */}
      {/* MODAL: ONBOARDING PROFISSIONAL & TESTE GRÁTIS DE 7 DIAS     */}
      {/* ============================================================ */}
      {showTrialModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative border border-stone-200 my-auto">
            {/* Fechar */}
            <button
              type="button"
              onClick={onCloseTrialModal}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cabeçalho de Boas-Vindas */}
            <div className="text-center pt-2">
              <span className="text-4xl block">🎉</span>
              <h3 className="font-extrabold text-lg text-stone-900 mt-1">
                Bem-vinda ao BellaDoor Pro, {userFullName || 'Profissional'}!
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Escolha como deseja ativar sua conta profissional para iniciar o <strong>Assistente Passo a Passo da sua Vitrine</strong>:
              </p>
            </div>

            {/* Comparativo dos 2 Planos */}
            <div className="space-y-2.5 pt-1">
              {/* Plano Anual */}
              <div
                onClick={() => onSelectTrialPlan('ANNUAL')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition relative ${
                  selectedTrialPlan === 'ANNUAL'
                    ? 'border-rose-500 bg-rose-50/60 shadow-sm'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <span className="absolute -top-2.5 right-3 bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                  PIX ou Cartão (Mais Econômico)
                </span>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-sm text-stone-900">Plano Anual</h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Equivale a apenas <strong>R$ 24,91/mês</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-stone-900">R$ 299,00</span>
                    <span className="text-[10px] text-stone-500 block">/ano no PIX ou Cartão</span>
                  </div>
                </div>
              </div>

              {/* Plano Mensal */}
              <div
                onClick={() => onSelectTrialPlan('MONTHLY')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                  selectedTrialPlan === 'MONTHLY'
                    ? 'border-rose-500 bg-rose-50/60 shadow-sm'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-sm text-stone-900">Plano Mensal</h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      R$ 39,90 Cartão Recorrente • R$ 44,90 PIX
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-stone-900">R$ 39,90</span>
                    <span className="text-[10px] text-stone-500 block">/mês no cartão</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Campo Rápido de Cupom de Parceria no Onboarding */}
            {onApplyCouponFromModal && (
              <div className="bg-rose-50/70 border border-rose-200 p-3 rounded-2xl space-y-2">
                <p className="text-[11px] font-extrabold text-stone-800 flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-rose-600" />
                  Opção 1: Ativar com Cupom de Desconto / Parceria
                </p>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={modalCoupon}
                    onChange={(e) => setModalCoupon(e.target.value.toUpperCase())}
                    placeholder="Digite seu cupom"
                    className="flex-1 bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs font-extrabold uppercase text-stone-900 placeholder:font-normal placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (modalCoupon.trim()) {
                        onApplyCouponFromModal(modalCoupon.trim().toUpperCase());
                        setModalCoupon('');
                      }
                    }}
                    className="px-3 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-[11px] font-extrabold transition cursor-pointer shrink-0"
                  >
                    Ativar Cupom
                  </button>
                </div>
              </div>
            )}

            {/* Garantia do Teste Grátis */}
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl space-y-1.5 text-xs text-emerald-950">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Garantia de 7 Dias de Teste Gratuito:</span>
              </div>
              <ul className="text-[11px] space-y-1 text-emerald-800 pl-5 list-disc">
                <li>
                  Em seguida, nosso <strong>Assistente Passo a Passo</strong> te guiará para configurar sua Vitrine, Portfólio, Serviços e Taxas.
                </li>
                <li>Nenhum valor será cobrado no seu teste grátis hoje.</li>
              </ul>
            </div>

            {/* Botões de Ativação: Teste Grátis 7 Dias ou Pagar Agora */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={onActivateFreeTrial}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                Usar Plano Gratuito de 7 Dias e Configurar Conta 🚀
              </button>

              {onPayNowFromModal && (
                <button
                  type="button"
                  onClick={onPayNowFromModal}
                  className="w-full py-3 bg-stone-900 hover:bg-black text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <span>💳</span>
                  <span>
                    Fazer o Pagamento Agora (
                    {selectedTrialPlan === 'ANNUAL' ? 'R$ 299,00/ano' : 'a partir de R$ 39,90/mês'})
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* JANELINHA / MODAL GLOBAL NO PADRÃO VISUAL BELLADOOR          */}
      {/* ============================================================ */}
      {uiDialog && (
        <div
          onClick={onCloseUiDialog}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-stone-200 relative"
          >
            {/* Topo Estilizado na Identidade Visual */}
            <div
              className={`p-5 text-center relative ${
                uiDialog.variant === 'success'
                  ? 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-stone-900 text-white'
                  : uiDialog.variant === 'warning'
                  ? 'bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 text-white'
                  : uiDialog.variant === 'amber'
                  ? 'bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 text-white'
                  : 'bg-gradient-to-br from-rose-950 via-rose-900 to-stone-900 text-white'
              }`}
            >
              <button
                type="button"
                onClick={onCloseUiDialog}
                className="absolute top-3.5 right-3.5 p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-3xl shadow-inner mb-2.5">
                {uiDialog.emoji}
              </div>

              {uiDialog.badge && (
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/15 text-white border border-white/20 mb-1.5">
                  {uiDialog.badge}
                </span>
              )}

              <h3 className="font-extrabold text-base sm:text-lg text-white leading-snug">
                {uiDialog.title}
              </h3>
            </div>

            {/* Corpo da Janelinha */}
            <div className="p-5 space-y-4 text-center">
              <p className="text-xs text-stone-600 leading-relaxed">{uiDialog.message}</p>

              {uiDialog.highlight && (
                <div
                  className={`p-3 rounded-2xl border text-xs font-bold ${
                    uiDialog.variant === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : uiDialog.variant === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : uiDialog.variant === 'amber'
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {uiDialog.highlight}
                </div>
              )}

              <button
                type="button"
                onClick={onCloseUiDialog}
                className={`w-full py-3 rounded-2xl font-extrabold text-xs text-white shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  uiDialog.variant === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : uiDialog.variant === 'warning'
                    ? 'bg-stone-900 hover:bg-black'
                    : uiDialog.variant === 'amber'
                    ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-black'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <CheckCircle className={`w-4 h-4 ${uiDialog.variant === 'amber' ? 'text-stone-950' : 'text-white'}`} />
                {uiDialog.buttonText || 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
