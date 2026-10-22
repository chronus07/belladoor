import React from 'react';
import { ArrowLeft, Calendar, LogOut, ShieldCheck } from 'lucide-react';
import { AuthUser } from '../../lib/supabaseClient';

interface HeaderBarProps {
  currentUser: AuthUser | null;
  activeTab: 'client' | 'pro';
  clientSubView: 'EXPLORE' | 'MY_BOOKINGS';
  showAdminPanel?: boolean;
  isProTrialExpired?: boolean;
  isProVitrinePreview?: boolean;
  activeAppointmentsCount: number;
  proDisplayName: string;
  proAvatarUrl: string;
  onToggleClientSubView: () => void;
  onToggleProPreview: () => void;
  onExitVitrinePreview?: () => void;
  onEnterClientMode?: () => void;
  onToggleAdminPanel?: () => void;
  onLogout: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentUser,
  activeTab,
  clientSubView,
  showAdminPanel = false,
  isProTrialExpired = false,
  isProVitrinePreview = false,
  activeAppointmentsCount,
  proDisplayName,
  proAvatarUrl,
  onToggleClientSubView,
  onToggleProPreview,
  onExitVitrinePreview,
  onEnterClientMode,
  onToggleAdminPanel,
  onLogout,
}) => {
  const isMasterAdmin =
    Boolean(
      currentUser?.email &&
        currentUser.email.trim().toLowerCase() === 'evertonrcsilva@gmail.com'
    ) ||
    Boolean(
      currentUser?.fullName &&
        currentUser.fullName.trim().toLowerCase().includes('everton')
    ) ||
    Boolean(
      currentUser?.role === 'PROFESSIONAL' &&
        proDisplayName &&
        proDisplayName.trim().toLowerCase().includes('everton')
    );

  return (
    <header className="w-full bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-1 sm:gap-4 min-h-[56px] sm:min-h-[62px]">
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          {/* Ícone Oficial BellaDoor (Arco Dourado/Rose com Folha e Brilho) */}
          <svg
            viewBox="0 0 64 64"
            className="w-7 h-7 sm:w-9 sm:h-9 shrink-0 drop-shadow-2xs"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Logo BellaDoor"
          >
            <defs>
              <linearGradient id="belladoorGrad" x1="8" y1="56" x2="56" y2="8" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#d99b43" />
                <stop offset="48%" stopColor="#e06350" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
            </defs>
            {/* Arco da Porta */}
            <path
              d="M14 56V28C14 16.9543 22.0589 8 32 8C41.9411 8 50 16.9543 50 28C50 37.5 42.5 43.5 31 44.5C21.5 45.3 15.5 50.5 14 56Z"
              stroke="url(#belladoorGrad)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Base e lateral direita da Porta */}
            <path
              d="M14 56H50V39"
              stroke="url(#belladoorGrad)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Pétala / Folha Elegante */}
            <path
              d="M30 44C30 35.5 38.5 30.5 48.5 27.5C46.5 37 40 43.5 30 44Z"
              stroke="url(#belladoorGrad)"
              strokeWidth="3.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M34 40.5C37.5 38 40.5 35.5 43 33"
              stroke="url(#belladoorGrad)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            {/* Estrela Principal (Brilho de Beleza) */}
            <path
              d="M31 15C31.7 20.3 33.7 22.3 39 23C33.7 23.7 31.7 25.7 31 31C30.3 25.7 28.3 23.7 23 23C28.3 22.3 30.3 20.3 31 15Z"
              fill="url(#belladoorGrad)"
            />
            {/* Estrela Menor */}
            <path
              d="M38.5 13.5C38.8 15.6 39.6 16.4 41.7 16.7C39.6 17 38.8 17.8 38.5 19.9C38.2 17.8 37.4 17 35.3 16.7C37.4 16.4 38.2 15.6 38.5 13.5Z"
              fill="url(#belladoorGrad)"
            />
          </svg>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-extrabold text-base sm:text-xl tracking-tight text-stone-900">
              Bella<span className="text-rose-600">Door</span>
            </span>
            <span className="hidden md:inline-block text-[11px] sm:text-xs px-2.5 py-0.5 bg-rose-50 text-rose-700 rounded-full font-medium border border-rose-200">
              A beleza na sua porta
            </span>
          </div>
        </div>

        {/* LADO DIREITO: PERFIL E SAIR (SOMENTE QUANDO LOGADO) */}
        {currentUser && (
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Botão Exclusivo de Administração de Usuários (Somente evertonrcsilva@gmail.com) */}
            {isMasterAdmin && onToggleAdminPanel && (
              <button
                type="button"
                onClick={onToggleAdminPanel}
                className={`text-[9px] sm:text-xs font-extrabold px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-xl transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 border shadow-xs shrink-0 ${
                  showAdminPanel
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-stone-900 hover:bg-black text-amber-300 border-stone-800'
                }`}
                title="Painel exclusivo de administração (Usuários, Cupons e Mercado Pago)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span className="sm:hidden leading-none font-bold">{showAdminPanel ? 'Fechar' : 'Admin'}</span>
                <span className="hidden sm:inline">{showAdminPanel ? 'Fechar Admin' : '🛡️ Painel Admin'}</span>
              </button>
            )}

            {/* Botão Meus Agendamentos: visível quando em modo cliente (para cliente ou pro navegando como cliente) */}
            {activeTab === 'client' && !isProVitrinePreview && !showAdminPanel && (
              <button
                type="button"
                onClick={onToggleClientSubView}
                className={`text-[9px] sm:text-xs font-bold px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-xl transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 border shrink-0 ${
                  clientSubView === 'MY_BOOKINGS'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                }`}
                title={clientSubView === 'MY_BOOKINGS' ? 'Voltar à Vitrine' : `Meus Agendamentos (${activeAppointmentsCount})`}
              >
                <div className="relative flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                  {activeAppointmentsCount > 0 && (
                    <span className="sm:hidden absolute -top-1.5 -right-2 text-[8px] font-black bg-rose-600 text-white px-1 rounded-full leading-none">
                      {activeAppointmentsCount}
                    </span>
                  )}
                </div>
                <span className="sm:hidden leading-none font-bold">
                  {clientSubView === 'MY_BOOKINGS' ? 'Vitrine' : 'Agenda'}
                </span>
                <span className="hidden sm:inline">
                  {clientSubView === 'MY_BOOKINGS'
                    ? '🔍 Voltar à Vitrine'
                    : `Meus Agendamentos (${activeAppointmentsCount})`}
                </span>
              </button>
            )}

            {/* Se for profissional: botões de Navegação */}
            {currentUser.role === 'PROFESSIONAL' && !showAdminPanel && (
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {isProVitrinePreview ? (
                  <button
                    type="button"
                    onClick={onExitVitrinePreview}
                    className="text-[9px] sm:text-xs font-bold px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-xl transition cursor-pointer bg-stone-900 hover:bg-stone-800 text-white shadow-xs flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 shrink-0"
                    title="Fechar modo de prévia da vitrine e voltar ao Painel Pro"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-rose-400" />
                    <span className="sm:hidden leading-none font-bold">Painel Pro</span>
                    <span className="hidden sm:inline">Voltar ao Painel Pro</span>
                  </button>
                ) : activeTab === 'pro' ? (
                  <>
                    <button
                      type="button"
                      onClick={onEnterClientMode}
                      className="text-[9px] sm:text-xs font-bold px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-xl transition cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 shadow-2xs shrink-0"
                      title="Navegar no BellaDoor como cliente (explorar outras profissionais e agendar serviços)"
                    >
                      <span className="text-sm leading-none">🛍️</span>
                      <span className="sm:hidden leading-none font-extrabold text-[8.5px]">Modo Cliente</span>
                      <span className="hidden sm:inline">Modo Cliente</span>
                    </button>
                    <button
                      type="button"
                      onClick={onToggleProPreview}
                      className={`text-[9px] sm:text-xs font-bold px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-xl transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 shrink-0 ${
                        isProTrialExpired
                          ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                      }`}
                      title="Pré-visualizar como sua vitrine pública está sendo exibida (somente leitura)"
                    >
                      <span className="text-sm leading-none">👁️</span>
                      <span className="sm:hidden leading-none font-extrabold text-[8.5px]">Ver Vitrine</span>
                      <span className="hidden sm:inline">Minha Vitrine</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onExitVitrinePreview) onExitVitrinePreview();
                      else if (onToggleProPreview) onToggleProPreview();
                    }}
                    className="text-[9px] sm:text-xs font-bold px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-xl transition cursor-pointer bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 shrink-0"
                    title="Retornar ao seu Painel Profissional"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-white" />
                    <span className="sm:hidden leading-none font-bold">Painel Pro</span>
                    <span className="hidden sm:inline">Voltar ao Painel Pro</span>
                  </button>
                )}
              </div>
            )}

            {/* Card do Usuário Logado */}
            <div className="flex items-center gap-1 sm:gap-2 bg-stone-50 border border-stone-200 p-1 sm:pl-2 sm:pr-1.5 sm:py-1 rounded-xl text-xs shrink-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-[10px] overflow-hidden shrink-0">
                {(() => {
                  const defaultStockAvatar =
                    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80';
                  const customProAvatar =
                    currentUser.role === 'PROFESSIONAL' &&
                    proAvatarUrl &&
                    proAvatarUrl !== defaultStockAvatar
                      ? proAvatarUrl
                      : '';
                  const resolvedAvatar = customProAvatar || currentUser.avatarUrl || '';
                  return resolvedAvatar ? (
                    <img
                      src={resolvedAvatar}
                      alt={currentUser.fullName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (currentUser.fullName || currentUser.email || 'U').charAt(0).toUpperCase()
                  );
                })()}
              </div>
              <div className="hidden md:block leading-tight text-left">
                <p className="font-bold text-stone-900 text-[11px] truncate max-w-[140px]">
                  {currentUser.role === 'PROFESSIONAL'
                    ? proDisplayName.trim() || currentUser.fullName
                    : currentUser.fullName}
                </p>
                <p className="text-[9px] text-stone-500 truncate max-w-[140px]" title={currentUser.email}>
                  {currentUser.role === 'PROFESSIONAL' ? (
                    <span className="text-emerald-600 font-semibold">
                      Pro • {currentUser.email || 'Salvo Auto'}
                    </span>
                  ) : (
                    <span>Cliente • {currentUser.email || 'Salvo Auto'}</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="flex flex-col items-center justify-center p-1 sm:p-1.5 text-stone-500 hover:text-rose-600 hover:bg-stone-200/60 rounded-lg transition cursor-pointer shrink-0"
                title="Sair da conta"
                aria-label="Sair da conta"
              >
                <LogOut className="w-3.5 h-3.5 text-stone-600 hover:text-rose-600" />
                <span className="text-[8px] sm:hidden font-bold text-stone-600 leading-none mt-0.5">Sair</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
