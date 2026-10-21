import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  FileText,
  UserCheck,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Mail,
  Sparkles,
  Users,
  DollarSign,
  HeartHandshake,
  Check,
  Calendar,
} from 'lucide-react';
import { AuthUser } from '../../lib/supabaseClient';

interface LgpdTermsModalProps {
  isOpen: boolean;
  initialTab?: 'TERMS' | 'PRIVACY' | 'BETA' | 'RIGHTS';
  currentUser: AuthUser | null;
  isAccepted?: boolean;
  onClose: () => void;
  onAcceptTerms?: () => void;
  onDeleteOwnAccount?: () => Promise<void>;
}

export const LgpdTermsModal: React.FC<LgpdTermsModalProps> = ({
  isOpen,
  initialTab = 'TERMS',
  currentUser,
  isAccepted = false,
  onClose,
  onAcceptTerms,
  onDeleteOwnAccount,
}) => {
  const [activeSection, setActiveSection] = useState<'TERMS' | 'PRIVACY' | 'BETA' | 'RIGHTS'>(initialTab);
  const [confirmDeleteStep, setConfirmDeleteStep] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasAcceptedNow, setHasAcceptedNow] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setActiveSection(initialTab);
      setConfirmDeleteStep(false);
      setHasAcceptedNow(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const isRealLoggedUser =
    Boolean(currentUser?.email) && currentUser?.id !== 'usr-visitor-link';

  const isAlreadyAccepted = Boolean(
    isAccepted ||
    hasAcceptedNow ||
    isRealLoggedUser ||
    currentUser?.termsAcceptedAt ||
    currentUser?.privacyAcceptedAt ||
    currentUser?.lgpdConsentAt
  );

  const handleConfirmSelfDelete = async () => {
    if (!onDeleteOwnAccount) return;
    setIsDeleting(true);
    try {
      await onDeleteOwnAccount();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 block">
                Termos &amp; Conformidade • Lei nº 13.709/2018 (LGPD)
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Termos de Uso, Privacidade &amp; Regras
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-stone-200 bg-stone-50 text-xs font-extrabold text-stone-600 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSection('TERMS')}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'TERMS'
                ? 'border-rose-600 text-rose-700 bg-white'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Termos de Uso
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('PRIVACY')}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'PRIVACY'
                ? 'border-rose-600 text-rose-700 bg-white'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Privacidade (LGPD)
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('BETA')}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'BETA'
                ? 'border-rose-600 text-rose-700 bg-white'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Piloto Beta (10 Pioneiras)
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('RIGHTS')}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeSection === 'RIGHTS'
                ? 'border-rose-600 text-rose-700 bg-white'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Seus Direitos / Conta
          </button>
        </div>

        {/* Conteúdo Rolável */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-stone-700 leading-relaxed flex-1">
          {/* ========================================================= */}
          {/* ABA 1: TERMOS DE USO (CLIENTES, PROFISSIONAIS & ISENÇÃO) */}
          {/* ========================================================= */}
          {activeSection === 'TERMS' && (
            <div className="space-y-4">
              {/* Confirmação de Aceite Prévio Salvo */}
              {isRealLoggedUser && currentUser && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px] text-emerald-950 font-bold truncate">
                      Você aceitou os Termos de Uso em{' '}
                      <strong className="underline">
                        {currentUser.termsAcceptedAt
                          ? new Date(currentUser.termsAcceptedAt).toLocaleDateString('pt-BR')
                          : currentUser.lgpdConsentAt
                          ? new Date(currentUser.lgpdConsentAt).toLocaleDateString('pt-BR')
                          : 'no seu cadastro'}
                      </strong>{' '}
                      (Versão {currentUser.termsVersion || '2026.2'})
                    </span>
                  </div>
                  <span className="text-[10px] font-black bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 text-emerald-800 shrink-0">
                    ✓ Aceito
                  </span>
                </div>
              )}

              <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                <HeartHandshake className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-rose-950 text-xs">
                    Papel da Plataforma BellaDoor (Software como Serviço)
                  </h4>
                  <p className="text-[11px] text-rose-900 mt-0.5">
                    O <strong>BellaDoor</strong> é uma ferramenta tecnológica de agendamento online, vitrine digital e cálculo de taxa de deslocamento. <strong>A plataforma NÃO é empregadora, salão de beleza ou intermediadora bancária</strong>. A contratação do serviço e os acordos financeiros ocorrem diretamente entre a cliente e a profissional.
                  </p>
                </div>
              </div>

              {/* REGRAS DA CLIENTE */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5 text-stone-900">
                  <Users className="w-4 h-4 text-rose-600" />
                  1. Diretrizes para a CLIENTE (Quem Agenda)
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-stone-600">
                  <li>
                    <strong>Veracidade Cadastral:</strong> Fornecer endereço completo, bairro e telefone de WhatsApp verídicos para viabilizar a ida da profissional até o local.
                  </li>
                  <li>
                    <strong>Ambiente para Atendimento:</strong> Garantir ambiente seguro, limpo e adequado no imóvel para a realização do procedimento estético em domicílio.
                  </li>
                  <li>
                    <strong>Ciência sobre Sinal e Tolerâncias:</strong> A cliente reconhece que a cobrança de taxa de reserva/sinal (via Pix), as regras de atraso e os prazos de cancelamento <strong>são estipulados de forma autônoma pela profissional escolhida</strong>.
                  </li>
                  <li>
                    <strong>Cancelamentos de Última Hora e No-Show:</strong> A ausência no local agendado ou cancelamento fora do prazo informado confere à profissional o direito de reter o sinal para cobrir custos de deslocamento e a reserva do horário.
                  </li>
                  <li>
                    <strong>Tratamento Direto:</strong> Qualquer dúvida de pagamento de sinal ou solicitação de reagendamento deve ser tratada diretamente com a profissional via WhatsApp. O BellaDoor não custodia valores nem efetua estornos de transferências entre usuárias.
                  </li>
                </ul>
              </div>

              {/* REGRAS DA PROFISSIONAL */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5 text-stone-900">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  2. Diretrizes para a PROFISSIONAL AUTÔNOMA (Quem Atende)
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-stone-600">
                  <li>
                    <strong>Autonomia e Biossegurança:</strong> A profissional atua com total independência técnica, sendo a única e exclusiva responsável pela qualidade técnica, higiene, esterilização e produtos autorizados pela Anvisa.
                  </li>
                  <li>
                    <strong>Fixação Autônoma de Regras:</strong> A profissional é livre para definir seus preços, bairros atendidos, percentual de sinal e tolerância a atrasos.
                  </li>
                  <li>
                    <strong>Dever de Estorno em Desmarcação Própria:</strong> Caso a própria profissional necessite desmarcar o atendimento por imprevisto ou incompatibilidade de agenda, tem o <strong>dever legal de estornar 100% do sinal recebido</strong> via Pix para a cliente ou oferecer novo horário de comum acordo.
                  </li>
                  <li>
                    <strong>Cumprimento Fiscal:</strong> A profissional responde individualmente pelo recolhimento de suas obrigações tributárias e emissão de recibos às suas clientes.
                  </li>
                </ul>
              </div>

              {/* ISENÇÃO SOBRE O SINAL */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 space-y-1.5">
                <h4 className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  3. Isenção sobre Pagamentos de Sinal e Serviços
                </h4>
                <p className="text-[11px] text-amber-900">
                  O valor do sinal (Pix) transferido pela cliente vai diretamente para a conta da profissional. A plataforma BellaDoor não retém percentual sobre os atendimentos, não custodia valores e <strong>não responde solidariamente por eventuais divergências comerciais, estornos ou cancelamentos</strong> entre as partes.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 2: PRIVACIDADE (LGPD) */}
          {/* ========================================================= */}
          {activeSection === 'PRIVACY' && (
            <div className="space-y-4">
              {/* Confirmação de Aceite Prévio Salvo */}
              {isRealLoggedUser && currentUser && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px] text-emerald-950 font-bold truncate">
                      Você aceitou a Política de Privacidade em{' '}
                      <strong className="underline">
                        {currentUser.privacyAcceptedAt
                          ? new Date(currentUser.privacyAcceptedAt).toLocaleDateString('pt-BR')
                          : currentUser.lgpdConsentAt
                          ? new Date(currentUser.lgpdConsentAt).toLocaleDateString('pt-BR')
                          : 'no seu cadastro'}
                      </strong>{' '}
                      (Versão {currentUser.privacyVersion || '2026.2'})
                    </span>
                  </div>
                  <span className="text-[10px] font-black bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 text-emerald-800 shrink-0">
                    ✓ Aceito
                  </span>
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-emerald-950 text-xs">
                    Compromisso de Proteção de Dados (Lei nº 13.709/2018)
                  </h4>
                  <p className="text-[11px] text-emerald-900 mt-0.5">
                    O BellaDoor trata seus dados pessoais com total transparência e em estrita conformidade com a <strong>LGPD</strong>.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs">
                  1. Dados Coletados e Finalidade Específica
                </h4>
                <p>
                  Coletamos apenas o mínimo necessário para viabilizar o agendamento em domicílio:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-stone-600">
                  <li>
                    <strong>Clientes:</strong> Nome, WhatsApp, data de nascimento (exclusiva verificação de maioridade +18) e endereço do atendimento (para cálculo de taxa e rota da profissional).
                  </li>
                  <li>
                    <strong>Profissionais:</strong> Nome, telefone, email de acesso, chave Pix cadastrada (para exibição na tela de sinal) e tabela de serviços.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs">
                  2. Não Comercialização e Compartilhamento Restrito
                </h4>
                <p className="text-[11px] text-stone-600">
                  O BellaDoor <strong>NUNCA comercializa, aluga ou cede seus dados pessoais</strong> para terceiros. O endereço da cliente é compartilhado estritamente com a profissional escolhida para a realização do atendimento contratado.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs">
                  3. Segurança Criptográfica
                </h4>
                <p className="text-[11px] text-stone-600">
                  Senhas protegidas por criptografia SHA-256 / Firebase Auth, tráfego sob protocolo seguro HTTPS/TLS na nuvem Google Cloud e zero armazenamento de dados de cartão de crédito.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 3: PROGRAMA PILOTO BETA (10 PIONEIRAS) */}
          {/* ========================================================= */}
          {activeSection === 'BETA' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <h4 className="font-extrabold text-amber-950 text-xs">
                    Programa Piloto Beta — Grupo Pioneiro das 10 Profissionais
                  </h4>
                </div>
                <p className="text-[11px] text-amber-900">
                  Você faz parte de um grupo exclusivo de profissionais convidadas para testar o BellaDoor e moldar a plataforma ideal para atendimentos a domicílio.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs">
                  1. Acesso 100% Gratuito durante o Período de Testes
                </h4>
                <p className="text-[11px] text-stone-600">
                  Durante a fase de testes do piloto (30 a 60 dias), as profissionais pioneiras desfrutam de acesso completo e sem cobrança a todas as ferramentas (vitrine, taxa por bairro, regras de sinal e agenda).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs">
                  2. Contrapartida e Feedback
                </h4>
                <p className="text-[11px] text-stone-600">
                  Como contrapartida, a profissional concorda em utilizar a vitrine com clientes reais e responder às pesquisas de feedback do BellaDoor (disponíveis diretamente no painel), relatando facilidades e pontos de melhoria.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs">
                  3. Transição Transparente (Sem Cobranças Automáticas Surpresa)
                </h4>
                <p className="text-[11px] text-stone-600">
                  Ao término do programa piloto, a profissional será notificada com antecedência mínima de 10 dias sobre a continuidade no plano oficial (R$ 39,90/mês). <strong>Nenhuma cobrança automática será realizada sem seu consentimento prévio e voluntário.</strong>
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 4: DIREITOS DO TITULAR (LGPD) & EXCLUSÃO DE CONTA */}
          {/* ========================================================= */}
          {activeSection === 'RIGHTS' && (
            <div className="space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-rose-600" />
                  Direitos do Titular dos Dados (Art. 18 da LGPD)
                </h4>
                <p className="text-[11px] text-stone-600">
                  Conforme a Lei nº 13.709/2018, você pode a qualquer momento:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-stone-600">
                  <li>Confirmar a existência de tratamento e consultar suas informações cadastradas;</li>
                  <li>Atualizar dados incorretos ou desatualizados no painel;</li>
                  <li>Revogar consentimento e solicitar a <strong>exclusão total de seus dados</strong>.</li>
                </ul>
              </div>

              {/* Canal do Encarregado de Dados (DPO) */}
              <div className="bg-white border border-stone-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-stone-900">
                      Canal do Encarregado de Proteção de Dados (DPO)
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Contato direto para solicitações de privacidade: <strong>evertonrcsilva@gmail.com</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Se o usuário estiver logado: mostra o status do consentimento + botão de Exclusão da própria conta */}
              {isRealLoggedUser && currentUser && (
                <div className="border-t border-stone-200 pt-4 space-y-3">
                  <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-3.5 space-y-2.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-950 font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        Conta vinculada: <strong>{currentUser.email}</strong>
                      </span>
                      <span className="text-[10px] font-black text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Consentimentos Salvos &amp; Ativos
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-200/70 text-[10px]">
                      <div className="bg-white/90 border border-emerald-200 p-2 rounded-xl text-emerald-950">
                        <span className="text-emerald-800 font-extrabold flex items-center gap-1 block">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Termos de Uso
                        </span>
                        <p className="mt-0.5 text-stone-600">
                          Aceito em:{' '}
                          <strong>
                            {currentUser.termsAcceptedAt
                              ? new Date(currentUser.termsAcceptedAt).toLocaleDateString('pt-BR')
                              : currentUser.lgpdConsentAt
                              ? new Date(currentUser.lgpdConsentAt).toLocaleDateString('pt-BR')
                              : 'no cadastro'}
                          </strong>{' '}
                          (v{currentUser.termsVersion || '2026.2'})
                        </p>
                      </div>

                      <div className="bg-white/90 border border-emerald-200 p-2 rounded-xl text-emerald-950">
                        <span className="text-emerald-800 font-extrabold flex items-center gap-1 block">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Política de Privacidade (LGPD)
                        </span>
                        <p className="mt-0.5 text-stone-600">
                          Aceita em:{' '}
                          <strong>
                            {currentUser.privacyAcceptedAt
                              ? new Date(currentUser.privacyAcceptedAt).toLocaleDateString('pt-BR')
                              : currentUser.lgpdConsentAt
                              ? new Date(currentUser.lgpdConsentAt).toLocaleDateString('pt-BR')
                              : 'no cadastro'}
                          </strong>{' '}
                          (v{currentUser.privacyVersion || '2026.2'})
                        </p>
                      </div>
                    </div>
                  </div>

                  {!confirmDeleteStep ? (
                    <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold text-rose-950 flex items-center gap-1.5">
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          Excluir Minha Conta e Meus Dados (Art. 18, VI LGPD)
                        </p>
                        <p className="text-[11px] text-rose-800 mt-0.5">
                          Remove permanentemente seu cadastro e configurações da nuvem.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteStep(true)}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-extrabold transition cursor-pointer shrink-0"
                      >
                        Solicitar Exclusão
                      </button>
                    </div>
                  ) : (
                    <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-extrabold text-red-950">
                            Confirmar exclusão da conta ({currentUser.email})?
                          </p>
                          <p className="text-[11px] text-red-800 mt-0.5">
                            Esta ação é irreversível e encerrará sua sessão imediatamente.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteStep(false)}
                          className="px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-100 transition cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={handleConfirmSelfDelete}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition cursor-pointer disabled:opacity-60"
                        >
                          {isDeleting ? 'Excluindo...' : 'Sim, Excluir Minha Conta'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[10px] text-stone-500 font-medium">
            Versão 2026.2 • Ambiente Seguro SSL &amp; LGPD
          </span>
          <div className="flex items-center gap-2">
            {isAlreadyAccepted ? (
              <button
                type="button"
                disabled
                title="Você já aceitou expressamente os Termos de Uso e a Política de Privacidade."
                className="px-4 py-2 rounded-xl bg-stone-200 border border-stone-300 text-stone-500 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed select-none opacity-90 shadow-none"
              >
                <Check className="w-3.5 h-3.5 text-stone-500" />
                <span>Termos &amp; Políticas Já Aceitos</span>
              </button>
            ) : onAcceptTerms ? (
              <button
                type="button"
                onClick={() => {
                  setHasAcceptedNow(true);
                  if (onAcceptTerms) onAcceptTerms();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                Li e Concordo com os Termos
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
