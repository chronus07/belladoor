import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Phone,
  Calendar,
  Mail,
  CheckCircle,
  AlertCircle,
  Lock,
  Save,
} from 'lucide-react';
import { AuthUser } from '../../lib/supabaseClient';
import { formatCPF, validateCPF, cleanCPF } from '../utils/cpf';

export interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onSave: (updatedData: {
    fullName: string;
    cpf?: string;
    phone?: string;
    birthDate?: string;
  }) => Promise<void> | void;
  isPro?: boolean;
  currentWhatsapp?: string;
}

/**
 * Aplica máscara de telefone: (00) 00000-0000 ou (00) 0000-0000
 */
function formatPhone(val: string): string {
  const digits = (val || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
  isPro = false,
  currentWhatsapp = '',
}) => {
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Inicializa os campos quando o modal abre ou currentUser muda
  useEffect(() => {
    if (isOpen && currentUser) {
      setFullName(currentUser.fullName || '');
      setCpf(currentUser.cpf ? formatCPF(currentUser.cpf) : '');
      const initialPhone = currentUser.phone || currentWhatsapp || '';
      setPhone(initialPhone ? formatPhone(initialPhone) : '');
      setBirthDate(currentUser.birthDate || '');
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, currentUser, currentWhatsapp]);

  if (!isOpen || !currentUser) return null;

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
    if (error) setError(null);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 3) {
      setError('Por favor, informe seu nome completo (mínimo 3 caracteres).');
      return;
    }

    const cleanCpfDigits = cleanCPF(cpf);

    // Validação de CPF: obrigatório para profissional; para cliente, valida se preenchido
    if (isPro || cleanCpfDigits.length > 0) {
      const cpfErr = validateCPF(cpf);
      if (cpfErr) {
        setError(cpfErr);
        return;
      }
    }

    // Validação de telefone se preenchido
    const cleanPhoneDigits = phone.replace(/\D/g, '');
    if (cleanPhoneDigits.length > 0 && cleanPhoneDigits.length < 10) {
      setError('Por favor, informe um número de telefone/WhatsApp válido com DDD.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        fullName: cleanName,
        cpf: cleanCpfDigits ? formatCPF(cleanCpfDigits) : undefined,
        phone: cleanPhoneDigits ? formatPhone(cleanPhoneDigits) : undefined,
        birthDate: birthDate.trim() || undefined,
      });

      setSuccessMsg('Dados cadastrais atualizados com sucesso!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Falha ao salvar alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative border border-stone-200 my-auto animate-in zoom-in-95 duration-200">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition cursor-pointer"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div className="min-w-0 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-lg text-stone-900 leading-tight">
                Meus Dados Cadastrais
              </h3>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                isPro
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {isPro ? '💅 Profissional' : '👤 Cliente'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1 leading-snug">
              Mantenha seus dados pessoais e de contato atualizados.
            </p>
          </div>
        </div>

        {/* Feedback de Sucesso */}
        {successMsg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Feedback de Erro */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-start gap-2 animate-in shake duration-200">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome Completo */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-stone-500" />
              <span>Nome Completo *</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Seu nome completo"
              className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-900 transition"
            />
          </div>

          {/* CPF */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-500" />
                <span>CPF {isPro ? '*' : '(opcional)'}</span>
              </label>
              <span className="text-[10px] text-stone-400">
                {isPro ? 'Obrigatório para profissionais' : 'Identificação segura'}
              </span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              required={isPro}
              value={cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              maxLength={14}
              className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono text-stone-900 transition"
            />
            {isPro && (
              <p className="text-[10px] text-stone-500 mt-1 leading-tight">
                Seu CPF é exigido para segurança das clientes e ativação do Pix de Sinal.
              </p>
            )}
          </div>

          {/* WhatsApp / Telefone */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-stone-500" />
              <span>WhatsApp / Telefone</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-900 transition"
            />
            <p className="text-[10px] text-stone-500 mt-1">
              {isPro
                ? 'Número exibido na sua vitrine e utilizado para receber agendamentos.'
                : 'Utilizado pelas profissionais para confirmar horários de atendimento.'}
            </p>
          </div>

          {/* Data de Nascimento */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>Data de Nascimento</span>
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-900 transition"
            />
          </div>

          {/* E-mail da Conta (Read-Only) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-stone-500" />
                <span>E-mail da Conta</span>
              </label>
              <span className="text-[10px] text-stone-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Chave de autenticação
              </span>
            </div>
            <input
              type="email"
              disabled
              value={currentUser.email || 'Não informado'}
              className="w-full px-3.5 py-2.5 text-xs bg-stone-100 border border-stone-200 rounded-xl text-stone-500 cursor-not-allowed select-none"
            />
            <p className="text-[10px] text-stone-400 mt-1">
              O e-mail é vinculado à sua conta de autenticação e não pode ser alterado diretamente.
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-extrabold shadow-sm hover:shadow transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Dados Cadastrais</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
