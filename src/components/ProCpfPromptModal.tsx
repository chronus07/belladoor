import React, { useState } from 'react';
import { CreditCard, ShieldCheck, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { formatCPF, validateCPF } from '../utils/cpf';

interface ProCpfPromptModalProps {
  isOpen: boolean;
  userFullName?: string;
  userEmail?: string;
  onSaveCpf: (cpf: string) => Promise<boolean>;
}

export const ProCpfPromptModal: React.FC<ProCpfPromptModalProps> = ({
  isOpen,
  userFullName,
  userEmail,
  onSaveCpf,
}) => {
  const [cpfValue, setCpfValue] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validationError = validateCPF(cpfValue);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setLoading(true);
    try {
      const formatted = formatCPF(cpfValue);
      const success = await onSaveCpf(formatted);
      if (!success) {
        setErrorMsg('Erro ao salvar CPF na nuvem. Verifique sua conexão e tente novamente.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro inesperado ao salvar CPF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[85] animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
        {/* Ícone e Título */}
        <div className="text-center">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-rose-200 shadow-xs">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            Item Obrigatório da Profissional
          </span>
          <h3 className="text-lg font-black text-stone-900 mt-2">
            Finalize seu Cadastro com seu CPF
          </h3>
          <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
            {userFullName ? `Olá, ${userFullName}! ` : ''}Como você acessou com sua Conta Google, informe seu CPF para validar sua vitrine profissional e configurar o recebimento do sinal via PIX.
          </p>
        </div>

        {/* Benefícios e Segurança */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3 space-y-2 text-[11px] text-stone-600">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Segurança da Vitrine:</strong> Verificação de autenticidade da profissional perante as clientes.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>PIX do Sinal:</strong> Vinculação da sua chave de recebimento para adiantamento de 50%.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Proteção LGPD:</strong> Seus dados são criptografados e protegidos pela Lei 13.709/2018.</span>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Informe seu CPF <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={14}
                autoFocus
                placeholder="000.000.000-00"
                value={cpfValue}
                onChange={(e) => {
                  setCpfValue(formatCPF(e.target.value));
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-3.5 py-3 text-sm font-bold font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>
            {errorMsg && (
              <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errorMsg}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !cpfValue}
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-extrabold transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validando e Salvando...
              </>
            ) : (
              'Confirmar CPF e Liberar Acesso 🚀'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
