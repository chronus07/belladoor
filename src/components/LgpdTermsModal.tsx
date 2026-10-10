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
} from 'lucide-react';
import { AuthUser } from '../../lib/supabaseClient';

interface LgpdTermsModalProps {
  isOpen: boolean;
  initialTab?: 'PRIVACY' | 'TERMS' | 'RIGHTS';
  currentUser: AuthUser | null;
  onClose: () => void;
  onAcceptTerms?: () => void;
  onDeleteOwnAccount?: () => Promise<void>;
}

export const LgpdTermsModal: React.FC<LgpdTermsModalProps> = ({
  isOpen,
  initialTab = 'PRIVACY',
  currentUser,
  onClose,
  onAcceptTerms,
  onDeleteOwnAccount,
}) => {
  const [activeSection, setActiveSection] = useState<'PRIVACY' | 'TERMS' | 'RIGHTS'>(initialTab);
  const [confirmDeleteStep, setConfirmDeleteStep] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setActiveSection(initialTab);
      setConfirmDeleteStep(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const isRealLoggedUser =
    Boolean(currentUser?.email) && currentUser?.id !== 'usr-visitor-link';

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
                Conformidade Legal • Lei nº 13.709/2018 (LGPD)
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Termos de Uso, Privacidade &amp; Direitos do Titular
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
        <div className="flex border-b border-stone-200 bg-stone-50 text-xs font-extrabold text-stone-600 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('PRIVACY')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
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
            onClick={() => setActiveSection('TERMS')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
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
            onClick={() => setActiveSection('RIGHTS')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-stone-700 leading-relaxed">
          {activeSection === 'PRIVACY' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-emerald-950 text-xs">
                    Compromisso de Segurança e Proteção de Dados (LGPD)
                  </h4>
                  <p className="text-[11px] text-emerald-900 mt-0.5">
                    A plataforma <strong>BellaDoor</strong> trata seus dados pessoais em estrita conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018)</strong>.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs">
                  1. Quais Dados Coletamos e Finalidade (Art. 6º, I e III da LGPD)
                </h4>
                <p>
                  Coletamos apenas o mínimo necessário para viabilizar o agendamento de serviços de beleza a domicílio:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-stone-600">
                  <li>
                    <strong>Dados de Identificação e Contato:</strong> Nome completo, e-mail, WhatsApp e data de nascimento (exclusivamente para verificação obrigatória de maioridade +18 anos, conforme Art. 14 da LGPD).
                  </li>
                  <li>
                    <strong>Dados de Localização para Atendimento:</strong> CEP, bairro, cidade e endereço informados pela cliente no momento do agendamento para cálculo automático de deslocamento e realização do atendimento em domicílio pela profissional escolhida.
                  </li>
                  <li>
                    <strong>Dados da Vitrine Profissional:</strong> Nome profissional, especialidade, fotos de portfólio, tabela de serviços e bairros atendidos. Na vitrine pública, apenas o bairro e a cidade-base da profissional são exibidos.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs">
                  2. Segurança Criptográfica e Pagamentos (Art. 46 da LGPD)
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-stone-600">
                  <li>
                    <strong>Senhas Criptografadas:</strong> Todas as senhas passam por criptografia irreversível (Hash <code>SHA-256</code> + Firebase Authentication) e jamais ficam visíveis em texto aberto.
                  </li>
                  <li>
                    <strong>Zero Armazenamento de Cartões:</strong> Os pagamentos de assinatura das profissionais (PIX ou Cartão) são processados diretamente no ambiente certificado do <strong>Mercado Pago</strong>. O BellaDoor não armazena número de cartão de crédito nem código de segurança (CVV).
                  </li>
                  <li>
                    <strong>Tráfego Seguro:</strong> Todas as comunicações utilizam protocolo seguro criptografado <code>HTTPS/TLS</code> na infraestrutura Google Cloud / Firebase.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs">
                  3. Compartilhamento Restrito de Dados
                </h4>
                <p className="text-[11px] text-stone-600">
                  O BellaDoor <strong>nunca vende nem comercializa dados pessoais</strong>. Os dados de um agendamento (nome, telefone e endereço do atendimento) são compartilhados estritamente entre a cliente solicitante e a profissional escolhida para a execução do serviço.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'TERMS' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs">
                  1. Papel da Plataforma BellaDoor
                </h4>
                <p className="text-[11px] text-stone-600">
                  O <strong>BellaDoor</strong> é uma plataforma tecnológica de vitrine online, gestão de agenda e cálculo de taxa de deslocamento para profissionais autônomas da beleza a domicílio. Os serviços estéticos agendados e os valores cobrados pelos atendimentos são prestados e recebidos diretamente entre a profissional e a cliente.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs">
                  2. Período de Teste Grátis (7 Dias), Cupons e Planos para Profissionais
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-stone-600">
                  <li>
                    <strong>7 Dias Grátis no Cadastro:</strong> Toda profissional recém-cadastrada recebe 7 dias corridos de acesso gratuito para configurar sua vitrine e testar a plataforma sem cobrança automática.
                  </li>
                  <li>
                    <strong>Bloqueio após Expiração:</strong> Ao término dos 7 dias grátis (ou do prazo de um cupom/plano), caso não haja renovação ativa, a agenda e a vitrine ficam temporariamente pausadas até a ativação de um plano ou cupom.
                  </li>
                  <li>
                    <strong>Cancelamento Livre de Renovação Automática:</strong> A profissional assinante do plano mensal recorrente pode cancelar a renovação automática a qualquer momento na aba <em>Plano &amp; Cupom</em>, mantendo 100% dos dias já pagos liberados até o fim do ciclo vigente.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs">
                  3. Uso Responsável e Maioridade (+18 Anos)
                </h4>
                <p className="text-[11px] text-stone-600">
                  O cadastro e a utilização da plataforma são exclusivos para maiores de 18 anos. A profissional é responsável pela veracidade das fotos do seu portfólio, valores de serviços e cumprimento dos horários agendados com suas clientes.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'RIGHTS' && (
            <div className="space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-rose-600" />
                  Direitos do Titular dos Dados (Art. 18 da LGPD)
                </h4>
                <p className="text-[11px] text-stone-600">
                  Conforme o Artigo 18 da Lei nº 13.709/2018, você tem direito garantido a:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-stone-600">
                  <li>Confirmar a existência de tratamento e acessar seus dados cadastrais;</li>
                  <li>Corrigir dados incompletos, inexatos ou desatualizados diretamente no seu painel;</li>
                  <li>Revogar o consentimento e <strong>excluir sua conta e seus dados pessoais</strong> a qualquer momento.</li>
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
                      Canal de Privacidade / Encarregado (DPO)
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Dúvidas ou solicitações sobre proteção de dados: <strong>evertonrcsilva@gmail.com</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Se o usuário estiver logado: mostra o status do consentimento + botão de Exclusão da própria conta */}
              {isRealLoggedUser && currentUser && (
                <div className="border-t border-stone-200 pt-4 space-y-3">
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-950 font-semibold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      Conta vinculada: <strong>{currentUser.email}</strong>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                      Consentimento LGPD Ativo
                    </span>
                  </div>

                  {!confirmDeleteStep ? (
                    <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold text-rose-950 flex items-center gap-1.5">
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          Excluir Minha Conta e Meus Dados (Art. 18, VI LGPD)
                        </p>
                        <p className="text-[11px] text-rose-800 mt-0.5">
                          Remove permanentemente seu cadastro e dados pessoais da plataforma BellaDoor.
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
                            Tem certeza que deseja excluir sua conta ({currentUser.email})?
                          </p>
                          <p className="text-[11px] text-red-800 mt-0.5">
                            Esta ação apagará seu cadastro, vitrine e configurações da nuvem e encerrará sua sessão imediatamente.
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
                          {isDeleting ? 'Excluindo Dados...' : 'Sim, Excluir Minha Conta Agora'}
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
            Versão 2026.1 • Ambiente Seguro SSL &amp; LGPD
          </span>
          <div className="flex items-center gap-2">
            {onAcceptTerms && (
              <button
                type="button"
                onClick={() => {
                  onAcceptTerms();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition cursor-pointer shadow-xs"
              >
                Li e Concordo com os Termos
              </button>
            )}
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
