import React, { useState } from 'react';
import {
  X,
  Star,
  Sparkles,
  CheckCircle,
  MessageCircle,
  Heart,
  Send,
  HelpCircle,
} from 'lucide-react';
import { BetaFeedbackEntry } from '../../lib/firebaseClient';

interface BetaFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitFeedback: (feedback: BetaFeedbackEntry) => Promise<void> | void;
  proEmail: string;
  proName: string;
  proWhatsapp?: string;
  existingFeedback?: BetaFeedbackEntry | null;
}

export const BetaFeedbackModal: React.FC<BetaFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmitFeedback,
  proEmail,
  proName,
  proWhatsapp,
  existingFeedback,
}) => {
  const [rating, setRating] = useState<number>(existingFeedback?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [likedMost, setLikedMost] = useState<string>(existingFeedback?.likedMost || '');
  const [missingOrHard, setMissingOrHard] = useState<string>(existingFeedback?.missingOrHard || '');
  const [willingnessToPay, setWillingnessToPay] = useState<'YES' | 'MAYBE' | 'NO'>(
    existingFeedback?.willingnessToPay || 'YES'
  );
  const [additionalComments, setAdditionalComments] = useState<string>(
    existingFeedback?.additionalComments || ''
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const ratingDescriptions: Record<number, string> = {
    1: 'Muito ruim 😞',
    2: 'Ruim, tive dificuldades 😕',
    3: 'Regular, precisa de melhorias 😐',
    4: 'Muito bom, me ajudou bastante! 😊',
    5: 'Excelente, facilitou muito meu dia a dia! 🤩✨',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!likedMost.trim() && !missingOrHard.trim()) {
      setErrorMsg('Por favor, escreva ao menos uma frase sobre o que achou da plataforma.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const feedbackPayload: BetaFeedbackEntry = {
      id: existingFeedback?.id || `fb-${Date.now()}`,
      proEmail: proEmail.trim().toLowerCase(),
      proName: proName.trim() || 'Profissional',
      proWhatsapp,
      rating,
      likedMost: likedMost.trim(),
      missingOrHard: missingOrHard.trim(),
      willingnessToPay,
      additionalComments: additionalComments.trim() || undefined,
      submittedAt: new Date().toISOString(),
    };

    try {
      await onSubmitFeedback(feedbackPayload);
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        onClose();
      }, 2200);
    } catch (err) {
      setErrorMsg('Não foi possível enviar agora. Tente novamente em alguns instantes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* CABEÇALHO */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Feedback do Piloto Beta
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-full">
                  Exclusivo
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Olá, {proName.split(' ')[0]}! Sua opinião sincera é o que guiará o futuro do Belladoor.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO */}
        {submittedSuccess ? (
          <div className="p-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-stone-900">Muito obrigado pelo feedback! 💕</h3>
            <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
              Suas respostas foram salvas com sucesso e serão analisadas com muito carinho pelo Everton e pela equipe para evoluir a ferramenta para você!
            </p>
            <span className="inline-block text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full">
              Fechando em instantes...
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-stone-800 flex-1">
            {/* 1. NOTA DE EXPERIÊNCIA COM ESTRELAS */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-center space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-stone-700">
                1. Como tem sido sua experiência geral usando o Belladoor?
              </label>
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const currentActive = (hoverRating !== null ? hoverRating : rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 transition transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          currentActive
                            ? 'text-amber-400 fill-amber-400 stroke-amber-500'
                            : 'text-stone-300 stroke-stone-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-bold text-amber-900 h-4">
                {ratingDescriptions[hoverRating !== null ? hoverRating : rating]}
              </p>
            </div>

            {/* 2. O QUE MAIS GOSTOU */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-stone-800">
                2. O que você mais gostou ou o que mais te poupou tempo no seu atendimento? *
              </label>
              <textarea
                rows={3}
                required
                value={likedMost}
                onChange={(e) => setLikedMost(e.target.value)}
                placeholder="Ex: A mensagem pronta de confirmação no WhatsApp com o sinal de 50%, a cliente agendar sozinha sem ficar trocando mil mensagens..."
                className="w-full text-xs p-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition leading-relaxed"
              />
            </div>

            {/* 3. O QUE SENTIU FALTA OU ACHOU DIFÍCIL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-stone-800">
                3. O que você sentiu falta, achou difícil ou que podemos melhorar?
              </label>
              <textarea
                rows={3}
                value={missingOrHard}
                onChange={(e) => setMissingOrHard(e.target.value)}
                placeholder="Ex: Gostaria de bloquear um horário mais rápido na agenda, achei uma opção confusa no celular, senti falta de..."
                className="w-full text-xs p-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition leading-relaxed"
              />
            </div>

            {/* 4. DISPOSIÇÃO A PAGAR */}
            <div className="bg-gradient-to-br from-rose-50/60 to-amber-50/60 p-4 rounded-2xl border border-rose-200/80 space-y-2.5">
              <label className="block text-xs font-black uppercase tracking-wider text-rose-950">
                4. Você pagaria R$ 39,90/mês para continuar usando o Belladoor após o período gratuito? *
              </label>
              <p className="text-[11px] text-stone-600">
                Essa pergunta é crucial para sabermos se o valor do sistema condiz com o retorno no seu trabalho.
              </p>

              <div className="space-y-2 pt-1">
                {[
                  {
                    val: 'YES' as const,
                    label: 'Sim, com certeza!',
                    desc: 'Pelo tempo economizado e segurança de não ter furos na agenda, vale muito a pena.',
                    badge: 'Recomendado',
                  },
                  {
                    val: 'MAYBE' as const,
                    label: 'Talvez / Depende',
                    desc: 'Depende de novos recursos e do meu volume de clientes naquele mês.',
                    badge: undefined,
                  },
                  {
                    val: 'NO' as const,
                    label: 'Não no momento',
                    desc: 'Ainda prefiro continuar organizando manualmente pelo WhatsApp comum.',
                    badge: undefined,
                  },
                ].map((opt) => (
                  <label
                    key={opt.val}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                      willingnessToPay === opt.val
                        ? 'bg-white border-rose-500 shadow-xs ring-1 ring-rose-500'
                        : 'bg-white/80 border-stone-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="willingnessToPay"
                      value={opt.val}
                      checked={willingnessToPay === opt.val}
                      onChange={() => setWillingnessToPay(opt.val)}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900">{opt.label}</span>
                        {opt.badge && (
                          <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 5. COMENTÁRIOS EXTRAS */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-stone-800">
                5. Algum recado ou sugestão direta para nós? (Opcional)
              </label>
              <textarea
                rows={2}
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                placeholder="Fique à vontade para mandar um recado, elogio ou sugestão..."
                className="w-full text-xs p-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* BOTÕES DE AÇÃO */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2.5 px-6 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Enviando...' : 'Enviar Feedback do Beta 🚀'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
