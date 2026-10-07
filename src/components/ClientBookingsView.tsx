import React from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  MapPin,
  MessageCircle,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { ClientAppointment } from '../types/belladoor';

interface ClientBookingsViewProps {
  proAppointments: ClientAppointment[];
  proDisplayName: string;
  proAvatarUrl: string;
  proWhatsapp: string;
  showReviewForm: boolean;
  reviewRating: number;
  reviewClientName: string;
  reviewServiceName: string;
  reviewComment: string;
  onBackToExplore: () => void;
  onCloseReviewForm: () => void;
  onChangeReviewRating: (rating: number) => void;
  onChangeReviewClientName: (val: string) => void;
  onChangeReviewServiceName: (val: string) => void;
  onChangeReviewComment: (val: string) => void;
  onSubmitReview: (e: React.FormEvent) => void;
  onOpenReviewForAppointment: (app: ClientAppointment) => void;
  onCancelClientAppointment: (appointmentId: string, serviceName: string) => void;
}

export const ClientBookingsView: React.FC<ClientBookingsViewProps> = ({
  proAppointments,
  proDisplayName,
  proAvatarUrl,
  proWhatsapp,
  showReviewForm,
  reviewRating,
  reviewClientName,
  reviewServiceName,
  reviewComment,
  onBackToExplore,
  onCloseReviewForm,
  onChangeReviewRating,
  onChangeReviewClientName,
  onChangeReviewServiceName,
  onChangeReviewComment,
  onSubmitReview,
  onOpenReviewForAppointment,
  onCancelClientAppointment,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Topo da Página Meus Agendamentos */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-rose-950 text-white p-5 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={onBackToExplore}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-rose-400" />
            Voltar para a Vitrine
          </button>
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30 px-2.5 py-0.5 rounded-full">
            Área da Cliente
          </span>
        </div>
        <h1 className="text-lg font-extrabold tracking-tight">Meus Agendamentos</h1>
        <p className="text-xs text-stone-300 mt-0.5">
          Acompanhe seus atendimentos a domicílio, fale no WhatsApp ou avalie o serviço com estrelas.
        </p>
      </div>

      {/* FORMULÁRIO INTERNO DE AVALIAÇÃO COM ESTRELAS (Quando clicado em Avaliar) */}
      {showReviewForm && (
        <form
          onSubmit={onSubmitReview}
          className="bg-white rounded-3xl border-2 border-amber-300 p-5 shadow-md space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                Avaliação Verificada
              </span>
              <h3 className="text-sm font-extrabold text-stone-900 mt-1">
                Como foi seu atendimento?
              </h3>
              <p className="text-xs text-stone-500">
                Serviço: <strong className="text-rose-600">{reviewServiceName}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={onCloseReviewForm}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl bg-stone-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Seletor de 1 a 5 Estrelas */}
          <div className="text-center bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5">
            <p className="text-xs font-bold text-stone-700 mb-2">
              Toque nas estrelas para dar sua nota:
            </p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => onChangeReviewRating(star)}
                  className="p-1 transition transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-[11px] font-extrabold text-amber-700 mt-1.5">
              {reviewRating === 5
                ? '⭐⭐⭐⭐⭐ Excelente! Amei o atendimento!'
                : reviewRating === 4
                ? '⭐⭐⭐⭐ Muito bom!'
                : reviewRating === 3
                ? '⭐⭐⭐ Bom / Regular'
                : '⭐⭐ Precisa melhorar'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Seu Nome:</label>
              <input
                type="text"
                value={reviewClientName}
                onChange={(e) => onChangeReviewClientName(e.target.value)}
                placeholder="Ex: Fernanda Lima"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Serviço Realizado:
              </label>
              <input
                type="text"
                value={reviewServiceName}
                onChange={(e) => onChangeReviewServiceName(e.target.value)}
                placeholder="Ex: Alongamento em Fibra"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">
              Seu Comentário sobre a Profissional:*
            </label>
            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => onChangeReviewComment(e.target.value)}
              placeholder="Conte o que achou da pontualidade, higiene dos materiais e resultado do trabalho..."
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCloseReviewForm}
              className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              Publicar Avaliação na Vitrine
            </button>
          </div>
        </form>
      )}

      {/* Lista de Agendamentos da Cliente */}
      {proAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 space-y-3">
          <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-sm font-bold text-stone-800">Você ainda não possui agendamentos</p>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            Escolha uma profissional na vitrine para agendar seu atendimento em casa!
          </p>
          <button
            type="button"
            onClick={onBackToExplore}
            className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ver Profissionais Disponíveis
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {proAppointments.map((app) => {
            const isCancelled = app.status === 'Cancelado';
            const isCompleted = app.status === 'Concluído' || app.reviewed;
            return (
              <div
                key={app.id}
                className={`bg-white rounded-3xl border p-4 shadow-xs space-y-3 transition ${
                  isCancelled
                    ? 'border-stone-200 opacity-65 bg-stone-50'
                    : 'border-stone-200 hover:border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={proAvatarUrl}
                      alt={app.proName || proDisplayName}
                      className="w-12 h-12 rounded-2xl object-cover border border-stone-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            isCancelled
                              ? 'bg-red-100 text-red-700'
                              : isCompleted
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isCancelled
                            ? 'Cancelado'
                            : isCompleted
                            ? '★ Concluído'
                            : '✓ Confirmado'}
                        </span>
                        <span className="text-[11px] text-stone-400 font-medium">
                          com {app.proName || proDisplayName}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-sm text-stone-900 mt-0.5">
                        {app.serviceName}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-stone-900 block">
                      R$ {app.totalPrice.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {app.travelFee === 0
                        ? 'Deslocamento Grátis'
                        : `Inclui R$ ${app.travelFee} desloc.`}
                    </span>
                  </div>
                </div>

                <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>
                      {app.date.split('-').reverse().join('/')} às <strong>{app.time}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-600 truncate">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">
                      {app.address} ({app.neighborhood})
                    </span>
                  </div>
                </div>

                {/* Botões de Ação do Agendamento da Cliente */}
                {!isCancelled && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={`https://wa.me/${proWhatsapp}?text=${encodeURIComponent(
                        `Olá, ${proDisplayName}! Tudo bem? Estou falando sobre meu agendamento de *${app.serviceName}* no dia ${app.date
                          .split('-')
                          .reverse()
                          .join('/')} às ${app.time}.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>

                    {!app.reviewed ? (
                      <button
                        type="button"
                        onClick={() => onOpenReviewForAppointment(app)}
                        className="flex-1 py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        Avaliar Atendimento
                      </button>
                    ) : (
                      <span className="px-3 py-2.5 bg-stone-100 text-stone-500 rounded-xl text-[11px] font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Avaliado
                      </span>
                    )}

                    {app.status === 'Confirmado' && (
                      <button
                        type="button"
                        onClick={() => onCancelClientAppointment(app.id, app.serviceName)}
                        className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition cursor-pointer"
                        title="Cancelar este agendamento"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
