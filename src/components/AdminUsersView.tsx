import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Pencil,
  Trash2,
  User,
  Mail,
  Calendar,
  Phone,
  MapPin,
  CheckCircle,
  AlertTriangle,
  X,
  ArrowLeft,
  Sparkles,
  Plus,
  Loader2,
  Award,
  Ticket,
  CreditCard,
  Copy,
  ExternalLink,
  KeyRound,
  MessageCircle,
  TrendingUp,
  Clock,
  FileCheck,
  Check,
  Eye,
  Users,
} from 'lucide-react';
import { AuthUser } from '../../lib/supabaseClient';
import { MockProfessional } from '../data/mockData';
import { UiDialogPayload, ClientAppointment } from '../types/belladoor';
import {
  CouponItem,
  MercadoPagoConfig,
  OFFICIAL_MP_RECURRING_PLAN_URL,
} from '../utils/mercadoPago';
import { AdminDashboardTab } from './AdminDashboardTab';
import { BetaFeedbackEntry } from '../../lib/firebaseClient';

export interface UnifiedAdminUser {
  key: string;
  id: string;
  email: string;
  fullName: string;
  birthDate?: string;
  role: 'CLIENT' | 'PROFESSIONAL';
  emailVerified: boolean;
  avatarUrl?: string;
  whatsapp?: string;
  title?: string;
  baseCity?: string;
  baseNeighborhood?: string;
  subscriptionStatus?: 'TRIAL' | 'ACTIVE';
  trialDaysLeft?: number;
  proKey?: string;
  inDirectory?: boolean;
  updatedAt?: string;
  newPasswordPlain?: string;
  paymentMethod?: string;
  appliedCoupon?: string;
  isVerified?: boolean;
  verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  verificationDocUrl?: string;
  verificationDocType?: 'RG' | 'CNH' | 'OUTRO';
  verifiedAt?: string;
  verificationNotes?: string;
}

