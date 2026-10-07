import React from 'react';
import { Calendar, LogOut } from 'lucide-react';
import { AuthUser } from '../../lib/supabaseClient';

interface HeaderBarProps {
  currentUser: AuthUser | null;
  activeTab: 'client' | 'pro';
  clientSubView: 'EXPLORE' | 'MY_BOOKINGS';
  activeAppointmentsCount: number;
  proDisplayName: string;
  proAvatarUrl: string;
  onToggleClientSubView: () => void;
  onToggleProPreview: () => void;
  onLogout: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentUser,
  activeTab,
  clientSubView,
  activeAppointmentsCount,
  proDisplayName,
  proAvatarUrl,
  onToggleClientSubView,
  onToggleProPreview,
  onLogout,
}) => {
  return (
    <header className="w-full bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚪</span>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-stone-900">
              Bella<span className="text-rose-600">Door</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full font-medium border border-rose-200">
              A beleza na sua porta
            </span>
          </div>
        </div>

        {/* LADO DIREITO: PERFIL E SAIR (SOMENTE QUANDO LOGADO) */}
        {currentUser && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Botão Meus Agendamentos para Cliente */}
            {activeTab === 'client' && (
              <button
                type="button"
                onClick={onToggleClientSubView}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 border ${
                  clientSubView === 'MY_BOOKINGS'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {clientSubView === 'MY_BOOKINGS'
                    ? '🔍 Voltar à Vitrine'
                    : `Meus Agendamentos (${activeAppointmentsCount})`}
                </span>
              </button>
            )}

            {/* Se for profissional, botão opcional para ver a vitrine como a cliente vê */}
            {currentUser.role === 'PROFESSIONAL' && (
              <button
                type="button"
                onClick={onToggleProPreview}
                className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                {activeTab === 'pro' ? '👁️ Ver Minha Vitrine' : '💼 Meu Painel Pro'}
              </button>
            )}

            {/* Card do Usuário Logado */}
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 pl-2 pr-1.5 py-1 rounded-xl text-xs">
              <div className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-[10px] overflow-hidden">
                {currentUser.role === 'PROFESSIONAL' && proAvatarUrl ? (
                  <img
                    src={proAvatarUrl}
                    alt={currentUser.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentUser.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden sm:block leading-tight text-left">
                <p className="font-bold text-stone-900 text-[11px] truncate max-w-[120px]">
                  {currentUser.role === 'PROFESSIONAL' ? proDisplayName : currentUser.fullName}
                </p>
                <p className="text-[9px] text-stone-500">
                  {currentUser.role === 'PROFESSIONAL' ? (
                    <span className="text-emerald-600 font-semibold">Pro • Salvo Auto</span>
                  ) : (
                    'Cliente • Salvo Auto'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-1 text-stone-400 hover:text-rose-600 rounded-md transition ml-1 cursor-pointer"
                title="Sair da conta"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
