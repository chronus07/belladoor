import React from 'react';
import { Sparkles, Gift, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

interface AuthViewProps {
  authMode: 'LOGIN' | 'REGISTER';
  authRole: 'CLIENT' | 'PROFESSIONAL';
  authName: string;
  authEmail: string;
  authPassword: string;
  authLoading: boolean;
  authError: string | null;
  onSelectRole: (role: 'CLIENT' | 'PROFESSIONAL') => void;
  onChangeMode: (mode: 'LOGIN' | 'REGISTER') => void;
  onChangeName: (val: string) => void;
  onChangeEmail: (val: string) => void;
  onChangePassword: (val: string) => void;
  onGoogleAuth: () => void;
  onEmailAuthSubmit: (e: React.FormEvent) => void;
  onQuickDemoLogin: (role: 'CLIENT' | 'PROFESSIONAL') => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  authMode,
  authRole,
  authName,
  authEmail,
  authPassword,
  authLoading,
  authError,
  onSelectRole,
  onChangeMode,
  onChangeName,
  onChangeEmail,
  onChangePassword,
  onGoogleAuth,
  onEmailAuthSubmit,
  onQuickDemoLogin,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner Hero de Apresentação */}
      <div className="text-center space-y-2 pt-2 pb-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-rose-600" />
          <span>Plataforma Oficial de Beleza a Domicílio</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          A beleza na sua porta.
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
          Cadastre-se ou entre para acessar a plataforma de atendimento de beleza a domicílio.
        </p>
      </div>

      {/* Card Central de Login / Cadastro */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-md space-y-5">
        {/* 1. SELEÇÃO DE PERFIL: CLIENTE OU PROFISSIONAL */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-2 text-center uppercase tracking-wider">
            Como você deseja acessar o BellaDoor?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Card Cliente */}
            <div
              onClick={() => onSelectRole('CLIENT')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition relative text-center ${
                authRole === 'CLIENT'
                  ? 'border-rose-600 bg-rose-50/70 shadow-sm'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <span className="text-2xl block mb-1">💅</span>
              <h3 className="font-extrabold text-xs text-stone-900">Sou Cliente</h3>
              <p className="text-[10px] text-stone-500 mt-0.5 leading-snug">
                Quero agendar maquiagem, unhas e cabelo em casa
              </p>
              <span className="inline-block mt-2 bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                ✨ 100% Gratuito
              </span>
            </div>

            {/* Card Profissional */}
            <div
              onClick={() => onSelectRole('PROFESSIONAL')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition relative text-center ${
                authRole === 'PROFESSIONAL'
                  ? 'border-rose-600 bg-rose-50/70 shadow-sm'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <span className="text-2xl block mb-1">💄</span>
              <h3 className="font-extrabold text-xs text-stone-900">Sou Profissional</h3>
              <p className="text-[10px] text-stone-500 mt-0.5 leading-snug">
                Quero atender a domicílio e gerenciar minha agenda
              </p>
              <span className="inline-block mt-2 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                🎁 7 Dias Grátis
              </span>
            </div>
          </div>
        </div>

        {/* Alerta de Benefício do Perfil */}
        {authRole === 'CLIENT' ? (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs text-rose-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Experiência VIP no seu Lar</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Encontre profissionais avaliadas, veja fotos de trabalhos e confirme com cálculo de deslocamento em tempo real.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
            <Gift className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Teste Grátis por 7 Dias Liberado</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Ao se cadastrar como profissional, você tem 7 dias de acesso total sem pagar nada hoje (planos de R$ 39,90/mês ou R$ 299/ano).
              </p>
            </div>
          </div>
        )}

        {/* Alternador: Entrar (Login) vs Criar Conta (Cadastro) */}
        <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => onChangeMode('LOGIN')}
            className={`flex-1 py-2 rounded-lg transition ${
              authMode === 'LOGIN'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Já Tenho Conta (Entrar)
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('REGISTER')}
            className={`flex-1 py-2 rounded-lg transition ${
              authMode === 'REGISTER'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Criar Nova Conta
          </button>
        </div>

        {/* 2. BOTÃO OFICIAL DO GOOGLE */}
        <button
          type="button"
          disabled={authLoading}
          onClick={onGoogleAuth}
          className="w-full py-3 px-4 bg-white hover:bg-stone-50 border border-stone-300 rounded-2xl text-xs font-bold text-stone-800 flex items-center justify-center gap-2.5 transition shadow-xs cursor-pointer"
        >
          {authLoading ? (
            <Loader2 className="w-4 h-4 text-rose-600 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continuar com o Google</span>
        </button>

        {/* Divisor */}
        <div className="relative flex py-0.5 items-center">
          <div className="flex-grow border-t border-stone-200" />
          <span className="flex-shrink mx-3 text-[11px] text-stone-400 font-medium">
            ou continue com e-mail
          </span>
          <div className="flex-grow border-t border-stone-200" />
        </div>

        {/* 3. FORMULÁRIO COM E-MAIL E SENHA */}
        <form onSubmit={onEmailAuthSubmit} className="space-y-3">
          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authMode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Seu Nome Completo:
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Camila Martins ou Fernanda Lima"
                value={authName}
                onChange={(e) => onChangeName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Seu E-mail:</label>
            <input
              type="email"
              required
              placeholder="seuemail@exemplo.com"
              value={authEmail}
              onChange={(e) => onChangeEmail(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Sua Senha:</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder={
                authMode === 'REGISTER'
                  ? 'Crie uma senha de no mínimo 6 dígitos'
                  : 'Digite sua senha'
              }
              value={authPassword}
              onChange={(e) => onChangePassword(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {authLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {authMode === 'REGISTER'
                  ? authRole === 'PROFESSIONAL'
                    ? 'Cadastrar & Iniciar 7 Dias Grátis'
                    : 'Criar Minha Conta Grátis'
                  : 'Entrar no BellaDoor'}
              </>
            )}
          </button>

          {/* Alternar link rápido abaixo do botão */}
          <div className="text-center pt-1">
            {authMode === 'LOGIN' ? (
              <p className="text-xs text-stone-500">
                Ainda não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => onChangeMode('REGISTER')}
                  className="text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  Cadastre-se grátis
                </button>
              </p>
            ) : (
              <p className="text-xs text-stone-500">
                Já possui uma conta?{' '}
                <button
                  type="button"
                  onClick={() => onChangeMode('LOGIN')}
                  className="text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  Fazer login
                </button>
              </p>
            )}
          </div>
        </form>

        {/* ATALHOS RÁPIDOS DE DEMONSTRAÇÃO (Para teste instantâneo) */}
        <div className="pt-2 border-t border-stone-100 space-y-2">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider text-center">
            ⚡ Acesso Rápido de Teste (1 Clique):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onQuickDemoLogin('CLIENT')}
              className="py-2.5 px-2 bg-stone-50 hover:bg-rose-50 border border-stone-200 hover:border-rose-300 rounded-xl text-[11px] font-bold text-stone-800 transition text-center cursor-pointer shadow-xs"
            >
              💅 Entrar como Cliente Demo
            </button>
            <button
              type="button"
              onClick={() => onQuickDemoLogin('PROFESSIONAL')}
              className="py-2.5 px-2 bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-300 rounded-xl text-[11px] font-bold text-stone-800 transition text-center cursor-pointer shadow-xs"
            >
              💄 Entrar como Pro Demo
            </button>
          </div>
        </div>
      </div>

      {/* Selos de Confiança */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-stone-500 pt-1 text-center">
        <span className="flex items-center gap-1">🔒 Conexão Segura SSL</span>
        <span className="flex items-center gap-1">📍 Cálculo Automático de Deslocamento</span>
        <span className="flex items-center gap-1">💬 Notificação Direta no WhatsApp</span>
      </div>
    </div>
  );
};
