import React, { useState } from 'react';
import {
  Sparkles,
  Gift,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Mail,
  RefreshCw,
  ArrowLeft,
  Eye,
  EyeOff,
  Calendar,
  User,
  Lock,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import {
  resetUserPasswordInFirebase,
  sendFirebasePasswordResetLink,
} from '../../lib/firebaseClient';

interface AuthViewProps {
  authMode: 'LOGIN' | 'REGISTER';
  authRole: 'CLIENT' | 'PROFESSIONAL';
  authName: string;
  authBirthDate: string;
  authEmail: string;
  authPassword: string;
  authConfirmPassword: string;
  authLoading: boolean;
  authError: string | null;
  pendingVerificationEmail: string | null;
  verificationFeedback: string | null;
  resendCooldown: number;
  onSelectRole: (role: 'CLIENT' | 'PROFESSIONAL') => void;
  onChangeMode: (mode: 'LOGIN' | 'REGISTER') => void;
  onChangeName: (val: string) => void;
  onChangeBirthDate: (val: string) => void;
  onChangeEmail: (val: string) => void;
  onChangePassword: (val: string) => void;
  onChangeConfirmPassword: (val: string) => void;
  onGoogleAuth: () => void;
  onEmailAuthSubmit: (e: React.FormEvent) => void;
  onVerifyEmailCheck: () => void;
  onResendVerificationEmail: () => void;
  onCancelVerification: () => void;
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  onChangeTermsAccepted?: (val: boolean) => void;
  onChangePrivacyAccepted?: (val: boolean) => void;
  lgpdAccepted?: boolean;
  onChangeLgpdAccepted?: (val: boolean) => void;
  onOpenLgpdModal: (tab: 'PRIVACY' | 'TERMS' | 'RIGHTS' | 'BETA') => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  authMode,
  authRole,
  authName,
  authBirthDate,
  authEmail,
  authPassword,
  authConfirmPassword,
  authLoading,
  authError,
  pendingVerificationEmail,
  verificationFeedback,
  resendCooldown,
  onSelectRole,
  onChangeMode,
  onChangeName,
  onChangeBirthDate,
  onChangeEmail,
  onChangePassword,
  onChangeConfirmPassword,
  onGoogleAuth,
  onEmailAuthSubmit,
  onVerifyEmailCheck,
  onResendVerificationEmail,
  onCancelVerification,
  termsAccepted = false,
  privacyAccepted = false,
  onChangeTermsAccepted,
  onChangePrivacyAccepted,
  lgpdAccepted,
  onChangeLgpdAccepted,
  onOpenLgpdModal,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados do Fluxo "Esqueci Minha Senha"
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetBirthDate, setResetBirthDate] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPass, setShowResetPass] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  const handleResetBirthDateInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setResetBirthDate(formatted);
  };

  const handleOpenForgotPassword = () => {
    setResetEmail(authEmail.trim());
    setResetBirthDate('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetError(null);
    setResetSuccessMsg(null);
    setShowForgotModal(true);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccessMsg(null);

    const cleanMail = resetEmail.trim().toLowerCase();
    if (!cleanMail) {
      setResetError('Informe o e-mail da sua conta.');
      return;
    }
    if (resetBirthDate.replace(/\D/g, '').length !== 8) {
      setResetError('Informe sua data de nascimento completa (DD/MM/AAAA) para confirmar sua identidade.');
      return;
    }
    if (resetNewPassword.length < 6) {
      setResetError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('A confirmação da nova senha não coincide.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await resetUserPasswordInFirebase(cleanMail, resetBirthDate, resetNewPassword);
      if (!res.ok) {
        setResetError(res.error || 'Não foi possível redefinir a senha.');
      } else {
        onChangeEmail(cleanMail);
        onChangePassword(resetNewPassword);
        setResetSuccessMsg(
          '✅ Sua senha foi redefinida com sucesso! Já preenchemos seus dados no Login, clique em "Voltar e Entrar Agora".'
        );
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleSendResetEmailLink = async () => {
    setResetError(null);
    setResetSuccessMsg(null);
    const cleanMail = resetEmail.trim().toLowerCase();
    if (!cleanMail) {
      setResetError('Digite seu e-mail no campo acima para receber o link de recuperação.');
      return;
    }
    setResetLoading(true);
    try {
      const res = await sendFirebasePasswordResetLink(cleanMail);
      if (res.sent) {
        setResetSuccessMsg(
          `📩 Enviamos um link de redefinição para ${cleanMail}. Confira sua Caixa de Entrada e também a pasta Spam!`
        );
      } else {
        setResetError(res.error || 'Não foi possível enviar o link por e-mail.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleBirthDateInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    onChangeBirthDate(formatted);
  };

  const passwordsMatch =
    authMode === 'REGISTER' &&
    authPassword.length >= 6 &&
    authConfirmPassword.length > 0 &&
    authPassword === authConfirmPassword;

  const passwordsMismatch =
    authMode === 'REGISTER' &&
    authConfirmPassword.length > 0 &&
    authPassword !== authConfirmPassword;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner Hero de Apresentação */}
      <div className="text-center space-y-2.5 pt-2 pb-1">
        {/* Logo Oficial BellaDoor no Topo do Login/Cadastro */}
        <div className="flex justify-center mb-1">
          <img
            src="/belladoor-logo.jpg"
            alt="BellaDoor"
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-3xl shadow-md border border-stone-200/80 bg-white"
          />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-rose-600" />
          <span>Plataforma Oficial de Beleza a Domicílio</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          A beleza na sua porta.
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
          Cadastre-se ou entre na sua conta para agendar ou gerenciar seus atendimentos a domicílio.
        </p>
      </div>

      {/* ==================================================================== */}
      {/* TELA DE VALIDAÇÃO DE E-MAIL OBRIGATÓRIA ANTES DE LIBERAR O ACESSO    */}
      {/* ==================================================================== */}
      {pendingVerificationEmail ? (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-md space-y-5 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto shadow-xs">
              <Mail className="w-8 h-8 text-rose-600" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800">
              🔒 Validação de E-mail Pendente
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-stone-900">
              Confirme seu e-mail para entrar
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
              Para sua segurança, enviamos um link de confirmação de cadastro para o endereço:
            </p>
            <div className="inline-block bg-stone-100 border border-stone-200 rounded-xl px-3.5 py-1.5 text-xs font-extrabold text-stone-900 break-all">
              {pendingVerificationEmail}
            </div>
          </div>

          {/* Passo a Passo */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2.5 text-xs text-stone-700">
            <p className="font-extrabold text-stone-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
              Como liberar seu acesso em segundos:
            </p>
            <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-stone-600 leading-relaxed">
              <li>
                Abra a caixa de entrada do seu e-mail (verifique também a pasta <strong>Spam</strong> ou{' '}
                <strong>Lixo Eletrônico</strong>).
              </li>
              <li>
                Abra o e-mail enviado pelo <strong>BellaDoor</strong> e clique no link de validação.
              </li>
              <li>
                Após clicar no link, volte aqui e toque em <strong>"Já validei meu e-mail"</strong> (ou aguarde a liberação automática).
              </li>
            </ol>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {verificationFeedback && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{verificationFeedback}</span>
            </div>
          )}

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={authLoading}
              onClick={onVerifyEmailCheck}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Já validei meu e-mail — Liberar Acesso
                </>
              )}
            </button>

            <button
              type="button"
              disabled={authLoading || resendCooldown > 0}
              onClick={onResendVerificationEmail}
              className="w-full py-3 bg-stone-100 hover:bg-stone-200 disabled:opacity-60 text-stone-800 font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {resendCooldown > 0
                ? `Reenviar e-mail disponível em ${resendCooldown}s`
                : 'Não recebeu? Reenviar link de validação'}
            </button>

            <button
              type="button"
              onClick={onCancelVerification}
              className="w-full py-2 text-stone-500 hover:text-stone-800 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ou usar outro e-mail
            </button>
          </div>
        </div>
      ) : (
        /* ==================================================================== */
        /* CARD CENTRAL DE LOGIN / CADASTRO COMPLETO                            */
        /* ==================================================================== */
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
                  Veja fotos de trabalhos, valores, bairros atendidos e agende seu horário online.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
              <Gift className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Teste Grátis por 7 Dias Liberado</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Ao criar sua conta profissional, você tem 7 dias de acesso completo para montar sua vitrine, serviços e agenda.
                </p>
              </div>
            </div>
          )}

          {/* Alternador: Entrar (Login) vs Criar Conta (Cadastro) */}
          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold text-center">
            <button
              type="button"
              onClick={() => onChangeMode('LOGIN')}
              className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
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
              className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
                authMode === 'REGISTER'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Criar Nova Conta
            </button>
          </div>

          {/* 2. BOTÃO OFICIAL DO GOOGLE (GMAIL) */}
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
            <span>
              {authMode === 'LOGIN'
                ? `Entrar com Conta Google (${authRole === 'PROFESSIONAL' ? 'Profissional' : 'Cliente'})`
                : `Continuar com o Google (${authRole === 'PROFESSIONAL' ? 'Profissional' : 'Cliente'})`}
            </span>
          </button>

          {/* Divisor */}
          <div className="relative flex py-0.5 items-center">
            <div className="flex-grow border-t border-stone-200" />
            <span className="flex-shrink mx-3 text-[11px] text-stone-400 font-medium">
              {authMode === 'REGISTER'
                ? 'ou preencha seu cadastro completo abaixo'
                : 'ou entre com seu e-mail e senha'}
            </span>
            <div className="flex-grow border-t border-stone-200" />
          </div>

          {/* 3. FORMULÁRIO COMPLETO COM VALIDAÇÃO */}
          <form onSubmit={onEmailAuthSubmit} className="space-y-3.5">
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authMode === 'REGISTER' && (
              <>
                {/* Nome Completo */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nome Completo <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Digite seu nome e sobrenome"
                      value={authName}
                      onChange={(e) => onChangeName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Data de Nascimento */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Data de Nascimento <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={10}
                      placeholder="DD/MM/AAAA"
                      value={authBirthDate}
                      onChange={(e) => handleBirthDateInput(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* E-mail */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Seu E-mail <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  value={authEmail}
                  onChange={(e) => onChangeEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              {authMode === 'REGISTER' && (
                <p className="text-[10px] text-stone-500 mt-1">
                  📩 Enviaremos um link de validação para confirmar seu e-mail antes do primeiro acesso.
                </p>
              )}
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700">
                  Sua Senha <span className="text-rose-600">*</span>
                </label>
                {authMode === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    Esqueci minha senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder={
                    authMode === 'REGISTER'
                      ? 'Crie uma senha (mínimo 6 caracteres)'
                      : 'Digite sua senha'
                  }
                  value={authPassword}
                  onChange={(e) => onChangePassword(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmação de Senha (apenas no Cadastro) */}
            {authMode === 'REGISTER' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Confirme sua Senha <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Repita a senha criada acima"
                    value={authConfirmPassword}
                    onChange={(e) => onChangeConfirmPassword(e.target.value)}
                    className={`w-full bg-stone-50 border rounded-xl pl-10 pr-10 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 ${
                      passwordsMismatch
                        ? 'border-red-400 focus:ring-red-500'
                        : passwordsMatch
                        ? 'border-emerald-400 focus:ring-emerald-500'
                        : 'border-stone-300 focus:ring-rose-500'
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordsMismatch && (
                  <p className="text-[10px] font-semibold text-red-600 mt-1">
                    As senhas digitadas não coincidem.
                  </p>
                )}
                {passwordsMatch && (
                  <p className="text-[10px] font-semibold text-emerald-600 mt-1">
                    ✓ As senhas coincidem.
                  </p>
                )}
              </div>
            )}

            {/* Consentimento Expresso Obrigatório: Termos de Uso e Política de Privacidade (Dois Aceites Separados) */}
            {authMode === 'REGISTER' && (
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2.5">
                {/* Caixinha 1: Termos de Uso */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      if (onChangeTermsAccepted) {
                        onChangeTermsAccepted(e.target.checked);
                      } else if (onChangeLgpdAccepted) {
                        onChangeLgpdAccepted(e.target.checked);
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded accent-rose-600 cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] text-stone-700 leading-relaxed">
                    Li e concordo com os{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpenLgpdModal('TERMS');
                      }}
                      className="text-rose-600 font-extrabold underline hover:text-rose-800 cursor-pointer"
                    >
                      Termos de Uso
                    </button>{' '}
                    (incluindo regras de agendamento, cancelamento e isenção da plataforma sobre o sinal).{' '}
                    <span className="text-rose-600 font-bold">*</span>
                  </span>
                </label>

                <div className="border-t border-stone-200/60" />

                {/* Caixinha 2: Política de Privacidade (LGPD) */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => {
                      if (onChangePrivacyAccepted) {
                        onChangePrivacyAccepted(e.target.checked);
                      } else if (onChangeLgpdAccepted) {
                        onChangeLgpdAccepted(e.target.checked);
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded accent-rose-600 cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] text-stone-700 leading-relaxed">
                    Li e concordo com a{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpenLgpdModal('PRIVACY');
                      }}
                      className="text-rose-600 font-extrabold underline hover:text-rose-800 cursor-pointer"
                    >
                      Política de Privacidade (LGPD)
                    </button>{' '}
                    e autorizo o tratamento seguro dos meus dados para fins de agendamento.{' '}
                    <span className="text-rose-600 font-bold">*</span>
                  </span>
                </label>

                {termsAccepted && privacyAccepted && (
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] text-emerald-700 font-bold animate-in fade-in">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Termos e Políticas de Privacidade aceitos para o cadastro</span>
                  </div>
                )}
              </div>
            )}

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
                      ? 'Cadastrar & Validar Meu E-mail'
                      : 'Criar Conta & Validar Meu E-mail'
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
        </div>
      )}

      {/* MODAL DE RECUPERAÇÃO / REDEFINIÇÃO DE SENHA ("ESQUECI MINHA SENHA") */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 my-auto animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">
                    Recuperação de Acesso • BellaDoor
                  </span>
                  <h3 className="text-base font-extrabold text-stone-900">
                    Redefinir Minha Senha
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Para redefinir sua senha imediatamente com segurança, confirme seu{' '}
              <strong>e-mail cadastrado</strong> e sua <strong>data de nascimento</strong>:
            </p>

            {resetError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs space-y-2.5">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-semibold">{resetSuccessMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-sm"
                >
                  Voltar e Entrar Agora →
                </button>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Seu E-mail Cadastrado <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="seuemail@exemplo.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Confirme sua Data de Nascimento <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={10}
                    placeholder="DD/MM/AAAA"
                    value={resetBirthDate}
                    onChange={(e) => handleResetBirthDateInput(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nova Senha (mínimo 6 caracteres) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showResetPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Digite sua nova senha"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowResetPass((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showResetPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Confirme a Nova Senha <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showResetPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Repita sua nova senha"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="pt-1 space-y-2">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {resetLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Salvar Nova Senha Agora
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={resetLoading}
                  onClick={handleSendResetEmailLink}
                  className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-[11px] transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-stone-500" />
                  Ou enviar link de redefinição para meu e-mail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selos de Confiança */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-stone-500 pt-1 text-center">
        <span className="flex items-center gap-1">🔒 Conexão Segura SSL</span>
        <span className="flex items-center gap-1">🛡️ Adequado à LGPD (Lei 13.709/18)</span>
        <span className="flex items-center gap-1">📍 Cálculo Automático de Deslocamento</span>
        <span className="flex items-center gap-1">💬 Notificação Direta no WhatsApp</span>
      </div>
    </div>
  );
};

