import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  MessageCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Clock,
  AlertTriangle,
  QrCode,
  DollarSign,
  HelpCircle,
  Eye,
  Sliders,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { BookingConfirmationSettings, PixKeyType } from '../types/belladoor';
import {
  PIX_KEY_LABELS,
  getDefaultBookingRules,
  getDefaultMessageTemplate,
  formatConfirmationMessage,
  buildWhatsAppLink,
  calculateDeposit,
} from '../utils/bookingRules';

interface BookingRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: BookingConfirmationSettings;
  onSave: (settings: BookingConfirmationSettings) => void;
  proName: string;
  proWhatsapp: string;
  proEmail?: string;
  isBarbershop?: boolean;
}

export const BookingRulesModal: React.FC<BookingRulesModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSave,
  proName,
  proWhatsapp,
  proEmail,
  isBarbershop = false,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'message' | 'preview'>('rules');
  const [settings, setSettings] = useState<BookingConfirmationSettings>(currentSettings);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(currentSettings);
      setSaveSuccess(false);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  // Exemplo de agendamento fictício para a pré-visualização ao vivo
  const sampleBooking = {
    clientName: 'Mariana Silva',
    serviceName: isBarbershop ? 'Corte Degradê + Barboterapia' : 'Maquiagem Social Completa',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    time: '15:30',
    locationType: 'STUDIO' as const,
    address: 'Av. Paulista, 1000 - Sala 42',
    totalPrice: isBarbershop ? 80.0 : 160.0,
  };

  const previewMessage = formatConfirmationMessage({
    settings,
    booking: sampleBooking,
    proName: proName || 'Profissional',
    proWhatsapp,
    isBarbershop,
  });

  const { depositAmount, remainingAmount, depositPercentage } = calculateDeposit(
    sampleBooking.totalPrice,
    settings
  );

  const handleSave = () => {
    onSave(settings);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  const handleToggleDeposit = (checked: boolean) => {
    setSettings((prev) => {
      const currentTpl = prev.customMessageTemplate;
      if (checked) {
        // Ativando cobrança de sinal: restaura o template com sinal ou gera o padrão
        const nextTpl =
          prev.templateWithDeposit && prev.templateWithDeposit.includes('{valor_sinal}')
            ? prev.templateWithDeposit
            : getDefaultMessageTemplate(isBarbershop, true);
        return {
          ...prev,
          requireDeposit: true,
          templateWithoutDeposit: currentTpl,
          customMessageTemplate: nextTpl,
        };
      } else {
        // Desativando cobrança de sinal: restaura o template sem sinal ou gera o padrão
        const nextTpl =
          prev.templateWithoutDeposit && !prev.templateWithoutDeposit.includes('{valor_sinal}')
            ? prev.templateWithoutDeposit
            : getDefaultMessageTemplate(isBarbershop, false);
        return {
          ...prev,
          requireDeposit: false,
          templateWithDeposit: currentTpl,
          customMessageTemplate: nextTpl,
        };
      }
    });
  };

  const handleResetTemplate = () => {
    const defaultTpl = getDefaultMessageTemplate(isBarbershop, settings.requireDeposit);
    setSettings((prev) => ({
      ...prev,
      customMessageTemplate: defaultTpl,
      templateWithDeposit: prev.requireDeposit ? defaultTpl : prev.templateWithDeposit,
      templateWithoutDeposit: !prev.requireDeposit ? defaultTpl : prev.templateWithoutDeposit,
    }));
  };

  const insertTag = (tag: string) => {
    setSettings((prev) => {
      const updated = `${prev.customMessageTemplate || ''} ${tag}`;
      return {
        ...prev,
        customMessageTemplate: updated,
        templateWithDeposit: prev.requireDeposit ? updated : prev.templateWithDeposit,
        templateWithoutDeposit: !prev.requireDeposit ? updated : prev.templateWithoutDeposit,
      };
    });
  };

  const handleTestWhatsApp = () => {
    const testLink = buildWhatsAppLink(proWhatsapp || '5511999999999', previewMessage);
    window.open(testLink, '_blank');
  };

  const handleCopyPixKey = () => {
    if (!settings.pixKey) return;
    navigator.clipboard.writeText(settings.pixKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(previewMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* CABEÇALHO */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Regras de Agendamento & Sinal de 50%
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Anti-Furo
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Configure as regras, prazo do PIX e a mensagem que sua cliente receberá ao fechar o agendamento.
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

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-2 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 pt-1.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'rules'
                ? 'border-emerald-600 text-emerald-700 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            1. Sinal de 50% & Chave PIX
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('message')}
            className={`pb-2.5 pt-1.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'message'
                ? 'border-emerald-600 text-emerald-700 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            2. Mensagem do WhatsApp
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 pt-1.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'preview'
                ? 'border-emerald-600 text-emerald-700 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            3. Pré-visualização ao Vivo
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-stone-800 flex-1">
          {/* ========================================================================= */}
          {/* ABA 1: CONFIGURAÇÃO DE REGRAS, SINAL E PIX */}
          {/* ========================================================================= */}
          {activeTab === 'rules' && (
            <div className="space-y-5">
              {/* CARD DE ATIVAÇÃO DO SINAL DE 50% */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-stone-900">
                        Cobrar Sinal para Garantir o Horário
                      </h4>
                      <p className="text-xs text-stone-600 mt-0.5">
                        Exige que a cliente pague uma porcentagem antecipada (sinal de 50%) para confirmar e travar o horário na sua agenda.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={settings.requireDeposit}
                      onChange={(e) => handleToggleDeposit(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {settings.requireDeposit && (
                  <div className="mt-4 pt-3 border-t border-emerald-200/80">
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Porcentagem do Sinal de Confirmação:
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[30, 50, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setSettings((prev) => ({ ...prev, depositPercentage: pct }))}
                          className={`py-1.5 px-3.5 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                            settings.depositPercentage === pct
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                          }`}
                        >
                          {pct}% {pct === 50 && '(Recomendado)'} {pct === 100 && '(Integral)'}
                        </button>
                      ))}

                      <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-xl px-2.5 py-1">
                        <span className="text-xs text-stone-500 font-bold">Outro:</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={settings.depositPercentage}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              depositPercentage: Math.min(100, Math.max(1, Number(e.target.value) || 50)),
                            }))
                          }
                          className="w-12 text-xs font-bold text-stone-900 outline-none text-right"
                        />
                        <span className="text-xs text-stone-500 font-bold">%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* DADOS DO PIX */}
              {settings.requireDeposit && (
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-900">
                      Chave PIX da Profissional (para Recebimento do Sinal)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        Tipo de Chave PIX:
                      </label>
                      <select
                        value={settings.pixKeyType}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            pixKeyType: e.target.value as PixKeyType,
                          }))
                        }
                        className="w-full text-xs font-medium p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="PHONE">Celular / WhatsApp</option>
                        <option value="CPF">CPF</option>
                        <option value="CNPJ">CNPJ</option>
                        <option value="EMAIL">E-mail</option>
                        <option value="RANDOM">Chave Aleatória (EVP)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        Sua Chave PIX:
                      </label>
                      <input
                        type="text"
                        value={settings.pixKey}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, pixKey: e.target.value }))
                        }
                        placeholder={
                          settings.pixKeyType === 'PHONE'
                            ? '(11) 99999-9999'
                            : settings.pixKeyType === 'CPF'
                            ? '000.000.000-00'
                            : settings.pixKeyType === 'EMAIL'
                            ? 'seuemail@exemplo.com'
                            : 'Chave PIX'
                        }
                        className="w-full text-xs font-bold p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Nome do Titular da Conta (para a cliente conferir no banco):
                    </label>
                    <input
                      type="text"
                      value={settings.pixReceiverName}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, pixReceiverName: e.target.value }))
                      }
                      placeholder={proName || 'Seu Nome Completo ou Razão Social'}
                      className="w-full text-xs font-medium p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* POLÍTICAS DE TOLERÂNCIA E CANCELAMENTO */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-900">
                    Prazos, Tolerâncias e Políticas
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {settings.requireDeposit && (
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        Prazo para Envio do Sinal:
                      </label>
                      <select
                        value={settings.depositTimeLimitHours}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            depositTimeLimitHours: Number(e.target.value),
                          }))
                        }
                        className="w-full text-xs font-medium p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value={1}>Até 1 hora após agendamento</option>
                        <option value={2}>Até 2 horas (Recomendado)</option>
                        <option value={4}>Até 4 horas</option>
                        <option value={12}>Até 12 horas</option>
                        <option value={24}>Até 24 horas</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Tolerância Máxima de Atraso:
                    </label>
                    <select
                      value={settings.delayToleranceMinutes}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          delayToleranceMinutes: Number(e.target.value),
                        }))
                      }
                      className="w-full text-xs font-medium p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value={10}>10 minutos</option>
                      <option value={15}>15 minutos (Padrão)</option>
                      <option value={20}>20 minutos</option>
                      <option value={30}>30 minutos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Aviso Mínimo de Cancelamento:
                    </label>
                    <select
                      value={settings.cancellationNoticeHours}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          cancellationNoticeHours: Number(e.target.value),
                        }))
                      }
                      className="w-full text-xs font-medium p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value={12}>12 horas antes</option>
                      <option value={24}>24 horas antes (Padrão)</option>
                      <option value={48}>48 horas antes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Regras e Orientações Extras do Atendimento (um por linha):
                  </label>
                  <textarea
                    rows={3}
                    value={settings.customRules}
                    onChange={(e) => setSettings((prev) => ({ ...prev, customRules: e.target.value }))}
                    placeholder="Ex: • Comparecer sem maquiagem&#10;• Não trazer acompanhantes sem aviso prévio&#10;• Informar alergias previamente"
                    className="w-full text-xs font-mono p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Essas regras aparecem na tela de confirmação e na mensagem enviada pelo WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 2: EDITOR DA MENSAGEM DO WHATSAPP */}
          {/* ========================================================================= */}
          {activeTab === 'message' && (
            <div className="space-y-4">
              {/* STATUS DO MODO ATUAL DA MENSAGEM */}
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                  settings.requireDeposit
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                    : 'bg-amber-50 text-amber-950 border-amber-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{settings.requireDeposit ? '💰' : '📝'}</span>
                  <div>
                    <p className="font-extrabold text-xs">
                      {settings.requireDeposit
                        ? `Mensagem configurada para Agendamentos COM Sinal (${settings.depositPercentage}%)`
                        : 'Mensagem configurada para Agendamentos SEM cobrança de sinal'}
                    </p>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      {settings.requireDeposit
                        ? 'Contém os dados do serviço, valor de sinal de 50%, chave PIX e regras de agendamento.'
                        : 'Contém a confirmação direta do horário, orientações e regras sem cobrança antecipada.'}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 shadow-2xs ${
                    settings.requireDeposit
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {settings.requireDeposit ? 'Sinal Ativo' : 'Sinal Desativado'}
                </span>
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-stone-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Tags Dinâmicas (Clique para inserir no texto):
                  </div>
                  <button
                    type="button"
                    onClick={handleResetTemplate}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restaurar Mensagem Padrão
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { tag: '{cliente}', label: 'Nome da Cliente' },
                    { tag: '{servico}', label: 'Serviço' },
                    { tag: '{data}', label: 'Data' },
                    { tag: '{horario}', label: 'Horário' },
                    { tag: '{local}', label: 'Local' },
                    { tag: '{valor_total}', label: 'Valor Total' },
                    ...(settings.requireDeposit
                      ? [
                          { tag: '{valor_sinal}', label: 'Sinal 50%' },
                          { tag: '{porcentagem_sinal}', label: '% Sinal' },
                          { tag: '{restante}', label: 'Restante' },
                          { tag: '{chave_pix}', label: 'Chave PIX' },
                          { tag: '{tipo_chave}', label: 'Tipo Chave' },
                          { tag: '{titular_pix}', label: 'Titular PIX' },
                          { tag: '{prazo_sinal}', label: 'Prazo Sinal' },
                        ]
                      : []),
                    { tag: '{tolerancia}', label: 'Tolerância' },
                    { tag: '{aviso_cancelamento}', label: 'Aviso Cancelamento' },
                    { tag: '{regras}', label: 'Bloco de Regras' },
                  ].map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => insertTag(item.tag)}
                      className="px-2 py-1 bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-300 hover:border-emerald-300 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer"
                      title={`Inserir ${item.label}`}
                    >
                      {item.tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Template da Mensagem Enviada pelo WhatsApp:
                </label>
                <textarea
                  rows={14}
                  value={settings.customMessageTemplate}
                  onChange={(e) => {
                    const newTpl = e.target.value;
                    setSettings((prev) => ({
                      ...prev,
                      customMessageTemplate: newTpl,
                      templateWithDeposit: prev.requireDeposit ? newTpl : prev.templateWithDeposit,
                      templateWithoutDeposit: !prev.requireDeposit ? newTpl : prev.templateWithoutDeposit,
                    }));
                  }}
                  className="w-full text-xs font-mono p-3 bg-stone-50 border border-stone-300 rounded-2xl focus:bg-white focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  💡 A mensagem é pré-carregada automaticamente quando a cliente clica em "Confirmar no WhatsApp" após agendar.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 3: PRÉ-VISUALIZAÇÃO AO VIVO */}
          {/* ========================================================================= */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. VISUALIZAÇÃO NO WHATSAPP (SIMULAÇÃO) */}
                <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-xs flex flex-col bg-[#e5ddd5]">
                  <div className="bg-[#075e54] text-white p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-400 flex items-center justify-center font-bold text-white text-xs">
                        {sampleBooking.clientName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight">{sampleBooking.clientName}</p>
                        <p className="text-[10px] text-emerald-100">online</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                      WhatsApp Simulação
                    </span>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-end">
                    <div className="bg-[#dcf8c6] text-stone-900 p-3 rounded-2xl rounded-tr-xs shadow-xs text-xs whitespace-pre-wrap leading-relaxed max-w-full font-sans border border-[#b2d8a0]/40">
                      {previewMessage}
                      <div className="text-[9px] text-stone-500 text-right mt-1 flex items-center justify-end gap-1 font-bold">
                        <span>15:31</span>
                        <span className="text-sky-600">✓✓</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-stone-100 border-t border-stone-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedMessage ? 'Copiado!' : 'Copiar Texto'}
                    </button>

                    <button
                      type="button"
                      onClick={handleTestWhatsApp}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Testar no Meu WhatsApp
                    </button>
                  </div>
                </div>

                {/* 2. VISUALIZAÇÃO DO CARD NA TELA DA CLIENTE */}
                <div className="border border-stone-200 rounded-2xl p-4 bg-white shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      Como a Cliente Vê na Tela Web
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Confirmação
                    </span>
                  </div>

                  {/* BOX DO SINAL DE 50% */}
                  {settings.requireDeposit ? (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-emerald-50 border-2 border-emerald-400/80 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Sinal de {depositPercentage}% para Garantir Horário
                        </span>
                        <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                          Segura a Vaga
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-white p-2 rounded-xl border border-stone-200">
                          <p className="text-[10px] text-stone-500 font-bold">Sinal a Pagar Agora</p>
                          <p className="text-base font-black text-emerald-700">
                            R$ {depositAmount.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-stone-200">
                          <p className="text-[10px] text-stone-500 font-bold">Restante no Atendimento</p>
                          <p className="text-base font-black text-stone-700">
                            R$ {remainingAmount.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-emerald-200 space-y-1">
                        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">
                          Chave PIX ({PIX_KEY_LABELS[settings.pixKeyType]}):
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-black text-stone-900 truncate">
                            {settings.pixKey || 'Chave PIX não cadastrada'}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyPixKey}
                            className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition shrink-0 flex items-center gap-1"
                          >
                            {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copiedKey ? 'Copiado!' : 'Copiar'}
                          </button>
                        </div>
                        {settings.pixReceiverName && (
                          <p className="text-[10px] text-stone-500">
                            Titular: <strong>{settings.pixReceiverName}</strong>
                          </p>
                        )}
                      </div>

                      <div className="text-[11px] text-amber-900 bg-amber-100/70 p-2 rounded-xl flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Envie o comprovante em até <strong>{settings.depositTimeLimitHours}h</strong> para confirmar.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-stone-50 via-emerald-50/20 to-stone-50 border border-stone-200 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          Pagamento Direto no Atendimento
                        </span>
                        <span className="text-[10px] font-extrabold bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full">
                          Sem Sinal Prévio
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-stone-200 text-center">
                        <p className="text-[10px] text-stone-500 font-bold">Valor Total a Pagar no Dia</p>
                        <p className="text-base font-black text-stone-900">
                          R$ {sampleBooking.totalPrice.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-relaxed text-center">
                        A cliente não precisa adiantar sinal. Ela faz o pagamento integral de <strong>R$ {sampleBooking.totalPrice.toFixed(2).replace('.', ',')}</strong> no dia do atendimento.
                      </p>
                    </div>
                  )}

                  {/* REGRAS */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-700">
                      Regras do Atendimento:
                    </p>
                    <ul className="text-xs text-stone-600 space-y-1">
                      <li>• Tolerância máxima de atraso: <strong>{settings.delayToleranceMinutes} minutos</strong></li>
                      <li>• Remarcações com no mínimo <strong>{settings.cancellationNoticeHours}h</strong> de antecedência</li>
                      {settings.customRules && (
                        <li className="whitespace-pre-wrap">{settings.customRules}</li>
                      )}
                    </ul>
                  </div>

                  {/* BOTÃO SIMULADO DA CLIENTE NA TELA WEB */}
                  <div className="pt-1">
                    <div className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs opacity-95 cursor-default select-none">
                      <MessageCircle className="w-4 h-4" />
                      {settings.requireDeposit
                        ? 'Enviar Comprovante e Confirmar no WhatsApp'
                        : `Confirmar no WhatsApp de ${proName || 'Profissional'}`}
                    </div>
                    <p className="text-[10px] text-stone-400 text-center mt-1">
                      {settings.requireDeposit
                        ? '💡 Botão que a cliente clica na tela web após finalizar a pré-reserva com sinal.'
                        : '💡 A cliente clica no botão para enviar a confirmação sem exigência de sinal para seu WhatsApp.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ COM AÇÕES */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestWhatsApp}
              className="py-2.5 px-3.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              Testar no WhatsApp
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  Salvo com Sucesso!
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Salvar Regras & Sinal
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
