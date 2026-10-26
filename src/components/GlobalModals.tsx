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
            <div className="text-center pt-1">
              <span className="text-3xl block">✨</span>
              <h3 className="font-extrabold text-base sm:text-lg text-stone-900 mt-1">
                Bem-vinda ao BellaDoor Pro, {userFullName || 'Profissional'}!
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Escolha abaixo como deseja iniciar o acesso à sua Vitrine e Agenda:
              </p>
            </div>

            {/* OPÇÃO 1: 7 DIAS GRÁTIS */}
            <div className="bg-emerald-50/80 border-2 border-emerald-300/80 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Opção 1: Período de Teste Grátis
                </span>
                <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                  Sem Cartão Hoje
                </span>
              </div>
              <p className="text-xs text-emerald-950 font-medium leading-snug">
                Experimente a plataforma livremente por <strong>7 dias gratuitos</strong> com acesso completo a todas as ferramentas.
              </p>
              <button
                type="button"
                onClick={onActivateFreeTrial}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                Utilizar 7 Dias Grátis e Abrir Assistente 🚀
              </button>
            </div>

            {/* OPÇÃO 2: CUPOM DE DESCONTO / PARCERIA */}
            {onApplyCouponFromModal && (
              <div className="bg-amber-50/80 border border-amber-300/80 p-3.5 rounded-2xl space-y-2">
                <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-amber-600" />
                  Opção 2: Ativar com Cupom de Desconto
                </span>
                <p className="text-xs text-stone-700">
                  Tem um cupom de parceria ou convite especial? Digite seu código:
                </p>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={modalCoupon}
                    onChange={(e) => setModalCoupon(e.target.value.toUpperCase())}
                    placeholder="Digite seu cupom"
                    className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-black uppercase text-stone-900 placeholder:font-normal placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (modalCoupon.trim()) {
                        onApplyCouponFromModal(modalCoupon.trim().toUpperCase());
                        setModalCoupon('');
                      }
                    }}
                    className="px-3.5 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-[11px] font-extrabold transition cursor-pointer shrink-0 shadow-xs"
                  >
                    Ativar Cupom
                  </button>
                </div>
              </div>
            )}

            {/* OPÇÃO 3: FAZER O PAGAMENTO AGORA */}
            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl space-y-2.5">
              <span className="text-[11px] font-black text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>💳</span>
                Opção 3: Fazer o Pagamento Agora
              </span>

              <div className="grid grid-cols-2 gap-2">
                {/* Plano Anual */}
                <div
                  onClick={() => onSelectTrialPlan('ANNUAL')}
                  className={`p-2.5 rounded-xl border-2 cursor-pointer transition relative ${
                    selectedTrialPlan === 'ANNUAL'
                      ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <span className="text-[9px] font-extrabold text-rose-600 block">PIX ou Cartão</span>
                  <p className="font-extrabold text-xs text-stone-900">Plano Anual</p>
                  <p className="text-xs font-black text-rose-600">R$ 299/ano</p>
                  <p className="text-[10px] text-stone-500">R$ 24,91/mês</p>
                </div>

                {/* Plano Mensal */}
                <div
                  onClick={() => onSelectTrialPlan('MONTHLY')}
                  className={`p-2.5 rounded-xl border-2 cursor-pointer transition ${
                    selectedTrialPlan === 'MONTHLY'
                      ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <span className="text-[9px] font-extrabold text-stone-500 block">Recorrente</span>
                  <p className="font-extrabold text-xs text-stone-900">Plano Mensal</p>
                  <p className="text-xs font-black text-stone-900">R$ 39,90/mês</p>
                  <p className="text-[10px] text-stone-500">Cartão de Crédito</p>
                </div>
              </div>

              {onPayNowFromModal && (
                <button
                  type="button"
                  onClick={onPayNowFromModal}
                  className="w-full py-2.5 bg-stone-900 hover:bg-black text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <span>Pagar Plano {selectedTrialPlan === 'ANNUAL' ? 'Anual (R$ 299)' : 'Mensal (R$ 39,90)'} Agora 💳</span>
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