interface AdminUsersViewProps {
  currentUserEmail: string;
  cloudAccounts: Record<string, any>;
  directoryPros: Record<string, MockProfessional>;
  allAppointments?: ClientAppointment[];
  betaFeedbacks?: BetaFeedbackEntry[];
  coupons: CouponItem[];
  mpConfig: MercadoPagoConfig;
  subscriptionStatus: 'TRIAL' | 'ACTIVE';
  onSaveUser: (
    originalEmail: string,
    updatedUser: UnifiedAdminUser
  ) => Promise<{ ok: boolean; error?: string }>;
  onDeleteUser: (user: UnifiedAdminUser) => Promise<{ ok: boolean; error?: string }>;
  onCreateCoupon: (coupon: CouponItem) => void;
  onDeleteCoupon: (code: string) => void;
  onUpdateMpConfig: (config: MercadoPagoConfig) => void;
  onToggleSimulationStatus: () => void;
  onShowUiDialog: (dialog: UiDialogPayload) => void;
  onCloseAdmin: () => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  currentUserEmail,
  cloudAccounts,
  directoryPros,
  allAppointments = [],
  betaFeedbacks = [],
  coupons,
  mpConfig,
  subscriptionStatus,
  onSaveUser,
  onDeleteUser,
  onCreateCoupon,
  onDeleteCoupon,
  onUpdateMpConfig,
  onToggleSimulationStatus,
  onShowUiDialog,
  onCloseAdmin,
}) => {
  const [adminSection, setAdminSection] = useState<'DASHBOARD' | 'USERS' | 'VERIFICATIONS' | 'COUPONS' | 'MERCADO_PAGO'>('DASHBOARD');
  const [inspectingDocUser, setInspectingDocUser] = useState<UnifiedAdminUser | null>(null);
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CLIENT' | 'PROFESSIONAL'>('ALL');
  const [proStatusFilter, setProStatusFilter] = useState<
    'ALL' | 'ACTIVE_PRO' | 'TRIAL_PRO' | 'EXPIRED_PRO'
  >('ALL');
  const [editingUser, setEditingUser] = useState<UnifiedAdminUser | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [originalEditEmail, setOriginalEditEmail] = useState('');
  const [deletingUser, setDeletingUser] = useState<UnifiedAdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Estados do formulário de criação de novo cupom (Admin)
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDays, setNewCouponDays] = useState<number>(365);
  const [newCouponDesc, setNewCouponDesc] = useState('');

  // Estados de configuração do Mercado Pago (Admin)
  const [accessTokenInput, setAccessTokenInput] = useState(mpConfig.mpAccessToken || '');
  const [pixKeyInput, setPixKeyInput] = useState(mpConfig.pixKey);
  const [merchantNameInput, setMerchantNameInput] = useState(mpConfig.merchantName);
  const [recurringUrlInput, setRecurringUrlInput] = useState(
    mpConfig.recurringMonthlyCardUrl || OFFICIAL_MP_RECURRING_PLAN_URL
  );
  const [annualUrlInput, setAnnualUrlInput] = useState(mpConfig.annualCardUrl);
  const [supportWhatsappInput, setSupportWhatsappInput] = useState(
    mpConfig.supportWhatsapp || ''
  );

  const handleAddCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCouponCode.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) return;

    const labelMap: Record<number, string> = {
      15: '+15 Dias Livres',
      30: '30 Dias Livres (1 Mês)',
      60: '60 Dias Livres (2 Meses)',
      90: '90 Dias Livres (3 Meses)',
      180: '180 Dias Livres (6 Meses)',
      365: '1 Ano Livre (365 dias)',
    };

    onCreateCoupon({
      code: cleanCode,
      days: newCouponDays,
      label: labelMap[newCouponDays] || `${newCouponDays} Dias Livres`,
      description:
        newCouponDesc.trim() ||
        `Cupom de parceria com ${newCouponDays} dias de acesso gratuito.`,
      active: true,
      createdAt: new Date().toISOString(),
    });

    setNewCouponCode('');
    setNewCouponDesc('');
    setFeedbackMsg({
      type: 'success',
      text: `Cupom "${cleanCode}" criado e salvo na nuvem com sucesso!`,
    });
  };

  // Unifica contas de belladoor_prod/users + perfis de professionals_directory
  const unifiedUsers: UnifiedAdminUser[] = (() => {
    const map = new Map<string, UnifiedAdminUser>();

    // 1. Contas registradas em belladoor_prod/users
    Object.entries(cloudAccounts || {}).forEach(([emailKey, acc]) => {
      if (!acc || typeof acc !== 'object') return;
      const email = (acc.email || emailKey || '').trim().toLowerCase();
      if (!email) return;
      const proKey = email.replace(/[^a-z0-9]/g, '_');
      const dirPro = directoryPros[proKey];

      const endMs = acc.trialEndsAt ? new Date(acc.trialEndsAt).getTime() : NaN;
      const computedDays = !Number.isNaN(endMs)
        ? Math.max(0, Math.ceil((endMs - Date.now()) / (1000 * 60 * 60 * 24)))
        : typeof acc.trialDaysLeft === 'number'
        ? acc.trialDaysLeft
        : 7;

      map.set(email, {
        key: email,
        id: acc.id || `usr-${proKey}`,
        email,
        fullName: acc.fullName || dirPro?.name || email.split('@')[0],
        birthDate: acc.birthDate || '',
        role: acc.role === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'CLIENT',
        emailVerified: acc.emailVerified !== false,
        avatarUrl: dirPro?.avatarUrl || acc.avatarUrl,
        whatsapp: dirPro?.whatsapp || acc.whatsapp || '',
        title: dirPro?.title || acc.title || '',
        baseCity: dirPro?.baseCity || acc.baseCity || '',
        baseNeighborhood: dirPro?.baseNeighborhood || acc.baseNeighborhood || '',
        subscriptionStatus: acc.subscriptionStatus || 'TRIAL',
        trialDaysLeft: computedDays,
        proKey,
        inDirectory: Boolean(dirPro && dirPro.name),
        updatedAt: acc.updatedAt || acc.createdAt,
        paymentMethod: acc.paymentMethod,
        appliedCoupon: acc.appliedCoupon,
        isVerified: Boolean(dirPro?.isVerified ?? acc.isVerified),
        verificationStatus:
          dirPro?.verificationStatus ||
          acc.verificationStatus ||
          ((dirPro?.isVerified ?? acc.isVerified) ? 'VERIFIED' : (dirPro?.verificationDocUrl ?? acc.verificationDocUrl) ? 'PENDING' : 'UNVERIFIED'),
        verificationDocUrl: dirPro?.verificationDocUrl || acc.verificationDocUrl,
        verificationDocType: dirPro?.verificationDocType || acc.verificationDocType || 'RG',
        verifiedAt: dirPro?.verifiedAt || acc.verifiedAt,
        verificationNotes: dirPro?.verificationNotes || acc.verificationNotes,
      });
    });

    // 2. Profissionais na vitrine que eventualmente ainda não estejam em cloudAccounts
    Object.entries(directoryPros || {}).forEach(([proKey, dirPro]) => {
      if (!dirPro || !dirPro.name || !dirPro.name.trim()) return;
      // Verifica se já foi mapeado por proKey
      const existingEntry = Array.from(map.values()).find(
        (u) => u.proKey === proKey || `pro-${u.proKey}` === dirPro.id
      );
      if (existingEntry) return;

      const inferredEmail =
        (dirPro as any).email ||
        (proKey.endsWith('_gmail_com')
          ? proKey.replace(/_gmail_com$/, '@gmail.com')
          : `${proKey}@belladoor.app`);

      map.set(inferredEmail, {
        key: inferredEmail,
        id: dirPro.id || `pro-${proKey}`,
        email: inferredEmail,
        fullName: dirPro.name,
        birthDate: '',
        role: 'PROFESSIONAL',
        emailVerified: true,
        avatarUrl: dirPro.avatarUrl,
        whatsapp: dirPro.whatsapp || '',
        title: dirPro.title || '',
        baseCity: dirPro.baseCity || '',
        baseNeighborhood: dirPro.baseNeighborhood || '',
        subscriptionStatus: 'TRIAL',
        trialDaysLeft: 7,
        proKey,
        inDirectory: true,
        isVerified: Boolean(dirPro.isVerified),
        verificationStatus:
          dirPro.verificationStatus ||
          (dirPro.isVerified ? 'VERIFIED' : dirPro.verificationDocUrl ? 'PENDING' : 'UNVERIFIED'),
        verificationDocUrl: dirPro.verificationDocUrl,
        verificationDocType: dirPro.verificationDocType || 'RG',
        verifiedAt: dirPro.verifiedAt,
        verificationNotes: dirPro.verificationNotes,
      });
    });

    return Array.from(map.values()).sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'));
  })();

  const getProCommercialState = (
    u: UnifiedAdminUser
  ): 'ACTIVE_PRO' | 'TRIAL_PRO' | 'EXPIRED_PRO' => {
    if (u.subscriptionStatus === 'ACTIVE' && (u.trialDaysLeft ?? 30) > 0) {
      return 'ACTIVE_PRO';
    }
    if ((u.trialDaysLeft ?? 0) > 0) {
      return 'TRIAL_PRO';
    }
    return 'EXPIRED_PRO';
  };

  const allPros = unifiedUsers.filter((u) => u.role === 'PROFESSIONAL');
  const activeProsCount = allPros.filter((u) => getProCommercialState(u) === 'ACTIVE_PRO').length;
  const trialProsCount = allPros.filter((u) => getProCommercialState(u) === 'TRIAL_PRO').length;
  const expiredProsCount = allPros.filter((u) => getProCommercialState(u) === 'EXPIRED_PRO').length;

  const filteredUsers = unifiedUsers.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesProStatus =
      proStatusFilter === 'ALL' ||
      (u.role === 'PROFESSIONAL' && getProCommercialState(u) === proStatusFilter);
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.whatsapp || '').toLowerCase().includes(q) ||
      (u.baseCity || '').toLowerCase().includes(q) ||
      (u.title || '').toLowerCase().includes(q);
    return matchesRole && matchesProStatus && matchesSearch;
  });

  const totalCount = unifiedUsers.length;
  const clientsCount = unifiedUsers.filter((u) => u.role === 'CLIENT').length;
  const prosCount = allPros.length;

  const buildCommercialWhatsAppUrl = (u: UnifiedAdminUser) => {
    const cleanPhone = (u.whatsapp || '').replace(/\D/g, '');
    const phoneTarget = cleanPhone
      ? cleanPhone.startsWith('55')
        ? cleanPhone
        : `55${cleanPhone}`
      : '';
    const firstName = (u.fullName || 'Profissional').trim().split(/\s+/)[0];
    const state = getProCommercialState(u);

    let msg = '';
    if (state === 'EXPIRED_PRO') {
      msg =
        `Olá, ${firstName}! Tudo bem? Aqui é o Everton, fundador da plataforma *BellaDoor* ✨\n\n` +
        `Vi que o seu período de teste grátis de 7 dias encerrou e sua vitrine online está temporariamente pausada.\n\n` +
        `Gostaria de te ajudar a ativar seu Plano Profissional (ou liberar uma condição especial) para você voltar a divulgar seu link e receber agendamentos hoje mesmo! Como posso te ajudar? 😊`;
    } else if (state === 'TRIAL_PRO') {
      msg =
        `Olá, ${firstName}! Tudo bem? Aqui é o Everton, fundador da plataforma *BellaDoor* ✨\n\n` +
        `Passando para te dar as boas-vindas nos seus *7 Dias Grátis* (você ainda tem *${u.trialDaysLeft ?? 7} dia(s)* disponíveis) e saber se conseguiu configurar sua vitrine e serviços direitinho ou se precisa de alguma ajuda! 😊`;
    } else {
      msg =
        `Olá, ${firstName}! Tudo bem? Aqui é o Everton, da plataforma *BellaDoor* ✨\n\n` +
        `Passando para agradecer a parceria com seu Plano Profissional ativo e saber como estão seus agendamentos pela vitrine! Qualquer dúvida, conte comigo! 🙌`;
    }

    return phoneTarget
      ? `https://wa.me/${phoneTarget}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const handleQuickGrantDays = async (u: UnifiedAdminUser, days: number = 7) => {
    setSaving(true);
    setFeedbackMsg(null);
    try {
      const nextDays = Math.max(days, (u.trialDaysLeft || 0) + days);
      const res = await onSaveUser(u.email, {
        ...u,
        subscriptionStatus: 'TRIAL',
        trialDaysLeft: nextDays,
      });
      if (res.ok) {
        setFeedbackMsg({
          type: 'success',
          text: `🎁 Liberados +${days} dias para "${u.fullName}" (Total agora: ${nextDays} dias livres)!`,
        });
      } else {
        setFeedbackMsg({
          type: 'error',
          text: res.error || 'Não foi possível liberar dias extras.',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleQuickGrantSevenDays = async (u: UnifiedAdminUser) => {
    return handleQuickGrantDays(u, 7);
  };

  const handleToggleVerification = async (u: UnifiedAdminUser, approve: boolean) => {
    setSaving(true);
    setFeedbackMsg(null);
    try {
      const updated: UnifiedAdminUser = {
        ...u,
        isVerified: approve,
        verificationStatus: approve ? 'VERIFIED' : 'UNVERIFIED',
        verifiedAt: approve ? new Date().toISOString() : undefined,
      };
      const res = await onSaveUser(u.email, updated);
      if (res.ok) {
        setFeedbackMsg({
          type: 'success',
          text: approve
            ? `Selo de Identidade Verificada 🛡️ concedido a "${u.fullName}" com sucesso!`
            : `Selo de Verificação removido de "${u.fullName}".`,
        });
        if (inspectingDocUser && inspectingDocUser.email === u.email) {
          setInspectingDocUser({ ...inspectingDocUser, ...updated });
        }
      } else {
        setFeedbackMsg({
          type: 'error',
          text: res.error || 'Erro ao atualizar verificação.',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const formatBirthDateMask = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handleOpenEdit = (user: UnifiedAdminUser) => {
    setFeedbackMsg(null);
    setIsCreatingNew(false);
    setOriginalEditEmail(user.email);
    setEditingUser({ ...user });
  };

  const handleOpenCreate = () => {
    setFeedbackMsg(null);
    setIsCreatingNew(true);
    setOriginalEditEmail('');
    setEditingUser({
      key: '',
      id: `usr_${Date.now()}`,
      email: '',
      fullName: '',
      birthDate: '',
      role: 'CLIENT',
      emailVerified: true,
      whatsapp: '',
      title: 'Especialista em Beleza a Domicílio',
      baseCity: '',
      baseNeighborhood: '',
      subscriptionStatus: 'TRIAL',
      trialDaysLeft: 7,
    });
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editingUser.fullName.trim() || !editingUser.email.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Nome completo e e-mail são obrigatórios.' });
      return;
    }

    setSaving(true);
    setFeedbackMsg(null);
    try {
      const res = await onSaveUser(
        isCreatingNew ? editingUser.email : originalEditEmail,
        editingUser
      );
      if (res.ok) {
        setFeedbackMsg({
          type: 'success',
          text: isCreatingNew
            ? `Cadastro de "${editingUser.fullName}" criado com sucesso!`
            : `Cadastro de "${editingUser.fullName}" atualizado com sucesso!`,
        });
        setEditingUser(null);
        setIsCreatingNew(false);
      } else {
        setFeedbackMsg({
          type: 'error',
          text: res.error || 'Não foi possível salvar as alterações.',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setSaving(true);
    setFeedbackMsg(null);
    try {
      const res = await onDeleteUser(deletingUser);
      if (res.ok) {
        setFeedbackMsg({
          type: 'success',
          text: `O cadastro de "${deletingUser.fullName}" (${deletingUser.email}) foi excluído permanentemente.`,
        });
        setDeletingUser(null);
      } else {
        setFeedbackMsg({
          type: 'error',
          text: res.error || 'Erro ao excluir cadastro.',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const proUsersList = unifiedUsers.filter((u) => u.role === 'PROFESSIONAL');
  const verifiedProsCount = proUsersList.filter((u) => u.isVerified).length;
  const pendingVerificationsCount = proUsersList.filter(
    (u) => !u.isVerified && (u.verificationStatus === 'PENDING' || Boolean(u.verificationDocUrl))
  ).length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Cabeçalho do Painel Admin */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-rose-950 text-white rounded-3xl p-5 sm:p-6 shadow-lg border border-stone-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-600/20 border border-rose-400/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30">
                  Acesso Master Exclusivo
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold mt-0.5">
                Painel de Administração BellaDoor
              </h1>
              <p className="text-[11px] text-stone-300">
                Logado como <strong>{currentUserEmail}</strong> • Usuários, Selos, Cupons e Mercado Pago
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseAdmin}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-white/15"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao App
          </button>
        </div>

        {/* Resumo Rápido */}
        <div className="grid grid-cols-4 gap-2.5 mt-5">
          <div className="bg-white/10 border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-xl sm:text-2xl font-extrabold block">{totalCount}</span>
            <span className="text-[10px] text-stone-300 uppercase tracking-wider font-semibold">
              Total de Contas
            </span>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-xl sm:text-2xl font-extrabold text-rose-300 block">
              {clientsCount}
            </span>
            <span className="text-[10px] text-stone-300 uppercase tracking-wider font-semibold">
              💅 Clientes
            </span>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-300 block">
              {prosCount}
            </span>
            <span className="text-[10px] text-stone-300 uppercase tracking-wider font-semibold">
              💄 Profissionais
            </span>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-xl sm:text-2xl font-extrabold text-amber-300 block">
              {verifiedProsCount}
            </span>
            <span className="text-[10px] text-stone-300 uppercase tracking-wider font-semibold flex items-center justify-center gap-1">
              🛡️ Selos Ativos
            </span>
          </div>
        </div>

        {/* Seletor de Módulos do Painel Admin */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 pt-4 border-t border-white/15">
          <button
            type="button"
            onClick={() => {
              setAdminSection('DASHBOARD');
              setFeedbackMsg(null);
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              adminSection === 'DASHBOARD'
                ? 'bg-amber-400 text-stone-950 shadow-md ring-2 ring-amber-300/40'
                : 'bg-white/10 hover:bg-white/20 text-stone-200 border border-white/10'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Cockpit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAdminSection('USERS');
              setFeedbackMsg(null);
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              adminSection === 'USERS'
                ? 'bg-amber-400 text-stone-950 shadow-md ring-2 ring-amber-300/40'
                : 'bg-white/10 hover:bg-white/20 text-stone-200 border border-white/10'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Usuários ({totalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAdminSection('VERIFICATIONS');
              setFeedbackMsg(null);
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer relative ${
              adminSection === 'VERIFICATIONS'
                ? 'bg-amber-400 text-stone-950 shadow-md ring-2 ring-amber-300/40'
                : 'bg-white/10 hover:bg-white/20 text-stone-200 border border-white/10'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Selos & Docs</span>
            {pendingVerificationsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-black rounded-full animate-pulse ml-0.5">
                {pendingVerificationsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setAdminSection('COUPONS');
              setFeedbackMsg(null);
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              adminSection === 'COUPONS'
                ? 'bg-amber-400 text-stone-950 shadow-md ring-2 ring-amber-300/40'
                : 'bg-white/10 hover:bg-white/20 text-stone-200 border border-white/10'
            }`}
          >
            <Ticket className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Cupons ({coupons.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAdminSection('MERCADO_PAGO');
              setFeedbackMsg(null);
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              adminSection === 'MERCADO_PAGO'
                ? 'bg-amber-400 text-stone-950 shadow-md ring-2 ring-amber-300/40'
                : 'bg-white/10 hover:bg-white/20 text-stone-200 border border-white/10'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Mercado Pago</span>
          </button>
        </div>
      </div>

      {/* Feedback de Ação */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MÓDULO 0: COCKPIT GERENCIAL, FATURAMENTO & DESEMPENHO (EVERTON)      */}
      {/* ==================================================================== */}
      {adminSection === 'DASHBOARD' && (
        <AdminDashboardTab
          unifiedUsers={unifiedUsers}
          allAppointments={allAppointments}
          betaFeedbacks={betaFeedbacks}
          onQuickGrantDays={handleQuickGrantDays}
          onOpenWhatsApp={(u) => window.open(buildCommercialWhatsAppUrl(u), '_blank')}
        />
      )}

      {/* ==================================================================== */}
      {/* OPÇÃO 1: GESTÃO DE CADASTROS DE USUÁRIOS (CLIENTES E PROFISSIONAIS)   */}
      {/* ==================================================================== */}
      {adminSection === 'USERS' && (
        <>
          {/* TERMÔMETRO COMERCIAL DE ASSINATURAS (FUNIL DE PROFISSIONAIS) */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                📊 Termômetro Comercial de Profissionais
              </span>
              {proStatusFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => {
                    setProStatusFilter('ALL');
                    setRoleFilter('ALL');
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Limpar filtro comercial ✕
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRoleFilter('PROFESSIONAL');
                  setProStatusFilter(proStatusFilter === 'ACTIVE_PRO' ? 'ALL' : 'ACTIVE_PRO');
                }}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  proStatusFilter === 'ACTIVE_PRO'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200 text-emerald-950'
                }`}
              >
                <span className="text-lg sm:text-xl font-extrabold block">{activeProsCount}</span>
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                    proStatusFilter === 'ACTIVE_PRO' ? 'text-emerald-100' : 'text-emerald-800'
                  }`}
                >
                  ⭐ Ativos / Pagos
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRoleFilter('PROFESSIONAL');
                  setProStatusFilter(proStatusFilter === 'TRIAL_PRO' ? 'ALL' : 'TRIAL_PRO');
                }}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  proStatusFilter === 'TRIAL_PRO'
                    ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-sm'
                    : 'bg-amber-50/80 hover:bg-amber-100/70 border-amber-200 text-amber-950'
                }`}
              >
                <span className="text-lg sm:text-xl font-extrabold block">{trialProsCount}</span>
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                    proStatusFilter === 'TRIAL_PRO' ? 'text-stone-900' : 'text-amber-800'
                  }`}
                >
                  🎁 Em Teste (7d)
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRoleFilter('PROFESSIONAL');
                  setProStatusFilter(proStatusFilter === 'EXPIRED_PRO' ? 'ALL' : 'EXPIRED_PRO');
                }}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  proStatusFilter === 'EXPIRED_PRO'
                    ? 'bg-red-600 text-white border-red-700 shadow-sm'
                    : 'bg-red-50/80 hover:bg-red-100/70 border-red-200 text-red-950'
                }`}
              >
                <span className="text-lg sm:text-xl font-extrabold block">{expiredProsCount}</span>
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                    proStatusFilter === 'EXPIRED_PRO' ? 'text-red-100' : 'text-red-800'
                  }`}
                >
                  🔒 Expirados
                </span>
              </button>
            </div>
          </div>

          {/* Barra de Busca, Filtros e Novo Cadastro */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, e-mail, WhatsApp ou cidade..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Novo Cadastro
              </button>
            </div>

            {/* Abas de Filtro */}
            <div className="flex gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setRoleFilter('ALL');
                  setProStatusFilter('ALL');
                }}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  roleFilter === 'ALL' && proStatusFilter === 'ALL'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Todos ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoleFilter('CLIENT');
                  setProStatusFilter('ALL');
                }}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  roleFilter === 'CLIENT'
                    ? 'bg-white text-rose-700 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                💅 Clientes ({clientsCount})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('PROFESSIONAL')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  roleFilter === 'PROFESSIONAL'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                💄 Profissionais ({prosCount})
              </button>
            </div>
          </div>

          {/* Lista de Usuários */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 space-y-2">
                <User className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-sm font-bold text-stone-800">Nenhum cadastro encontrado</p>
                <p className="text-xs text-stone-500">
                  Altere os termos da busca ou o filtro selecionado acima.
                </p>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelfAdmin = u.email.toLowerCase() === 'evertonrcsilva@gmail.com';
                const proState = u.role === 'PROFESSIONAL' ? getProCommercialState(u) : null;
                return (
                  <div
                    key={u.key}
                    className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-xs transition space-y-3 ${
                      proState === 'EXPIRED_PRO'
                        ? 'border-red-300 bg-red-50/20'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 font-extrabold flex items-center justify-center text-sm overflow-hidden shrink-0">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.fullName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (u.fullName || u.email || 'U').charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="font-extrabold text-sm text-stone-900 truncate">
                              {u.fullName}
                            </h3>
                            {isSelfAdmin && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-stone-900 text-amber-300">
                                👑 Admin
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                u.role === 'PROFESSIONAL'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {u.role === 'PROFESSIONAL' ? '💄 Profissional' : '💅 Cliente'}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.emailVerified
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {u.emailVerified ? '✓ E-mail Validado' : '⏳ E-mail Pendente'}
                            </span>
                          </div>

                          <p className="text-xs text-stone-600 flex items-center gap-1 mt-1 break-all">
                            <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>{u.email}</span>
                          </p>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-stone-500">
                            {u.birthDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-stone-400" />
                                Nasc: {u.birthDate}
                              </span>
                            )}
                            {u.whatsapp && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-stone-400" />
                                {u.whatsapp}
                              </span>
                            )}
                            {(u.baseCity || u.baseNeighborhood) && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-stone-400" />
                                {[u.baseNeighborhood, u.baseCity].filter(Boolean).join(' • ')}
                              </span>
                            )}
                          </div>

                          {u.role === 'PROFESSIONAL' && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {u.title && (
                                <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-lg font-medium">
                                  {u.title}
                                </span>
                              )}
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-lg font-extrabold ${
                                  proState === 'ACTIVE_PRO'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : proState === 'EXPIRED_PRO'
                                    ? 'bg-red-100 text-red-800 border border-red-300'
                                    : (u.trialDaysLeft ?? 7) <= 2
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {proState === 'ACTIVE_PRO'
                                  ? `⭐ Plano Pro Ativo (${u.trialDaysLeft ?? 30}d)`
                                  : proState === 'EXPIRED_PRO'
                                  ? '🔒 Teste Expirado (Bloqueado)'
                                  : `🎁 Em Teste (${u.trialDaysLeft ?? 7}d restantes)`}
                              </span>
                              {u.inDirectory && proState !== 'EXPIRED_PRO' && (
                                <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-lg font-semibold">
                                  Visível na Vitrine
                                </span>
                              )}
                              {proState === 'EXPIRED_PRO' && (
                                <span className="text-[10px] bg-stone-100 text-stone-600 border border-stone-200 px-2 py-0.5 rounded-lg font-semibold">
                                  Vitrine Pausada
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação Comercial + Editar e Excluir */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {u.role === 'PROFESSIONAL' && (
                          <a
                            href={buildCommercialWhatsAppUrl(u)}
                            target="_blank"
                            rel="noreferrer"
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 transition shadow-2xs ${
                              proState === 'EXPIRED_PRO'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                            title="Abrir conversa no WhatsApp com mensagem comercial pronta"
                          >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                            {proState === 'EXPIRED_PRO'
                              ? 'Converter no WhatsApp'
                              : 'WhatsApp Comercial'}
                          </a>
                        )}

                        {u.role === 'PROFESSIONAL' && proState !== 'ACTIVE_PRO' && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleQuickGrantSevenDays(u)}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Conceder mais 7 dias de teste grátis imediatamente"
                          >
                            <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                            +7 Dias Grátis
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-stone-600" />
                          Editar Cadastro
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingUser(u)}
                          className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ==================================================================== */}
      {/* SEÇÃO: VERIFICAÇÃO DE IDENTIDADE & SELOS DE CONFIANÇA               */}
      {/* ==================================================================== */}
      {adminSection === 'VERIFICATIONS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Card de Apresentação e Métricas */}
          <div className="bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-900 text-white rounded-3xl p-5 sm:p-6 border border-emerald-800/40 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    Segurança &amp; Confiança no Domicílio
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-1">
                    Gestão de Selos de Identidade &amp; Documentos
                  </h3>
                  <p className="text-xs text-stone-300">
                    Analise os documentos enviados (RG/CNH), valide as profissionais e conceda o selo de confiança para a vitrine pública.
                  </p>
                </div>
              </div>
            </div>

            {/* Métricas dos Selos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-emerald-300 block">
                    {verifiedProsCount}
                  </span>
                  <span className="text-[11px] text-stone-300 font-bold uppercase tracking-wide">
                    Selo Ativo na Vitrine
                  </span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-amber-300 block">
                    {pendingVerificationsCount}
                  </span>
                  <span className="text-[11px] text-stone-300 font-bold uppercase tracking-wide">
                    Aguardando Análise
                  </span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-stone-500/20 border border-stone-400/30 flex items-center justify-center text-stone-300 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black text-stone-200 block">
                    {proUsersList.length - verifiedProsCount}
                  </span>
                  <span className="text-[11px] text-stone-300 font-bold uppercase tracking-wide">
                    Sem Selo (Podem Conquistar)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros da Seção de Selos */}
          <div className="bg-white rounded-2xl p-3 border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-stone-500 font-bold text-[11px] mr-1">Filtrar por:</span>
              <button
                type="button"
                onClick={() => setVerificationFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer border ${
                  verificationFilter === 'ALL'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                Todas ({proUsersList.length})
              </button>

              <button
                type="button"
                onClick={() => setVerificationFilter('PENDING')}
                className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer border flex items-center gap-1 ${
                  verificationFilter === 'PENDING'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Pendentes de Análise ({pendingVerificationsCount})
              </button>

              <button
                type="button"
                onClick={() => setVerificationFilter('VERIFIED')}
                className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer border flex items-center gap-1 ${
                  verificationFilter === 'VERIFIED'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Com Selo Ativo ({verifiedProsCount})
              </button>

              <button
                type="button"
                onClick={() => setVerificationFilter('UNVERIFIED')}
                className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer border ${
                  verificationFilter === 'UNVERIFIED'
                    ? 'bg-stone-700 text-white border-stone-800 shadow-xs'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                Sem Selo ({proUsersList.length - verifiedProsCount})
              </button>
            </div>

            {/* Busca Rápida */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome ou whats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Lista de Profissionais e seus Documentos */}
          <div className="space-y-3">
            {(() => {
              const term = searchTerm.trim().toLowerCase();
              const list = proUsersList.filter((u) => {
                if (term) {
                  const match =
                    u.fullName.toLowerCase().includes(term) ||
                    u.email.toLowerCase().includes(term) ||
                    (u.whatsapp && u.whatsapp.includes(term));
                  if (!match) return false;
                }
                if (verificationFilter === 'PENDING') {
                  return !u.isVerified && (u.verificationStatus === 'PENDING' || Boolean(u.verificationDocUrl));
                }
                if (verificationFilter === 'VERIFIED') {
                  return u.isVerified;
                }
                if (verificationFilter === 'UNVERIFIED') {
                  return !u.isVerified && !u.verificationDocUrl && u.verificationStatus !== 'PENDING';
                }
                return true;
              });

              if (list.length === 0) {
                return (
                  <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 shadow-2xs space-y-2">
                    <ShieldCheck className="w-10 h-10 text-stone-300 mx-auto" />
                    <h4 className="text-sm font-bold text-stone-800">
                      Nenhuma profissional encontrada nesta categoria
                    </h4>
                    <p className="text-xs text-stone-500">
                      Altere o filtro acima para visualizar outros cadastros.
                    </p>
                  </div>
                );
              }

              return list.map((u) => {
                const cleanPhone = (u.whatsapp || '').replace(/\D/g, '');
                const waMessage = u.isVerified
                  ? `Olá ${u.fullName}! Passando para avisar que seu Selo de Identidade Verificada 🛡️ está ATIVO na sua vitrine do BellaDoor. Boas vendas!`
                  : u.verificationDocUrl
                  ? `Olá ${u.fullName}, tudo bem? Sou o Everton da equipe BellaDoor. Vi seu envio de documento (${u.verificationDocType || 'RG/CNH'}) para o Selo de Identidade Verificada...`
                  : `Olá ${u.fullName}! Sou o Everton do BellaDoor. Gostaria de te convidar para ativar o Selo de Identidade Verificada 🛡️ na sua vitrine sem custo, para passar mais segurança às suas clientes de atendimento a domicílio!`;

                const waUrl = cleanPhone
                  ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(waMessage)}`
                  : null;

                const hasDoc = Boolean(u.verificationDocUrl);

                return (
                  <div
                    key={u.key}
                    className={`bg-white rounded-3xl p-4 sm:p-5 border transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      u.isVerified
                        ? 'border-emerald-300 bg-gradient-to-r from-emerald-50/20 via-white to-white'
                        : hasDoc
                        ? 'border-amber-300 bg-gradient-to-r from-amber-50/20 via-white to-white ring-1 ring-amber-200'
                        : 'border-stone-200'
                    }`}
                  >
                    {/* Dados da Profissional */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.fullName}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-stone-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-stone-100 border-2 border-stone-200 flex items-center justify-center font-bold text-stone-600">
                            {u.fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        {u.isVerified && (
                          <span
                            className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-600 text-white rounded-full border-2 border-white"
                            title="Selo Verificado Ativo"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-extrabold text-stone-900 truncate">
                            {u.fullName}
                          </h4>
                          {u.isVerified ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Selo Ativo
                            </span>
                          ) : hasDoc ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Documento Aguardando Aprovação
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                              Sem Selo
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-stone-600 mt-0.5">
                          {u.title || 'Especialista em Beleza a Domicílio'}
                          {u.baseCity ? ` • ${u.baseCity}` : ''}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 font-mono">
                            <Mail className="w-3 h-3 text-stone-400" />
                            {u.email}
                          </span>
                          {u.whatsapp && (
                            <span className="flex items-center gap-1 font-bold text-stone-700">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              {u.whatsapp}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bloco Central: Documento Anexado */}
                    <div className="md:px-4 md:border-x md:border-stone-200/80 shrink-0 flex items-center gap-3">
                      {hasDoc ? (
                        <div className="flex items-center gap-2.5 bg-stone-50 border border-stone-200 p-2 rounded-2xl">
                          <button
                            type="button"
                            onClick={() => setInspectingDocUser(u)}
                            className="relative group cursor-pointer"
                            title="Clique para ampliar o documento"
                          >
                            <img
                              src={u.verificationDocUrl}
                              alt="Documento"
                              className="w-14 h-11 object-cover rounded-xl border border-stone-300 group-hover:opacity-90 transition"
                            />
                            <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </button>
                          <div className="text-left">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 block">
                              {u.verificationDocType || 'Documento'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setInspectingDocUser(u)}
                              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                            >
                              Ver Documento
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-stone-400 italic py-1">
                          Nenhum documento anexado
                        </div>
                      )}
                    </div>

                    {/* Ações do Administrador */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {!u.isVerified ? (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleToggleVerification(u, true)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Aprovar Selo 🛡️
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleToggleVerification(u, false)}
                          className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold border border-stone-300 transition cursor-pointer disabled:opacity-50"
                        >
                          Remover Selo
                        </button>
                      )}

                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1 transition"
                          title="Falar com a profissional no WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          WhatsApp
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
                        title="Editar cadastro completo"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* OPÇÃO 2: GESTÃO DE CUPONS DE PARCERIA E DESCONTO                     */}
      {/* ==================================================================== */}
      {adminSection === 'COUPONS' && (
        <div className="bg-stone-900 text-white rounded-3xl p-5 space-y-5 border border-stone-700 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                Gestão de Cupons • Admin
              </span>
              <h4 className="text-sm font-extrabold text-white mt-1">
                Gerador de Cupons de Parceria e Acesso Gratuito
              </h4>
              <p className="text-[11px] text-stone-400">
                Crie cupons de 15, 30, 60, 90, 180 dias ou 1 ano livre para enviar às profissionais parceiras.
              </p>
            </div>
          </div>

          {/* 1. Criar Novo Cupom */}
          <form
            onSubmit={handleAddCouponSubmit}
            className="bg-stone-800/80 p-4 rounded-2xl border border-stone-700 space-y-3"
          >
            <h5 className="text-xs font-extrabold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Criar Novo Cupom de Acesso Gratuito
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-stone-300 mb-1">
                  Código do Cupom (Ex: CAMILA1ANO, DIVULGA30):
                </label>
                <input
                  type="text"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  placeholder="Ex: PARCEIRA2026"
                  className="w-full bg-stone-900 border border-stone-600 rounded-xl px-3 py-2 text-xs font-extrabold uppercase text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-300 mb-1">
                  Tempo de Acesso Livre Concedido:
                </label>
                <select
                  value={newCouponDays}
                  onChange={(e) => setNewCouponDays(Number(e.target.value))}
                  className="w-full bg-stone-900 border border-stone-600 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-rose-500"
                >
                  <option value={15}>+15 Dias Livres</option>
                  <option value={30}>30 Dias Livres (1 Mês)</option>
                  <option value={60}>60 Dias Livres (2 Meses)</option>
                  <option value={90}>90 Dias Livres (3 Meses)</option>
                  <option value={180}>180 Dias Livres (6 Meses)</option>
                  <option value={365}>1 Ano Livre (365 Dias)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newCouponDesc}
                onChange={(e) => setNewCouponDesc(e.target.value)}
                placeholder="Observação opcional (Ex: Parceria Instagram Brasília)"
                className="flex-1 bg-stone-900 border border-stone-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0"
              >
                + Salvar Cupom
              </button>
            </div>
          </form>

          {/* 2. Lista de Cupons Ativos */}
          <div className="space-y-2">
            <h5 className="text-xs font-extrabold text-stone-300 uppercase tracking-wider">
              Cupons Disponíveis para Enviar às Profissionais ({coupons.length})
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {coupons.map((c) => (
                <div
                  key={c.code}
                  className="bg-stone-800/60 border border-stone-700 rounded-xl p-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-extrabold text-xs text-amber-300 bg-amber-500/10 border border-amber-400/30 px-2 py-0.5 rounded-md">
                        {c.code}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400">
                        {c.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400 truncate mt-1">{c.description}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(c.code);
                        onShowUiDialog({
                          emoji: '🎟️',
                          badge: 'Cupom Copiado',
                          title: `Cupom ${c.code} Copiado!`,
                          message: `Envie este código para a profissional parceira. Ao aplicar na aba Plano, ela receberá ${c.label} automaticamente.`,
                          highlight: `${c.code} • ${c.label}`,
                          buttonText: 'Perfeito',
                          variant: 'success',
                        });
                      }}
                      title="Copiar código do cupom"
                      className="p-1.5 bg-stone-700 hover:bg-stone-600 text-white rounded-lg transition cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCoupon(c.code)}
                      title="Remover cupom"
                      className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* OPÇÃO 3: CONFIGURAÇÃO OFICIAL DO MERCADO PAGO                        */}
      {/* ==================================================================== */}
      {adminSection === 'MERCADO_PAGO' && (
        <div className="bg-stone-900 text-white rounded-3xl p-5 space-y-5 border border-stone-700 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3 flex-wrap gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-0.5 rounded-full">
                Pagamentos & Assinaturas • Admin
              </span>
              <h4 className="text-sm font-extrabold text-white mt-1">
                Integração Oficial com sua Conta Mercado Pago
              </h4>
              <p className="text-[11px] text-stone-400">
                Configure o Access Token de Produção, Chave PIX e modo de teste da plataforma.
              </p>
            </div>

            <button
              type="button"
              onClick={onToggleSimulationStatus}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-400/30 text-[11px] font-bold cursor-pointer transition"
            >
              {subscriptionStatus === 'ACTIVE'
                ? '🔄 Voltar Minha Conta p/ Trial 7 Dias'
                : '⚡ Simular Minha Conta Ativa'}
            </button>
          </div>

          <div className="bg-stone-800/80 p-4 rounded-2xl border border-stone-700 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h5 className="text-xs font-extrabold text-sky-300 uppercase tracking-wider">
                Credenciais e Recebimento Mercado Pago
              </h5>
              <a
                href="https://www.mercadopago.com.br/developers/panel/app"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-bold text-sky-400 hover:underline inline-flex items-center gap-1"
              >
                Pegar meu Access Token no Mercado Pago <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-sky-950/50 border border-sky-500/30 rounded-xl p-3 text-[11px] text-sky-200 space-y-1">
              <p className="font-bold text-white">
                💡 Como funciona a confirmação automática dos 3 modos (com seu Access Token):
              </p>
              <p>
                Ao colar seu <strong>Access Token de Produção (APP_USR-...)</strong> abaixo, o BellaDoor cria e confirma todas as cobranças sozinho via API do Mercado Pago:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-sky-100">
                <li>
                  <strong>1. Cartão Recorrente Mensal (R$ 39,90/mês):</strong> cria a assinatura automática mensal vinculada ao e-mail da profissional e verifica todo mês se o pagamento está ativo (<code>authorized</code>).
                </li>
                <li>
                  <strong>2. PIX Mensal (R$ 44,90) e PIX Anual (R$ 299,00):</strong> gera o QR Code oficial na sua conta Mercado Pago e verifica a cada 5 segundos se o PIX foi pago (<code>approved</code>) para liberar 30 ou 365 dias na hora.
                </li>
                <li>
                  <strong>3. Cartão Plano Anual — Pagamento Único (R$ 299,00):</strong> gera o checkout de pagamento único de R$ 299,00 no cartão e confirma automaticamente assim que o pagamento é aprovado (<code>approved</code>), liberando 365 dias.
                </li>
              </ul>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-300 mb-1">
                1️⃣ Access Token de Produção do Mercado Pago (Começa com APP_USR-... • Obrigatório para confirmação automática):
              </label>
              <input
                type="password"
                value={accessTokenInput}
                onChange={(e) => setAccessTokenInput(e.target.value)}
                placeholder="APP_USR-0000000000000000-000000-..."
                className="w-full bg-stone-900 border border-stone-600 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-stone-300 mb-1">
                  2️⃣ Sua Chave PIX cadastrada no Mercado Pago (CPF, CNPJ, E-mail, Celular ou Aleatória):
                </label>
                <input
                  type="text"
                  value={pixKeyInput}
                  onChange={(e) => setPixKeyInput(e.target.value)}
                  placeholder="Ex: seu-email@mercadopago.com ou CNPJ"
                  className="w-full bg-stone-900 border border-stone-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-300 mb-1">
                  Nome do Recebedor no PIX:
                </label>
                <input
                  type="text"
                  value={merchantNameInput}
                  onChange={(e) => setMerchantNameInput(e.target.value)}
                  placeholder="BELLADOOR PLATAFORMA"
                  className="w-full bg-stone-900 border border-stone-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 mb-1">
                  Link Manual Assinatura Mensal (Deixe em branco se já preencheu o Access Token acima):
                </label>
                <input
                  type="url"
                  value={recurringUrlInput}
                  onChange={(e) => setRecurringUrlInput(e.target.value)}
                  placeholder="Gerado automaticamente pelo Access Token..."
                  className="w-full bg-stone-900 border border-stone-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-400 mb-1">
                  Link Manual Plano Anual (Deixe em branco se já preencheu o Access Token acima):
                </label>
                <input
                  type="url"
                  value={annualUrlInput}
                  onChange={(e) => setAnnualUrlInput(e.target.value)}
                  placeholder="Gerado automaticamente pelo Access Token..."
                  className="w-full bg-stone-900 border border-stone-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-emerald-300 mb-1">
                📱 WhatsApp Oficial de Suporte BellaDoor (para o botão "Falar com Suporte" na tela de Planos das profissionais):
              </label>
              <input
                type="tel"
                value={supportWhatsappInput}
                onChange={(e) => setSupportWhatsappInput(e.target.value)}
                placeholder="Ex: (61) 99999-9999 ou 5561999999999"
                className="w-full bg-stone-900 border border-stone-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onUpdateMpConfig({
                    ...mpConfig,
                    mpAccessToken: accessTokenInput.trim(),
                    pixKey: pixKeyInput.trim() || 'financeiro@belladoor.app',
                    merchantName: merchantNameInput.trim() || 'BELLADOOR PLATAFORMA',
                    recurringMonthlyCardUrl: recurringUrlInput.trim(),
                    annualCardUrl: annualUrlInput.trim(),
                    supportWhatsapp: supportWhatsappInput.trim(),
                  });
                }}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-md"
              >
                Salvar Integração Mercado Pago
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextTestMode = !Boolean(mpConfig.testModeOneReal);
                  onUpdateMpConfig({
                    ...mpConfig,
                    mpAccessToken: accessTokenInput.trim(),
                    pixKey: pixKeyInput.trim() || 'financeiro@belladoor.app',
                    merchantName: merchantNameInput.trim() || 'BELLADOOR PLATAFORMA',
                    recurringMonthlyCardUrl: recurringUrlInput.trim(),
                    annualCardUrl: annualUrlInput.trim(),
                    supportWhatsapp: supportWhatsappInput.trim(),
                    testModeOneReal: nextTestMode,
                  });
                }}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                  mpConfig.testModeOneReal
                    ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-md'
                    : 'bg-stone-900 hover:bg-stone-700 text-amber-300 border-amber-400/40'
                }`}
              >
                {mpConfig.testModeOneReal
                  ? '🧪 Modo Teste R$ 1,00 ATIVO (Clique para voltar aos preços normais)'
                  : '🧪 Ativar Modo Teste R$ 1,00 (Para testar PIX e Cartão reais)'}
              </button>

              <a
                href="https://www.mercadopago.com.br/subscriptions"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
              >
                Ver / Cancelar Assinaturas no Mercado Pago <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL DE EDIÇÃO / CRIAÇÃO DE CADASTRO (CLIENTE OU PROFISSIONAL)       */}
      {/* ==================================================================== */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">
                  {isCreatingNew ? 'Novo Registro' : 'Editar Cadastro'}
                </span>
                <h3 className="text-base font-extrabold text-stone-900">
                  {isCreatingNew ? 'Adicionar Usuário' : editingUser.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-3 text-xs">
              {/* Tipo de Perfil */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Tipo de Cadastro:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser({ ...editingUser, role: 'CLIENT' })}
                    className={`py-2.5 rounded-xl font-bold border transition cursor-pointer ${
                      editingUser.role === 'CLIENT'
                        ? 'border-rose-600 bg-rose-50 text-rose-800'
                        : 'border-stone-200 bg-stone-50 text-stone-600'
                    }`}
                  >
                    💅 Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUser({ ...editingUser, role: 'PROFESSIONAL' })}
                    className={`py-2.5 rounded-xl font-bold border transition cursor-pointer ${
                      editingUser.role === 'PROFESSIONAL'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-stone-200 bg-stone-50 text-stone-600'
                    }`}
                  >
                    💄 Profissional
                  </button>
                </div>
              </div>

              {/* Nome Completo */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* E-mail e Data de Nascimento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="DD/MM/AAAA"
                    value={editingUser.birthDate || ''}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        birthDate: formatBirthDateMask(e.target.value),
                      })
                    }
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Status de Validação do E-mail */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-stone-800">E-mail Validado / Acesso Liberado</p>
                  <p className="text-[10px] text-stone-500">
                    Desative caso queira exigir que a pessoa valide o e-mail novamente
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editingUser.emailVerified}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, emailVerified: e.target.checked })
                  }
                  className="w-4 h-4 accent-rose-600 cursor-pointer"
                />
              </div>

              {/* Redefinir Senha pelo Admin (Opcional) */}
              <div>
                <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-rose-600" />
                  {isCreatingNew
                    ? 'Definir Senha de Acesso (mínimo 6 caracteres)'
                    : 'Redefinir Senha da Conta (Deixe em branco para manter a atual)'}
                </label>
                <input
                  type="text"
                  minLength={6}
                  placeholder={
                    isCreatingNew
                      ? 'Ex: Muda1234'
                      : 'Digite uma nova senha caso o usuário tenha esquecido'
                  }
                  value={editingUser.newPasswordPlain || ''}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, newPasswordPlain: e.target.value })
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-[10px] text-stone-400 mt-0.5">
                  🔒 A senha será criptografada automaticamente em SHA-256 (LGPD) ao salvar.
                </p>
              </div>

              {/* Campos Extras quando for Profissional */}
              {editingUser.role === 'PROFESSIONAL' && (
                <div className="space-y-2.5 pt-2 border-t border-stone-200">
                  <p className="font-extrabold text-emerald-800 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Dados da Vitrine Profissional
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">WhatsApp</label>
                      <input
                        type="text"
                        placeholder="(11) 99999-9999"
                        value={editingUser.whatsapp || ''}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, whatsapp: e.target.value })
                        }
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Especialidade / Título
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Nail Designer & Make"
                        value={editingUser.title || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, title: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Cidade Base</label>
                      <input
                        type="text"
                        placeholder="Ex: Goiânia-GO"
                        value={editingUser.baseCity || ''}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, baseCity: e.target.value })
                        }
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Bairro Base</label>
                      <input
                        type="text"
                        placeholder="Ex: Setor Marista"
                        value={editingUser.baseNeighborhood || ''}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, baseNeighborhood: e.target.value })
                        }
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Status da Assinatura
                      </label>
                      <select
                        value={editingUser.subscriptionStatus || 'TRIAL'}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            subscriptionStatus: e.target.value as 'TRIAL' | 'ACTIVE',
                          })
                        }
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="TRIAL">Período Grátis / Cupom</option>
                        <option value="ACTIVE">Plano Ativo (Pago)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Dias Grátis Restantes
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={3650}
                        value={editingUser.trialDaysLeft ?? 7}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            trialDaysLeft: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  {/* Campo de Selo de Identidade Verificada */}
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5 cursor-pointer">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Selo de Identidade Verificada 🛡️
                      </label>
                      <input
                        type="checkbox"
                        checked={Boolean(editingUser.isVerified)}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            isVerified: e.target.checked,
                            verificationStatus: e.target.checked ? 'VERIFIED' : 'UNVERIFIED',
                            verifiedAt: e.target.checked ? (editingUser.verifiedAt || new Date().toISOString()) : undefined,
                          })
                        }
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-emerald-900 leading-snug">
                      {editingUser.isVerified
                        ? '🟢 Selo ATIVO na vitrine pública. As clientes visualizam o selo de confiança.'
                        : '⚪ Sem selo. Ative para exibir o selo de verificação de identidade na vitrine.'}
                    </p>
                    {editingUser.verificationDocUrl && (
                      <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-800">
                          Documento Anexado ({editingUser.verificationDocType || 'RG/CNH'})
                        </span>
                        <button
                          type="button"
                          onClick={() => setInspectingDocUser(editingUser)}
                          className="text-[10px] font-extrabold text-emerald-700 underline cursor-pointer hover:text-emerald-900"
                        >
                          Visualizar Documento
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE CADASTRO                         */}
      {/* ==================================================================== */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">
                Exclusão Permanente
              </span>
              <h3 className="text-base font-extrabold text-stone-900">
                Excluir este cadastro?
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Você está prestes a remover o cadastro de{' '}
                <strong>{deletingUser.fullName}</strong> ({deletingUser.email}).
                {deletingUser.role === 'PROFESSIONAL' &&
                  ' A vitrine desta profissional também será removida do Marketplace.'}
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={saving}
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sim, Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ==================================================================== */}
      {/* MODAL DE VISUALIZAÇÃO AMPLIADA DO DOCUMENTO (LIGHTBOX)               */}
      {/* ==================================================================== */}
      {inspectingDocUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4 my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-stone-900">
                    Documento de Identidade • {inspectingDocUser.fullName}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Tipo declarado: <strong>{inspectingDocUser.verificationDocType || 'RG / CNH'}</strong> • {inspectingDocUser.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingDocUser(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex items-center justify-center bg-stone-950 rounded-2xl p-2 min-h-[300px]">
              {inspectingDocUser.verificationDocUrl ? (
                <img
                  src={inspectingDocUser.verificationDocUrl}
                  alt={`Documento de ${inspectingDocUser.fullName}`}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-lg"
                />
              ) : (
                <div className="text-xs text-stone-400">Nenhum documento disponível para visualização.</div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-600">Status atual:</span>
                {inspectingDocUser.isVerified ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Selo Ativo
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                    Aguardando Aprovação
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingDocUser(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer"
                >
                  Fechar
                </button>
                {!inspectingDocUser.isVerified ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={async () => {
                      await handleToggleVerification(inspectingDocUser, true);
                      setInspectingDocUser(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Aprovar Selo Verificado 🛡️
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={async () => {
                      await handleToggleVerification(inspectingDocUser, false);
                      setInspectingDocUser(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    Remover Selo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
