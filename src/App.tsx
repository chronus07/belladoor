import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle,
  ShieldCheck,
  ChevronRight,
  Car,
  Sparkles,
  Phone,
  Instagram,
  Navigation,
  Check,
  ArrowLeft,
  Smartphone,
  Info,
  Search,
  Loader2,
  MessageCircle,
  AlertTriangle,
  CreditCard,
  QrCode,
  Zap,
  Award,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CalendarX,
  CalendarRange,
  Ban,
  Coffee,
  X,
  User,
  LogIn,
  LogOut,
  Gift,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Tag,
  Eye,
  Camera,
  Image,
  Upload,
  Share2,
  Copy,
  TrendingUp,
  MessageSquarePlus,
  RotateCcw,
  Palette,
  Sliders,
} from 'lucide-react';
import { mockProfessional, MockService, MockNeighborhood, mockProfessionalsList, MockProfessional } from './data/mockData';
import { BELLADOOR_PLANS } from '../lib/subscriptionService';
import {
  AuthUser,
  signInWithGoogleOAuth,
  signUpWithEmail,
  signInWithEmail,
  checkEmailVerificationStatus,
  resendVerificationEmail,
  signOutUser,
  isSupabaseConfigured
} from '../lib/supabaseClient';
import {
  isFirebaseConfigured,
  syncDocumentToFirestore,
  appendAppointmentToFirestore,
  subscribeToFirestoreDocument,
  updateUserAccountInFirestore,
  adminSaveUserInFirestore,
  adminDeleteUserFromFirestore,
  deleteOwnAccountAndDataFromFirestore,
  appendFeedbackToFirestore,
  BetaFeedbackEntry,
} from '../lib/firebaseClient';
import {
  ClientAppointment,
  ClientReview,
  UiDialogPayload,
  DEFAULT_REVIEWS,
  WEEKDAYS,
  MONTH_NAMES,
  BookingConfirmationSettings,
  PixKeyType,
} from './types/belladoor';
import { loadFromStorage, formatWhatsappForLink, getDatesInRange } from './utils/storage';
import {
  getSuggestedNeighborhoodsForCity,
  fetchNeighborhoodsByCityFromViaCep,
  POPULAR_BRAZIL_CITIES,
} from './utils/brazilLocations';
import {
  CouponItem,
  DEFAULT_MVP_COUPONS,
  DEFAULT_MP_CONFIG,
  MercadoPagoConfig,
  PLAN_PRICES,
  verifyProfessionalSubscriptionInMercadoPago,
} from './utils/mercadoPago';
import {
  getEffectiveBookingRules,
  getDefaultBookingRules,
  formatConfirmationMessage,
  formatClientToProMessage,
  calculateDeposit,
  buildWhatsAppLink,
  PIX_KEY_LABELS,
} from './utils/bookingRules';
import { validateCPF, formatCPF } from './utils/cpf';
import { HeaderBar } from './components/HeaderBar';
import { AuthView } from './components/AuthView';
import { ClientBookingsView } from './components/ClientBookingsView';
import { MarketplaceView } from './components/MarketplaceView';
import { ProBillingTab } from './components/ProBillingTab';
import { GlobalModals } from './components/GlobalModals';
import { AdminUsersView, UnifiedAdminUser } from './components/AdminUsersView';
import { ProOnboardingWizardModal } from './components/ProOnboardingWizardModal';
import { ProPromoCardModal } from './components/ProPromoCardModal';
import { ManualAppointmentModal } from './components/ManualAppointmentModal';
import { LgpdTermsModal } from './components/LgpdTermsModal';
import { BookingRulesModal } from './components/BookingRulesModal';
import { BetaFeedbackModal } from './components/BetaFeedbackModal';
import { ProCpfPromptModal } from './components/ProCpfPromptModal';
import { getThemeClasses, VisualTheme } from './utils/theme';

export default function App() {
  // Limpa chaves antigas da fase de demonstração e vitrines globais não isoladas no navegador
  useEffect(() => {
    try {
      [
        'belladoor_pro_vitrine',
        'belladoor_pro_services',
        'belladoor_pro_areas',
        'belladoor_appointments',
        'belladoor_schedule',
        'belladoor_reviews',
        'belladoor_user',
        'belladoor_active_tab',
        'belladoor_subscription',
        'belladoor_v2_pro_vitrine',
        'belladoor_v2_pro_services',
        'belladoor_v2_pro_areas',
        'belladoor_v2_schedule',
      ].forEach((k) => localStorage.removeItem(k));
    } catch {}
  }, []);

  const getProEmailKey = (email?: string): string => {
    const clean = (email || '').trim().toLowerCase();
    if (!clean) return '';
    return clean.replace(/[^a-z0-9]/g, '_');
  };

  // Estados de Autenticação & Teste Grátis de 7 Dias
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = loadFromStorage<AuthUser | null>('belladoor_v2_user', null);
    if (
      saved &&
      (saved.id === 'usr-visitor-link' || saved.email === 'cliente@belladoor.app')
    ) {
      try {
        localStorage.removeItem('belladoor_v2_user');
      } catch {}
      return null;
    }
    return saved;
  });
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('REGISTER');
  const [authRole, setAuthRole] = useState<'CLIENT' | 'PROFESSIONAL'>('CLIENT');
  const [roleExplicitlyChosen, setRoleExplicitlyChosen] = useState<boolean>(false);
  const [authName, setAuthName] = useState<string>('');
  const [authBirthDate, setAuthBirthDate] = useState<string>('');
  const [authCpf, setAuthCpf] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [pendingVerificationUser, setPendingVerificationUser] = useState<AuthUser | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [showTrialModal, setShowTrialModal] = useState<boolean>(false);
  const [selectedTrialPlan, setSelectedTrialPlan] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [cloudAccounts, setCloudAccounts] = useState<Record<string, any>>(() =>
    loadFromStorage<Record<string, any>>('belladoor_v2_cloud_accounts', {})
  );

  const activeProKey =
    currentUser?.role === 'PROFESSIONAL' && currentUser?.email
      ? getProEmailKey(currentUser.email)
      : '';

  const savedVitrine = loadFromStorage(
    activeProKey ? `belladoor_v2_pro_vitrine_${activeProKey}` : 'belladoor_v2_pro_vitrine_guest',
    {
      name: currentUser?.role === 'PROFESSIONAL' ? currentUser.fullName || '' : mockProfessional.name,
      title: mockProfessional.title,
      bio: mockProfessional.bio,
      instagram: mockProfessional.instagram,
      whatsapp: mockProfessional.whatsapp,
      avatarUrl:
        currentUser?.role === 'PROFESSIONAL' && currentUser?.avatarUrl
          ? currentUser.avatarUrl
          : mockProfessional.avatarUrl,
      coverUrl: mockProfessional.coverUrl,
      portfolio: mockProfessional.portfolio,
      bufferTimeMinutes: mockProfessional.bufferTimeMinutes,
      baseCity: mockProfessional.baseCity || '',
      baseNeighborhood: mockProfessional.baseNeighborhood || '',
      baseCep: mockProfessional.baseCep || '',
      baseAddress: mockProfessional.baseAddress || '',
      serviceMode: mockProfessional.serviceMode || 'HIBRIDO',
      studioName: mockProfessional.studioName || '',
      businessNiche: (mockProfessional.businessNiche || 'BEAUTY') as 'BEAUTY' | 'BARBERSHOP' | 'NEUTRAL',
      visualTheme: (mockProfessional.visualTheme || 'ROSE') as 'ROSE' | 'DARK_BARBER' | 'EMERALD' | 'MINIMAL',
      isVerified: Boolean(mockProfessional.isVerified),
      verificationStatus: (mockProfessional.verificationStatus || 'UNVERIFIED') as 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED',
      verificationDocUrl: mockProfessional.verificationDocUrl || '',
      verificationDocType: (mockProfessional.verificationDocType || 'RG') as 'RG' | 'CNH' | 'OUTRO',
      verifiedAt: mockProfessional.verifiedAt || '',
    }
  );

  const [activeTab, setActiveTab] = useState<'client' | 'pro'>(() => {
    const savedUser = loadFromStorage<AuthUser | null>('belladoor_v2_user', null);
    if (savedUser?.role === 'PROFESSIONAL') return 'pro';
    if (savedUser?.role === 'CLIENT') return 'client';
    return 'client';
  });
  const [clientSubView, setClientSubView] = useState<'EXPLORE' | 'MY_BOOKINGS'>('EXPLORE');
  const [isVitrinePreviewOpen, setIsVitrinePreviewOpen] = useState<boolean>(false);
  const [selectedPro, setSelectedPro] = useState<MockProfessional | null>(null);
  const [isFinanceSummaryCollapsed, setIsFinanceSummaryCollapsed] = useState<boolean>(false);
  const [isAtendimentosCollapsed, setIsAtendimentosCollapsed] = useState<boolean>(false);
  const [appointmentsFilter, setAppointmentsFilter] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED'>('ALL');
  const [isScheduleCollapsed, setIsScheduleCollapsed] = useState<boolean>(false);
  const [isVitrinePortfolioCollapsed, setIsVitrinePortfolioCollapsed] = useState<boolean>(false);
  const [isVitrineReviewsCollapsed, setIsVitrineReviewsCollapsed] = useState<boolean>(false);
  const [isVitrineServicesCollapsed, setIsVitrineServicesCollapsed] = useState<boolean>(false);
  const [isProVerificationCollapsed, setIsProVerificationCollapsed] = useState<boolean>(false);
  const [isProPresentationCollapsed, setIsProPresentationCollapsed] = useState<boolean>(false);
  const [isProServiceModeCollapsed, setIsProServiceModeCollapsed] = useState<boolean>(false);
  const [isProVisualIdentityCollapsed, setIsProVisualIdentityCollapsed] = useState<boolean>(false);
  const [isProPortfolioPhotosCollapsed, setIsProPortfolioPhotosCollapsed] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Diretório de todas as profissionais cadastradas na plataforma para exibição no Marketplace
  const [directoryPros, setDirectoryPros] = useState<Record<string, MockProfessional>>(() => {
    const raw = loadFromStorage<Record<string, MockProfessional>>('belladoor_v2_pros_directory', {});
    const cleaned: Record<string, MockProfessional> = {};
    const savedUser = loadFromStorage<AuthUser | null>('belladoor_v2_user', null);
    const isEverton = savedUser?.email?.trim().toLowerCase() === 'evertonrcsilva@gmail.com';
    Object.entries(raw).forEach(([k, p]) => {
      const isEv =
        (k || '').toLowerCase().includes('everton') ||
        (p?.name || '').toLowerCase().includes('everton') ||
        ((p as any)?.email || '').toLowerCase() === 'evertonrcsilva@gmail.com';
      if (!isEv || isEverton) {
        cleaned[k] = p;
      }
    });
    return cleaned;
  });

  // Estados de Personalização da Vitrine da Profissional Logada (100% isolados por conta)
  const [proDisplayName, setProDisplayName] = useState<string>(savedVitrine.name);
  const [proDisplayTitle, setProDisplayTitle] = useState<string>(savedVitrine.title);
  const [proDisplayBio, setProDisplayBio] = useState<string>(savedVitrine.bio);
  const [proInstagram, setProInstagram] = useState<string>(savedVitrine.instagram);
  const [proWhatsapp, setProWhatsapp] = useState<string>(
    savedVitrine.whatsapp || mockProfessional.whatsapp
  );
  const [proAvatarUrl, setProAvatarUrl] = useState<string>(savedVitrine.avatarUrl);
  const [proCoverUrl, setProCoverUrl] = useState<string>(savedVitrine.coverUrl);
  const [proPortfolioList, setProPortfolioList] = useState<{ url: string; title: string }[]>(
    savedVitrine.portfolio
  );
  const [proServicesList, setProServicesList] = useState<MockService[]>(() =>
    activeProKey
      ? loadFromStorage<MockService[]>(`belladoor_v2_pro_services_${activeProKey}`, [])
      : []
  );
  const [proNeighborhoodsList, setProNeighborhoodsList] = useState<MockNeighborhood[]>(() =>
    activeProKey
      ? loadFromStorage<MockNeighborhood[]>(`belladoor_v2_pro_areas_${activeProKey}`, [])
      : []
  );
  const [proBufferTime, setProBufferTime] = useState<number>(savedVitrine.bufferTimeMinutes);
  const [proBaseCity, setProBaseCity] = useState<string>(savedVitrine.baseCity || '');
  const [proBaseNeighborhood, setProBaseNeighborhood] = useState<string>(
    savedVitrine.baseNeighborhood || ''
  );
  const [proBaseCep, setProBaseCep] = useState<string>(savedVitrine.baseCep || '');
  const [proBaseAddress, setProBaseAddress] = useState<string>(savedVitrine.baseAddress || '');
  const [proServiceMode, setProServiceMode] = useState<'DOMICILIO' | 'STUDIO' | 'HIBRIDO'>(
    (savedVitrine.serviceMode as any) || 'HIBRIDO'
  );
  const [proStudioName, setProStudioName] = useState<string>(savedVitrine.studioName || '');
  const [proBusinessNiche, setProBusinessNiche] = useState<'BEAUTY' | 'BARBERSHOP' | 'NEUTRAL'>(
    (savedVitrine as any).businessNiche || 'BEAUTY'
  );
  const [proVisualTheme, setProVisualTheme] = useState<'ROSE' | 'DARK_BARBER' | 'EMERALD' | 'MINIMAL'>(
    (savedVitrine as any).visualTheme ||
      ((savedVitrine as any).businessNiche === 'BARBERSHOP' ? 'DARK_BARBER' : 'ROSE')
  );

  // Estados de Verificação de Identidade (Selo de Confiança)
  const [proIsVerified, setProIsVerified] = useState<boolean>(Boolean((savedVitrine as any).isVerified));
  const [proVerificationStatus, setProVerificationStatus] = useState<
    'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  >(
    (savedVitrine as any).verificationStatus ||
      ((savedVitrine as any).isVerified
        ? 'VERIFIED'
        : (savedVitrine as any).verificationDocUrl
        ? 'PENDING'
        : 'UNVERIFIED')
  );
  const [proVerificationDocUrl, setProVerificationDocUrl] = useState<string>(
    (savedVitrine as any).verificationDocUrl || ''
  );
  const [proVerificationDocType, setProVerificationDocType] = useState<'RG' | 'CNH' | 'OUTRO'>(
    (savedVitrine as any).verificationDocType || 'RG'
  );
  const [proVerifiedAt, setProVerifiedAt] = useState<string>((savedVitrine as any).verifiedAt || '');

  // Configuração de Expediente Padrão (inicia sem períodos bloqueados fictícios)
  const savedSchedule = loadFromStorage(
    activeProKey ? `belladoor_v2_schedule_${activeProKey}` : 'belladoor_v2_schedule_guest',
    {
      workingDays: mockProfessional.workingDays || [1, 2, 3, 4, 5, 6],
      workStartHour: 9,
      workEndHour: 19,
      lunchBreakEnabled: true,
      blockedPeriods: [] as {
        id: string;
        startDate: string;
        endDate: string;
        reason: string;
        dates: string[];
      }[],
    }
  );

  const [workingDays, setWorkingDays] = useState<number[]>(savedSchedule.workingDays);
  const [workStartHour, setWorkStartHour] = useState<number>(savedSchedule.workStartHour);
  const [workEndHour, setWorkEndHour] = useState<number>(savedSchedule.workEndHour);
  const [lunchBreakEnabled, setLunchBreakEnabled] = useState<boolean>(savedSchedule.lunchBreakEnabled);

  // =========================================================================
  // ESTADOS DE RASCUNHO (DRAFT) COM CONFIRMAÇÃO OBRIGATÓRIA ANTES DE SALVAR
  // =========================================================================
  // 1. Apresentação & Bio (Vitrine - Bloco 1)
  const [draftDisplayName, setDraftDisplayName] = useState<string>(savedVitrine.name);
  const [draftDisplayTitle, setDraftDisplayTitle] = useState<string>(savedVitrine.title);
  const [draftInstagram, setDraftInstagram] = useState<string>(savedVitrine.instagram);
  const [draftWhatsapp, setDraftWhatsapp] = useState<string>(
    savedVitrine.whatsapp || mockProfessional.whatsapp
  );
  const [draftDisplayBio, setDraftDisplayBio] = useState<string>(savedVitrine.bio);
  const [draftBusinessNiche, setDraftBusinessNiche] = useState<'BEAUTY' | 'BARBERSHOP' | 'NEUTRAL'>(
    (savedVitrine as any).businessNiche || 'BEAUTY'
  );
  const [draftVisualTheme, setDraftVisualTheme] = useState<'ROSE' | 'DARK_BARBER' | 'EMERALD' | 'MINIMAL'>(
    (savedVitrine as any).visualTheme ||
      ((savedVitrine as any).businessNiche === 'BARBERSHOP' ? 'DARK_BARBER' : 'ROSE')
  );

  // 2. Modalidade & Studio (Vitrine - Bloco 2)
  const [draftServiceMode, setDraftServiceMode] = useState<'DOMICILIO' | 'STUDIO' | 'HIBRIDO'>(
    (savedVitrine.serviceMode as any) || 'HIBRIDO'
  );
  const [draftStudioName, setDraftStudioName] = useState<string>(savedVitrine.studioName || '');
  const [draftStudioCep, setDraftStudioCep] = useState<string>(savedVitrine.baseCep || '');
  const [draftStudioAddress, setDraftStudioAddress] = useState<string>(savedVitrine.baseAddress || '');
  const [draftStudioNeighborhood, setDraftStudioNeighborhood] = useState<string>(
    savedVitrine.baseNeighborhood || ''
  );
  const [draftStudioCity, setDraftStudioCity] = useState<string>(savedVitrine.baseCity || '');

  // 3. Base Residencial onde mora (Aba Regiões quando Domicílio)
  const [draftHomeCep, setDraftHomeCep] = useState<string>(savedVitrine.baseCep || '');
  const [draftHomeCity, setDraftHomeCity] = useState<string>(savedVitrine.baseCity || '');
  const [draftHomeNeighborhood, setDraftHomeNeighborhood] = useState<string>(
    savedVitrine.baseNeighborhood || ''
  );
  const [draftHomeAddress, setDraftHomeAddress] = useState<string>(savedVitrine.baseAddress || '');

  // 4. Expediente & Horários (Aba Horários & Agenda)
  const [draftWorkingDays, setDraftWorkingDays] = useState<number[]>(savedSchedule.workingDays);
  const [draftWorkStartHour, setDraftWorkStartHour] = useState<number>(savedSchedule.workStartHour);
  const [draftWorkEndHour, setDraftWorkEndHour] = useState<number>(savedSchedule.workEndHour);
  const [draftLunchBreakEnabled, setDraftLunchBreakEnabled] = useState<boolean>(
    savedSchedule.lunchBreakEnabled
  );
  const [draftBufferTime, setDraftBufferTime] = useState<number>(savedVitrine.bufferTimeMinutes);

  // Sincroniza rascunhos quando o perfil salvo muda (hidratação ou troca de conta)
  useEffect(() => {
    setDraftDisplayName(proDisplayName);
    setDraftDisplayTitle(proDisplayTitle);
    setDraftInstagram(proInstagram);
    setDraftWhatsapp(proWhatsapp);
    setDraftDisplayBio(proDisplayBio);
    setDraftBusinessNiche(proBusinessNiche);
    setDraftVisualTheme(proVisualTheme);
  }, [
    proDisplayName,
    proDisplayTitle,
    proInstagram,
    proWhatsapp,
    proDisplayBio,
    proBusinessNiche,
    proVisualTheme,
  ]);

  useEffect(() => {
    setDraftServiceMode(proServiceMode);
    setDraftStudioName(proStudioName);
    setDraftStudioCep(proBaseCep);
    setDraftStudioAddress(proBaseAddress);
    setDraftStudioNeighborhood(proBaseNeighborhood);
    setDraftStudioCity(proBaseCity);
  }, [proServiceMode, proStudioName, proBaseCep, proBaseAddress, proBaseNeighborhood, proBaseCity]);

  useEffect(() => {
    setDraftHomeCep(proBaseCep);
    setDraftHomeCity(proBaseCity);
    setDraftHomeNeighborhood(proBaseNeighborhood);
    setDraftHomeAddress(proBaseAddress);
  }, [proBaseCep, proBaseCity, proBaseNeighborhood, proBaseAddress]);

  useEffect(() => {
    setDraftWorkingDays(workingDays);
    setDraftWorkStartHour(workStartHour);
    setDraftWorkEndHour(workEndHour);
    setDraftLunchBreakEnabled(lunchBreakEnabled);
    setDraftBufferTime(proBufferTime);
  }, [workingDays, workStartHour, workEndHour, lunchBreakEnabled, proBufferTime]);


  // Controle de Bloqueio de Agenda por Período (Início e Fim)
  const [blockedPeriods, setBlockedPeriods] = useState<{
    id: string;
    startDate: string;
    endDate: string;
    reason: string;
    dates: string[];
  }[]>(savedSchedule.blockedPeriods);

  // Estados de Assinatura SaaS, Mercado Pago & Cupons de Parceria (100% isolados por conta logada)
  const [subscriptionStatus, setSubscriptionStatus] = useState<'TRIAL' | 'ACTIVE'>(
    currentUser?.subscriptionStatus === 'ACTIVE' ? 'ACTIVE' : 'TRIAL'
  );
  const [planInterval, setPlanInterval] = useState<'MONTHLY' | 'ANNUAL'>(
    currentUser?.subscriptionPlan || 'ANNUAL'
  );
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [checkoutMethod, setCheckoutMethod] = useState<'PIX' | 'CARD'>('CARD');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState<boolean>(false);

  // Lista dinâmica de agendamentos reais da plataforma
  const [proAppointments, setProAppointments] = useState<ClientAppointment[]>(() =>
    loadFromStorage<ClientAppointment[]>('belladoor_v2_appointments', [])
  );

  // Avaliações reais das clientes
  const [proReviews, setProReviews] = useState<ClientReview[]>(() =>
    loadFromStorage<ClientReview[]>('belladoor_v2_reviews', DEFAULT_REVIEWS)
  );
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewClientName, setReviewClientName] = useState<string>('');
  const [reviewServiceName, setReviewServiceName] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewAppointmentId, setReviewAppointmentId] = useState<string | null>(null);

  // Configurações de Confirmação de Agendamento & Regras de Sinal (50%)
  const [bookingRules, setBookingRules] = useState<BookingConfirmationSettings>(() => {
    const key = activeProKey ? `belladoor_v2_booking_rules_${activeProKey}` : 'belladoor_v2_booking_rules_guest';
    const saved = loadFromStorage<Partial<BookingConfirmationSettings> | null>(key, null);
    return getEffectiveBookingRules(saved, {
      name: savedVitrine.name,
      whatsapp: savedVitrine.whatsapp || mockProfessional.whatsapp,
      email: currentUser?.email,
      businessNiche: savedVitrine.businessNiche,
    });
  });
  const [showBookingRulesModal, setShowBookingRulesModal] = useState<boolean>(false);
  const [showBetaFeedbackModal, setShowBetaFeedbackModal] = useState<boolean>(false);
  const [betaFeedbacks, setBetaFeedbacks] = useState<BetaFeedbackEntry[]>(() => {
    return loadFromStorage<BetaFeedbackEntry[]>('belladoor_v2_beta_feedbacks', []);
  });
  const [copiedClientPix, setCopiedClientPix] = useState<boolean>(false);

  // Normaliza o número de WhatsApp para links wa.me
  const formattedWhatsappForLink = formatWhatsappForLink(proWhatsapp, mockProfessional.whatsapp);

  const dynamicSlug = proDisplayName.trim()
    ? proDisplayName
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    : 'vitrine';

  const myProId = activeProKey ? `pro-${activeProKey}` : mockProfessional.id;

  const isReviewForPro = (rev: ClientReview, targetId?: string, targetSlug?: string) => {
    if (rev.proId && targetId && rev.proId === targetId) return true;
    if (rev.proSlug && targetSlug && rev.proSlug.toLowerCase() === targetSlug.toLowerCase()) {
      return true;
    }
    if (rev.appointmentId) {
      const linkedApp = proAppointments.find((a) => a.id === rev.appointmentId);
      if (linkedApp) {
        if (linkedApp.proId && targetId && linkedApp.proId === targetId) return true;
        if (
          linkedApp.proSlug &&
          targetSlug &&
          linkedApp.proSlug.toLowerCase() === targetSlug.toLowerCase()
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const myProReviews = proReviews.filter((r) => isReviewForPro(r, myProId, dynamicSlug));

  // Cálculo dinâmico da nota média com base nas avaliações reais desta profissional
  const calculatedRating =
    myProReviews.length > 0
      ? Number((myProReviews.reduce((acc, r) => acc + r.rating, 0) / myProReviews.length).toFixed(1))
      : 5.0;

  const resolvedBaseCity =
    proBaseCity.trim() ||
    proNeighborhoodsList.find((n) => n.city && n.city.trim())?.city ||
    '';

  // Perfil dinâmico da profissional sincronizado em tempo real com a Vitrine e Expediente dela
  const myCustomProProfile: MockProfessional = {
    ...mockProfessional,
    id: myProId,
    name: proDisplayName || (currentUser?.role === 'PROFESSIONAL' ? currentUser.fullName : ''),
    slug: dynamicSlug,
    title: proDisplayTitle,
    bio: proDisplayBio,
    instagram: proInstagram.replace(/^@+/, '').trim(),
    whatsapp: formattedWhatsappForLink,
    avatarUrl:
      proAvatarUrl && proAvatarUrl !== mockProfessional.avatarUrl
        ? proAvatarUrl
        : currentUser?.role === 'PROFESSIONAL' && currentUser?.avatarUrl
        ? currentUser.avatarUrl
        : proAvatarUrl || mockProfessional.avatarUrl,
    coverUrl: proCoverUrl || mockProfessional.coverUrl,
    portfolio: proPortfolioList,
    services: proServicesList,
    neighborhoods: proNeighborhoodsList,
    baseCity: resolvedBaseCity,
    baseCep: proBaseCep,
    baseAddress: proBaseAddress,
    serviceMode: proServiceMode,
    studioName: proStudioName,
    businessNiche: proBusinessNiche,
    visualTheme: proVisualTheme,
    baseNeighborhood:
      proNeighborhoodsList.length > 0
        ? proNeighborhoodsList[0].name
        : proStudioName
        ? proStudioName
        : 'Atendimento a Domicílio',
    startingPrice:
      proServicesList.length > 0
        ? Math.min(...proServicesList.map((s) => Number(s.price) || 0))
        : 0,
    bufferTimeMinutes: proBufferTime,
    workingDays,
    workStartHour,
    workEndHour,
    lunchBreakEnabled,
    blockedPeriods,
    rating: calculatedRating,
    reviewCount: myProReviews.length,
    bookingRules,
    isVerified: proIsVerified,
    verificationStatus: proVerificationStatus,
    verificationDocUrl: proVerificationDocUrl,
    verificationDocType: proVerificationDocType,
    verifiedAt: proVerifiedAt,
  };

  const rawPro =
    isVitrinePreviewOpen || activeTab === 'pro'
      ? myCustomProProfile
      : selectedPro && selectedPro.id !== myCustomProProfile.id
      ? directoryPros[selectedPro.id.replace(/^pro-/, '')] ||
        Object.values(directoryPros).find(
          (d) =>
            (d && d.id && d.id === selectedPro.id) ||
            (d &&
              d.slug &&
              selectedPro.slug &&
              d.slug.toLowerCase() === selectedPro.slug.toLowerCase())
        ) ||
        selectedPro
      : myCustomProProfile;

  const currentProReviews = proReviews.filter((r) => isReviewForPro(r, rawPro.id, rawPro.slug));
  const currentProRating =
    currentProReviews.length > 0
      ? Number(
          (
            currentProReviews.reduce((acc, r) => acc + r.rating, 0) / currentProReviews.length
          ).toFixed(1)
        )
      : 5.0;

  const isViewingOwnProVitrine = Boolean(
    currentUser?.role === 'PROFESSIONAL' &&
      (isVitrinePreviewOpen ||
        (selectedPro &&
          (selectedPro.id === myCustomProProfile.id ||
            selectedPro.id === myProId ||
            (currentUser.id &&
              (selectedPro.id === currentUser.id ||
                selectedPro.id === `pro-${currentUser.id}` ||
                (selectedPro as any).userId === currentUser.id)) ||
            (selectedPro.slug &&
              dynamicSlug &&
              selectedPro.slug.toLowerCase() === dynamicSlug.toLowerCase()) ||
            (selectedPro.slug &&
              myCustomProProfile.slug &&
              selectedPro.slug.toLowerCase() === myCustomProProfile.slug.toLowerCase()) ||
            ((selectedPro as any).email &&
              currentUser.email &&
              (selectedPro as any).email.toLowerCase() === currentUser.email.toLowerCase()))))
  );

  const pro: MockProfessional = {
    ...rawPro,
    rating: currentProRating,
    reviewCount: currentProReviews.length,
  };

  const proTheme = getThemeClasses(pro.visualTheme, pro.businessNiche);
  const panelTheme = getThemeClasses(proVisualTheme, proBusinessNiche);

  // Expediente e bloqueios efetivos da profissional exibida para a cliente (Marketplace ou link ?pro=...)
  const clientViewWorkingDays =
    Array.isArray(pro.workingDays) && pro.workingDays.length > 0
      ? pro.workingDays
      : [1, 2, 3, 4, 5, 6];
  const clientViewWorkStartHour =
    typeof pro.workStartHour === 'number' ? pro.workStartHour : 9;
  const clientViewWorkEndHour =
    typeof pro.workEndHour === 'number' ? pro.workEndHour : 19;
  const clientViewLunchBreakEnabled =
    typeof pro.lunchBreakEnabled === 'boolean' ? pro.lunchBreakEnabled : true;
  const clientViewBlockedPeriods = Array.isArray(pro.blockedPeriods)
    ? pro.blockedPeriods
    : [];
  const clientViewBufferTime =
    typeof pro.bufferTimeMinutes === 'number' ? pro.bufferTimeMinutes : 30;

  // Garante que cada profissional veja sempre seu próprio nome e foto ao carregar a sessão pela 1ª vez
  useEffect(() => {
    if (currentUser?.role === 'PROFESSIONAL' && currentUser?.email) {
      const isEverton = currentUser.email.trim().toLowerCase() === 'evertonrcsilva@gmail.com';
      if (
        !proDisplayName.trim() ||
        (!isEverton && proDisplayName.toLowerCase().includes('everton rodrigo'))
      ) {
        setProDisplayName(currentUser.fullName || '');
        if (
          currentUser.avatarUrl &&
          (!proAvatarUrl || proAvatarUrl === mockProfessional.avatarUrl)
        ) {
          setProAvatarUrl(currentUser.avatarUrl);
        }
      }
    }
  }, [currentUser?.email, currentUser?.role]);

  // Relógio em tempo real para atualizar o contador de 7 dias grátis automaticamente
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Garante que toda conta profissional tenha uma data fixa de término dos 7 dias grátis (trialEndsAt) salva na nuvem e no navegador
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'PROFESSIONAL' || !currentUser.email) return;
    if (currentUser.trialEndsAt && !Number.isNaN(new Date(currentUser.trialEndsAt).getTime())) {
      return;
    }

    const cleanEmail = currentUser.email.trim().toLowerCase();
    const cloudRecord = cloudAccounts[cleanEmail];
    let resolvedEndsAt: string;

    if (
      cloudRecord?.trialEndsAt &&
      !Number.isNaN(new Date(cloudRecord.trialEndsAt).getTime())
    ) {
      resolvedEndsAt = cloudRecord.trialEndsAt;
    } else if (
      cloudRecord?.createdAt &&
      !Number.isNaN(new Date(cloudRecord.createdAt).getTime())
    ) {
      const baseCreatedMs = new Date(cloudRecord.createdAt).getTime();
      const days = typeof currentUser.trialDaysLeft === 'number' ? currentUser.trialDaysLeft : 7;
      resolvedEndsAt = new Date(baseCreatedMs + days * 24 * 60 * 60 * 1000).toISOString();
    } else {
      const days = typeof currentUser.trialDaysLeft === 'number' ? currentUser.trialDaysLeft : 7;
      resolvedEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }

    const remaining = Math.max(
      0,
      Math.ceil((new Date(resolvedEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );

    const updatedUser: AuthUser = {
      ...currentUser,
      trialEndsAt: resolvedEndsAt,
      trialDaysLeft: remaining,
      isTrialActive: currentUser.subscriptionStatus !== 'ACTIVE' && remaining > 0,
    };
    setCurrentUser(updatedUser);
    updateUserAccountInFirestore(cleanEmail, {
      trialEndsAt: resolvedEndsAt,
      trialDaysLeft: remaining,
      isTrialActive: currentUser.subscriptionStatus !== 'ACTIVE' && remaining > 0,
    });
  }, [currentUser?.email, currentUser?.role, currentUser?.trialEndsAt, cloudAccounts]);

  // Cálculo em tempo real da contagem de dias grátis / cupom disponíveis
  const { trialDaysLeft, trialTotalDays, trialEndDateFormatted } = (() => {
    const cleanEmail = currentUser?.email ? currentUser.email.trim().toLowerCase() : '';
    const cloudRecord = cleanEmail ? cloudAccounts[cleanEmail] : null;
    const effectiveEndsAt = currentUser?.trialEndsAt || cloudRecord?.trialEndsAt;

    if (effectiveEndsAt) {
      const endMs = new Date(effectiveEndsAt).getTime();
      if (!Number.isNaN(endMs)) {
        const diffDays =
          endMs <= nowMs ? 0 : Math.max(0, Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24)));
        const totalDays = Math.max(
          7,
          currentUser?.couponDaysTotal || cloudRecord?.couponDaysTotal || 7,
          diffDays
        );
        return {
          trialDaysLeft: diffDays,
          trialTotalDays: totalDays,
          trialEndDateFormatted: new Date(endMs).toLocaleDateString('pt-BR'),
        };
      }
    }
    const defaultLeft =
      typeof currentUser?.trialDaysLeft === 'number'
        ? currentUser.trialDaysLeft
        : typeof cloudRecord?.trialDaysLeft === 'number'
        ? cloudRecord.trialDaysLeft
        : 7;
    const fallbackEnd = new Date(nowMs + Math.max(0, defaultLeft) * 24 * 60 * 60 * 1000);
    return {
      trialDaysLeft: Math.max(0, defaultLeft),
      trialTotalDays: Math.max(7, currentUser?.couponDaysTotal || 7, defaultLeft),
      trialEndDateFormatted: fallbackEnd.toLocaleDateString('pt-BR'),
    };
  })();

  // Carrega no estado os dados exclusivos da profissional que acabou de fazer login
  const hydrateProStateForUser = (user: AuthUser) => {
    const uKey = getProEmailKey(user.email);
    const userSavedVitrine = uKey
      ? loadFromStorage<any>(`belladoor_v2_pro_vitrine_${uKey}`, null)
      : null;
    const userSavedServices = uKey
      ? loadFromStorage<MockService[]>(`belladoor_v2_pro_services_${uKey}`, [])
      : [];
    const userSavedAreas = uKey
      ? loadFromStorage<MockNeighborhood[]>(`belladoor_v2_pro_areas_${uKey}`, [])
      : [];
    const userSavedSchedule = uKey
      ? loadFromStorage<any>(`belladoor_v2_schedule_${uKey}`, null)
      : null;

    setProDisplayName(userSavedVitrine?.name || user.fullName || '');
    if (user.cpf) {
      setAuthCpf(user.cpf);
    }
    setProDisplayTitle(userSavedVitrine?.title || '');
    setProDisplayBio(userSavedVitrine?.bio || '');
    setProInstagram(userSavedVitrine?.instagram || '');
    setProWhatsapp(userSavedVitrine?.whatsapp || '');
    setProAvatarUrl(
      userSavedVitrine?.avatarUrl && userSavedVitrine.avatarUrl !== mockProfessional.avatarUrl
        ? userSavedVitrine.avatarUrl
        : user.avatarUrl || mockProfessional.avatarUrl
    );
    setProCoverUrl(userSavedVitrine?.coverUrl || mockProfessional.coverUrl);
    setProPortfolioList(Array.isArray(userSavedVitrine?.portfolio) ? userSavedVitrine.portfolio : []);
    setProBufferTime(
      typeof userSavedVitrine?.bufferTimeMinutes === 'number'
        ? userSavedVitrine.bufferTimeMinutes
        : 30
    );
    setProBaseCity(userSavedVitrine?.baseCity || '');
    setProBaseNeighborhood(userSavedVitrine?.baseNeighborhood || '');
    setProBaseCep(userSavedVitrine?.baseCep || '');
    setProBaseAddress(userSavedVitrine?.baseAddress || '');
    setProServiceMode(
      userSavedVitrine?.serviceMode === 'STUDIO' ||
      userSavedVitrine?.serviceMode === 'DOMICILIO' ||
      userSavedVitrine?.serviceMode === 'HIBRIDO'
        ? userSavedVitrine.serviceMode
        : 'HIBRIDO'
    );
    setProStudioName(userSavedVitrine?.studioName || '');
    setProServicesList(userSavedServices);
    setProNeighborhoodsList(userSavedAreas);

    if (userSavedSchedule) {
      if (Array.isArray(userSavedSchedule.workingDays)) setWorkingDays(userSavedSchedule.workingDays);
      if (typeof userSavedSchedule.workStartHour === 'number')
        setWorkStartHour(userSavedSchedule.workStartHour);
      if (typeof userSavedSchedule.workEndHour === 'number')
        setWorkEndHour(userSavedSchedule.workEndHour);
      if (typeof userSavedSchedule.lunchBreakEnabled === 'boolean')
        setLunchBreakEnabled(userSavedSchedule.lunchBreakEnabled);
      if (Array.isArray(userSavedSchedule.blockedPeriods))
        setBlockedPeriods(userSavedSchedule.blockedPeriods);
    } else {
      setWorkingDays([1, 2, 3, 4, 5, 6]);
      setWorkStartHour(9);
      setWorkEndHour(19);
      setLunchBreakEnabled(true);
      setBlockedPeriods([]);
    }
  };

  const applyProfessionalLoginFlow = (user: AuthUser, isNewRegistration: boolean) => {
    const isPaidActive = user.subscriptionStatus === 'ACTIVE';

    setActiveTab('pro');
    setProSubTab('agenda');
    setSelectedPro(null);
    setClientSubView('EXPLORE');
    try {
      localStorage.setItem('belladoor_v2_active_tab', JSON.stringify('pro'));
      localStorage.setItem('belladoor_v2_user', JSON.stringify(user));
    } catch {}
    setPlanInterval(user.subscriptionPlan || 'ANNUAL');

    if (isPaidActive) {
      // Se já pagou o plano (ou ativou cupom de 1 ano), apenas abre a página do profissional sem modais de teste
      setSubscriptionStatus('ACTIVE');
      setShowTrialModal(false);
      return;
    }

    // Está utilizando período gratuito (7 dias grátis ou dias de cupom de parceria)
    setSubscriptionStatus('TRIAL');
    const endMs = user.trialEndsAt
      ? new Date(user.trialEndsAt).getTime()
      : Date.now() + 7 * 24 * 60 * 60 * 1000;
    const daysAvailable =
      endMs <= Date.now() ? 0 : Math.max(0, Math.ceil((endMs - Date.now()) / (1000 * 60 * 60 * 24)));

    if (daysAvailable <= 0) {
      setShowTrialModal(false);
      setProSubTab('billing');
      setUiDialog({
        emoji: '🔒',
        badge: 'Período Grátis Encerrado',
        title: 'Seus 7 Dias Grátis Terminaram',
        message:
          'Seu período de avaliação gratuita chegou ao fim. Para continuar utilizando sua Agenda, Vitrine e Serviços na plataforma, escolha um plano (PIX ou Cartão) ou aplique um cupom de desconto abaixo.',
        buttonText: 'Ir para Pagamento / Cupom 💳',
        variant: 'warning',
      });
      return;
    }

    if (isNewRegistration || !hasCompletedInitialOnboarding) {
      setShowTrialModal(true);
    } else {
      setShowTrialModal(false);
      showProSuccess(
        user.appliedCoupon
          ? `🎟️ Cupom ${user.appliedCoupon} Ativo: você possui ${daysAvailable} ${
              daysAvailable === 1 ? 'dia livre disponível' : 'dias livres disponíveis'
            }!`
          : `🎁 Período de Teste Grátis: você possui ${daysAvailable} ${
              daysAvailable === 1 ? 'dia grátis disponível' : 'dias grátis disponíveis'
            }!`
      );
    }
  };

  // Estados de Consentimento e Modal da LGPD (Lei nº 13.709/2018)
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean>(false);
  const [lgpdAccepted, setLgpdAccepted] = useState<boolean>(false);
  const [lgpdModalState, setLgpdModalState] = useState<{
    open: boolean;
    tab: 'PRIVACY' | 'TERMS' | 'BETA' | 'RIGHTS';
  }>({ open: false, tab: 'TERMS' });

  // [LGPD Art. 18, VI] Permite que a própria usuária exclua sua conta e dados pessoais
  const handleDeleteOwnAccount = async () => {
    if (!currentUser?.email) return;
    const cleanEmail = currentUser.email.trim().toLowerCase();
    const proKey = cleanEmail.replace(/[^a-z0-9]/g, '_');

    await deleteOwnAccountAndDataFromFirestore(cleanEmail);

    try {
      localStorage.removeItem('belladoor_v2_user');
      localStorage.removeItem(`belladoor_v2_pro_vitrine_${proKey}`);
      localStorage.removeItem(`belladoor_v2_pro_services_${proKey}`);
      localStorage.removeItem(`belladoor_v2_pro_areas_${proKey}`);
      localStorage.removeItem(`belladoor_v2_schedule_${proKey}`);
      localStorage.removeItem(`belladoor_v2_onboarding_done_${proKey}`);
    } catch {}

    setCloudAccounts((prev) => {
      const next = { ...prev };
      delete next[cleanEmail];
      return next;
    });
    setDirectoryPros((prev) => {
      const next = { ...prev };
      delete next[proKey];
      return next;
    });

    setCurrentUser(null);
    setSelectedPro(null);
    setShowAdminPanel(false);
    setUiDialog({
      emoji: '🛡️',
      badge: 'Direito do Titular • LGPD Art. 18',
      title: 'Conta e Dados Excluídos com Sucesso',
      message:
        'Sua conta e seus dados cadastrais foram removidos permanentemente da plataforma BellaDoor conforme sua solicitação.',
      buttonText: 'Entendi',
      variant: 'success',
    });
  };

  // Login Social com Google (Gmail)
  const handleGoogleAuth = async () => {
    if (authMode === 'REGISTER' && (!termsAccepted || !privacyAccepted)) {
      setAuthError(
        'Para criar sua conta, é obrigatório marcar as duas caixinhas confirmando que leu e concorda com os Termos de Uso e com a Política de Privacidade (LGPD).'
      );
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await signInWithGoogleOAuth(authRole, authMode, roleExplicitlyChosen);
      if (res.error) {
        setAuthError(res.error);
      } else if (res.user) {
        if (res.user.role === 'PROFESSIONAL') {
          hydrateProStateForUser(res.user);
        }
        setCurrentUser(res.user);
        if (res.user.role === 'PROFESSIONAL') {
          applyProfessionalLoginFlow(res.user, !res.isExistingUser);
        } else {
          setActiveTab('client');
          setClientSubView('EXPLORE');
          const hasDirectProIntent = Boolean(
            (selectedPro && selectedPro.id !== myCustomProProfile.id) ||
            (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('pro')) ||
            (() => {
              try {
                return Boolean(sessionStorage.getItem('belladoor_v2_direct_pro_slug'));
              } catch {
                return false;
              }
            })()
          );
          if (!hasDirectProIntent) {
            setSelectedPro(null);
          }
          setCategoryFilter('TODAS');
          setSearchQuery('');
          setClientName(res.user.fullName || '');
          try {
            localStorage.setItem('belladoor_v2_active_tab', JSON.stringify('client'));
            localStorage.setItem('belladoor_v2_user', JSON.stringify(res.user));
          } catch {}
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const completeAuthenticatedSession = (user: AuthUser, isNewRegistration: boolean) => {
    setPendingVerificationEmail(null);
    setPendingVerificationUser(null);
    setVerificationFeedback(null);
    setAuthError(null);
    if (user.role === 'PROFESSIONAL') {
      hydrateProStateForUser(user);
    }
    setCurrentUser(user);
    if (user.role === 'PROFESSIONAL') {
      applyProfessionalLoginFlow(user, isNewRegistration);
    } else {
      setActiveTab('client');
      setClientSubView('EXPLORE');
      const hasDirectProIntent = Boolean(
        (selectedPro && selectedPro.id !== myCustomProProfile.id) ||
        (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('pro')) ||
        (() => {
          try {
            return Boolean(sessionStorage.getItem('belladoor_v2_direct_pro_slug'));
          } catch {
            return false;
          }
        })()
      );
      if (!hasDirectProIntent) {
        setSelectedPro(null);
      }
      setCategoryFilter('TODAS');
      setSearchQuery('');
      setClientName(user.fullName || '');
      try {
        localStorage.setItem('belladoor_v2_active_tab', JSON.stringify('client'));
        localStorage.setItem('belladoor_v2_user', JSON.stringify(user));
      } catch {}
    }
  };

  // Contador regressivo para reenvio do e-mail de validação
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Verificação automática em segundo plano quando o usuário está na tela de confirmação de e-mail
  useEffect(() => {
    if (!pendingVerificationEmail) return;
    const interval = setInterval(async () => {
      const res = await checkEmailVerificationStatus(pendingVerificationEmail, authPassword);
      if (res.verified) {
        const targetUser = res.user || pendingVerificationUser;
        if (targetUser) {
          completeAuthenticatedSession(
            { ...targetUser, emailVerified: true },
            authMode === 'REGISTER'
          );
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [pendingVerificationEmail, authPassword, pendingVerificationUser, authMode]);

  const validateBirthDate = (birthDateStr: string): string | null => {
    const clean = birthDateStr.trim();
    const match = clean.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      return 'Informe sua data de nascimento completa no formato DD/MM/AAAA.';
    }
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const today = new Date();
    const currentYear = today.getFullYear();

    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1920 || year > currentYear) {
      return 'Data de nascimento inválida. Verifique o dia, mês e ano informados.';
    }
    const parsedDate = new Date(year, month - 1, day);
    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    ) {
      return 'A data de nascimento informada não existe no calendário.';
    }
    let age = currentYear - year;
    const monthDiff = today.getMonth() - (month - 1);
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
      age--;
    }
    if (age < 18) {
      return 'O cadastro na plataforma é exclusivo para maiores de 18 anos (Art. 14 da LGPD).';
    }
    return null;
  };

  // Cadastro ou Login com E-mail
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = authEmail.trim().toLowerCase();
    if (!cleanEmail || !authPassword) {
      setAuthError('Preencha seu e-mail e sua senha.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setAuthError('Informe um endereço de e-mail válido (ex: nome@dominio.com).');
      return;
    }

    if (authMode === 'REGISTER') {
      const nameParts = authName.trim().split(/\s+/).filter(Boolean);
      if (nameParts.length < 2 || nameParts.some((p) => p.length < 2)) {
        setAuthError('Por favor, informe seu Nome Completo (nome e sobrenome).');
        return;
      }

      const birthError = validateBirthDate(authBirthDate);
      if (birthError) {
        setAuthError(birthError);
        return;
      }

      // Validação obrigatória do CPF para profissionais da beleza
      if (authRole === 'PROFESSIONAL') {
        const cpfError = validateCPF(authCpf);
        if (cpfError) {
          setAuthError(cpfError);
          return;
        }
      }

      if (authPassword.length < 6) {
        setAuthError('A senha deve ter pelo menos 6 caracteres.');
        return;
      }

      if (authPassword !== authConfirmPassword) {
        setAuthError('A confirmação de senha não coincide com a senha digitada.');
        return;
      }

      if (!termsAccepted) {
        setAuthError(
          'Para criar sua conta, é obrigatório marcar a caixinha confirmando que leu e concorda com os Termos de Uso.'
        );
        return;
      }

      if (!privacyAccepted) {
        setAuthError(
          'Para criar sua conta, é obrigatório marcar a caixinha confirmando que leu e concorda com a Política de Privacidade (LGPD).'
        );
        return;
      }
    }

    setAuthLoading(true);
    setAuthError(null);
    setVerificationFeedback(null);

    try {
      if (authMode === 'REGISTER') {
        const res = await signUpWithEmail(
          cleanEmail,
          authPassword,
          authName.trim(),
          authRole,
          authBirthDate.trim(),
          authRole === 'PROFESSIONAL' ? authCpf.trim() : undefined
        );
        if (res.error) {
          setAuthError(res.error);
        } else if (res.user) {
          if (res.requiresEmailVerification) {
            setPendingVerificationUser(res.user);
            setPendingVerificationEmail(res.user.email);
            setResendCooldown(30);
            setVerificationFeedback(
              'Link de validação enviado! Verifique sua Caixa de Entrada (ou Spam) e clique no link para liberar seu acesso.'
            );
          } else {
            completeAuthenticatedSession(res.user, true);
          }
        }
      } else {
        const res = await signInWithEmail(cleanEmail, authPassword, authRole);
        if (res.error) {
          setAuthError(res.error);
        } else if (res.user) {
          if (res.requiresEmailVerification) {
            setPendingVerificationUser(res.user);
            setPendingVerificationEmail(res.user.email);
            setAuthError(
              'Seu e-mail ainda não foi validado. Abra o link enviado para o seu e-mail ou clique em "Reenviar link de validação" abaixo.'
            );
          } else {
            completeAuthenticatedSession(res.user, false);
          }
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Botão "Já validei meu e-mail — Liberar Acesso"
  const handleVerifyEmailCheck = async () => {
    if (!pendingVerificationEmail) return;
    setAuthLoading(true);
    setAuthError(null);
    setVerificationFeedback(null);
    try {
      const res = await checkEmailVerificationStatus(pendingVerificationEmail, authPassword);
      if (res.verified) {
        const targetUser = res.user || pendingVerificationUser;
        if (targetUser) {
          completeAuthenticatedSession(
            { ...targetUser, emailVerified: true },
            authMode === 'REGISTER'
          );
        }
      } else {
        setAuthError(
          `Ainda não identificamos a validação do e-mail ${pendingVerificationEmail}. Abra a mensagem enviada pelo BellaDoor, clique no link de confirmação e tente novamente.`
        );
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Botão "Reenviar link de validação"
  const handleResendVerificationEmail = async () => {
    if (!pendingVerificationEmail || resendCooldown > 0) return;
    setAuthLoading(true);
    setAuthError(null);
    setVerificationFeedback(null);
    try {
      const res = await resendVerificationEmail(pendingVerificationEmail, authPassword);
      if (res.sent) {
        setResendCooldown(45);
        setVerificationFeedback(
          `Enviamos um novo link de validação para ${pendingVerificationEmail}! Confira sua Caixa de Entrada e também a pasta Spam.`
        );
      } else if (res.error) {
        setAuthError(res.error);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCancelVerification = async () => {
    await signOutUser();
    setPendingVerificationEmail(null);
    setPendingVerificationUser(null);
    setVerificationFeedback(null);
    setAuthError(null);
  };

  // Logout completo com limpeza absoluta de sessão
  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('Erro ao encerrar sessão remota:', e);
    }

    // 1. Limpa usuário logado e painéis restritos
    setCurrentUser(null);
    setShowAdminPanel(false);
    setIsVitrinePreviewOpen(false);

    // 2. Reseta a tela para a Vitrine Geral de Profissionais (Marketplace)
    setSelectedPro(null);
    setActiveTab('client');
    setClientSubView('EXPLORE');
    setCategoryFilter('TODAS');
    setSearchQuery('');

    // 3. Reseta estados da conta profissional (sempre iniciando na Agenda no próximo login pro)
    setProSubTab('agenda');
    setProDisplayName('');
    setProDisplayTitle('');
    setProDisplayBio('');
    setProInstagram('');
    setProWhatsapp('');
    setProAvatarUrl(mockProfessional.avatarUrl);
    setProCoverUrl(mockProfessional.coverUrl);
    setProPortfolioList([]);
    setProServicesList([]);
    setProNeighborhoodsList([]);
    setProBaseCity('');
    setProBaseNeighborhood('');
    setProBaseCep('');
    setProBaseAddress('');
    setDraftStudioAddress('');
    setDraftStudioNeighborhood('');
    setDraftStudioCity('');
    setProServiceMode('HIBRIDO');
    setProStudioName('');
    setSubscriptionStatus('TRIAL');
    setShowTrialModal(false);
    setOnboardingWizardStep(null);
    setShowPromoCardModal(false);
    setShowManualAppointmentModal(false);

    // 4. Reseta formulário de autenticação
    setAuthRole('CLIENT');
    setRoleExplicitlyChosen(false);
    setAuthEmail('');
    setAuthPassword('');
    setAuthConfirmPassword('');
    setAuthName('');
    setAuthBirthDate('');
    setAuthCpf('');
    setAuthError(null);
    setVerificationFeedback(null);
    setPendingVerificationEmail(null);
    setPendingVerificationUser(null);
    setAuthMode('LOGIN');

    // 5. Limpa agendamento em andamento
    resetBooking(true);

    // 6. Reseta cache de hidratação remota
    cloudHydratedRef.current = {};

    // 7. Limpa chaves de sessão no localStorage e sessionStorage imediatamente
    try {
      localStorage.removeItem('belladoor_v2_user');
      localStorage.removeItem('belladoor_v2_active_tab');
      localStorage.removeItem('belladoor_v2_onboarding_wizard_step');
      localStorage.removeItem('belladoor_v2_onboarding_wizard_badge');
      sessionStorage.clear();
    } catch {}

    // 8. Limpa parâmetros de URL (como ?pro=...) para não ancorar em vitrine de terceiros
    if (window.location.search) {
      try {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch {}
    }
  };

  // Identificação do Administrador Master (Everton)
  const isMasterAdminAccount = Boolean(
    currentUser &&
      (currentUser.email?.trim().toLowerCase() === 'evertonrcsilva@gmail.com' ||
        currentUser.fullName?.toLowerCase().includes('everton') ||
        proDisplayName?.toLowerCase().includes('everton'))
  );

  const isEvertonAccount = Boolean(
    currentUser?.email && currentUser.email.trim().toLowerCase() === 'evertonrcsilva@gmail.com'
  );

  // Helper que identifica entidades/vitrines de teste do Everton para garantir privacidade absoluta
  const isEvertonProEntity = (item?: Partial<MockProfessional> | null, key?: string): boolean => {
    if (!item && !key) return false;
    const k = (key || '').toLowerCase();
    const id = (item?.id || '').toLowerCase();
    const email = ((item as any)?.email || '').toLowerCase();
    const slug = (item?.slug || '').toLowerCase();
    const name = (item?.name || '').toLowerCase();
    return (
      k.includes('everton') ||
      id.includes('everton') ||
      email === 'evertonrcsilva@gmail.com' ||
      slug.includes('everton') ||
      name.includes('everton')
    );
  };

  // [ADMIN EXCLUSIVO: evertonrcsilva@gmail.com] Salvar ou criar cadastro de cliente/profissional
  const handleAdminSaveUser = async (
    originalEmail: string,
    updatedUser: UnifiedAdminUser
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isMasterAdminAccount) {
      return { ok: false, error: 'Acesso restrito ao administrador.' };
    }

    const cleanNewEmail = updatedUser.email.trim().toLowerCase();
    const cleanOldEmail = (originalEmail || cleanNewEmail).trim().toLowerCase();
    const proKey = cleanNewEmail.replace(/[^a-z0-9]/g, '_');

    const daysLeft =
      typeof updatedUser.trialDaysLeft === 'number'
        ? Math.max(0, updatedUser.trialDaysLeft)
        : 7;
    const trialEnd =
      daysLeft <= 0
        ? new Date(Date.now() - 60 * 1000).toISOString()
        : new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000).toISOString();

    const accountPayload = {
      id: updatedUser.id || `usr_${proKey}`,
      email: cleanNewEmail,
      fullName: updatedUser.fullName.trim(),
      birthDate: updatedUser.birthDate?.trim() || '',
      cpf: updatedUser.cpf?.trim() || '',
      role: updatedUser.role,
      emailVerified: Boolean(updatedUser.emailVerified),
      requiresEmailVerification: !updatedUser.emailVerified,
      whatsapp: updatedUser.whatsapp?.trim() || '',
      title: updatedUser.title?.trim() || '',
      baseCity: updatedUser.baseCity?.trim() || '',
      baseNeighborhood: updatedUser.baseNeighborhood?.trim() || '',
      subscriptionStatus: updatedUser.subscriptionStatus || 'TRIAL',
      trialDaysLeft: daysLeft,
      trialEndsAt: trialEnd,
      isTrialActive:
        updatedUser.role === 'PROFESSIONAL' &&
        updatedUser.subscriptionStatus !== 'ACTIVE' &&
        daysLeft > 0,
      isVerified: Boolean(updatedUser.isVerified),
      verificationStatus:
        updatedUser.verificationStatus || (updatedUser.isVerified ? 'VERIFIED' : 'UNVERIFIED'),
      verificationDocUrl: updatedUser.verificationDocUrl,
      verificationDocType: updatedUser.verificationDocType,
      verifiedAt: updatedUser.verifiedAt,
    };

    const res = await adminSaveUserInFirestore(cleanOldEmail, {
      ...accountPayload,
      newPasswordPlain: updatedUser.newPasswordPlain,
    });
    if (!res.ok) return res;

    setCloudAccounts((prev) => {
      const next = { ...prev };
      if (cleanOldEmail && cleanOldEmail !== cleanNewEmail) {
        delete next[cleanOldEmail];
      }
      next[cleanNewEmail] = {
        ...(next[cleanOldEmail] || next[cleanNewEmail] || {}),
        ...accountPayload,
      };
      try {
        localStorage.setItem('belladoor_v2_cloud_accounts', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (
      currentUser?.email &&
      (currentUser.email.trim().toLowerCase() === cleanNewEmail ||
        currentUser.email.trim().toLowerCase() === cleanOldEmail)
    ) {
      const nextStatus: 'TRIAL' | 'ACTIVE' =
        accountPayload.subscriptionStatus === 'ACTIVE' ? 'ACTIVE' : 'TRIAL';
      setSubscriptionStatus(nextStatus);
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              email: cleanNewEmail,
              fullName: accountPayload.fullName,
              birthDate: accountPayload.birthDate,
              role: accountPayload.role,
              subscriptionStatus: nextStatus,
              trialDaysLeft: daysLeft,
              trialEndsAt: trialEnd,
              isTrialActive: accountPayload.isTrialActive,
            }
          : prev
      );

      if (typeof updatedUser.isVerified === 'boolean') {
        setProIsVerified(updatedUser.isVerified);
        setProVerificationStatus(
          updatedUser.verificationStatus || (updatedUser.isVerified ? 'VERIFIED' : 'UNVERIFIED')
        );
      }
    }

    // Se for profissional e estiver no diretório da vitrine, sincroniza também os dados na vitrine pública (exceto conta de gestão do Everton)
    if (updatedUser.role === 'PROFESSIONAL' && directoryPros[proKey] && !isEvertonProEntity(null, proKey)) {
      const updatedDirPro: MockProfessional = {
        ...directoryPros[proKey],
        name: updatedUser.fullName.trim(),
        title: updatedUser.title?.trim() || directoryPros[proKey].title,
        whatsapp: updatedUser.whatsapp?.trim() || directoryPros[proKey].whatsapp,
        baseCity: updatedUser.baseCity?.trim() || directoryPros[proKey].baseCity,
        baseNeighborhood:
          updatedUser.baseNeighborhood?.trim() || directoryPros[proKey].baseNeighborhood,
        isVerified: Boolean(updatedUser.isVerified),
        verificationStatus:
          updatedUser.verificationStatus || (updatedUser.isVerified ? 'VERIFIED' : 'UNVERIFIED'),
        verificationDocUrl:
          updatedUser.verificationDocUrl || directoryPros[proKey].verificationDocUrl,
        verificationDocType:
          updatedUser.verificationDocType || directoryPros[proKey].verificationDocType,
        verifiedAt: updatedUser.verifiedAt || directoryPros[proKey].verifiedAt,
      };
      const nextDirectory = {
        ...directoryPros,
        [proKey]: updatedDirPro,
      };
      setDirectoryPros(nextDirectory);
      try {
        localStorage.setItem('belladoor_v2_pros_directory', JSON.stringify(nextDirectory));
      } catch {}
      syncDocumentToFirestore('professionals_directory', { profiles: nextDirectory });
      syncDocumentToFirestore(`pro_vitrine_${proKey}`, {
        name: updatedDirPro.name,
        title: updatedDirPro.title,
        whatsapp: updatedDirPro.whatsapp,
        baseCity: updatedDirPro.baseCity,
        baseNeighborhood: updatedDirPro.baseNeighborhood,
        isVerified: updatedDirPro.isVerified,
        verificationStatus: updatedDirPro.verificationStatus,
        verificationDocUrl: updatedDirPro.verificationDocUrl,
        verificationDocType: updatedDirPro.verificationDocType,
        verifiedAt: updatedDirPro.verifiedAt,
      });
    }

    return { ok: true };
  };

  // [ADMIN EXCLUSIVO: evertonrcsilva@gmail.com] Excluir cadastro de cliente ou profissional
  const handleAdminDeleteUser = async (
    targetUser: UnifiedAdminUser
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isMasterAdminAccount) {
      return { ok: false, error: 'Acesso restrito ao administrador.' };
    }

    const cleanEmail = targetUser.email.trim().toLowerCase();
    const proKey = targetUser.proKey || cleanEmail.replace(/[^a-z0-9]/g, '_');

    // Salva preventivamente na lista de exclusões locais para garantir resposta imediata e consistente
    try {
      const raw = localStorage.getItem('belladoor_v2_deleted_emails');
      const deletedMap = raw ? JSON.parse(raw) : {};
      deletedMap[cleanEmail] = new Date().toISOString();
      localStorage.setItem('belladoor_v2_deleted_emails', JSON.stringify(deletedMap));
    } catch {}

    // 1. ATUALIZAÇÃO OTIMISTA IMEDIATA (libera a interface em milissegundos sem congelar)
    setCloudAccounts((prev) => {
      const next = { ...prev };
      delete next[cleanEmail];
      try {
        localStorage.setItem('belladoor_v2_cloud_accounts', JSON.stringify(next));
      } catch {}
      return next;
    });

    setDirectoryPros((prev) => {
      const next = { ...prev };
      delete next[proKey];
      delete next[`pro-${proKey}`];
      Object.keys(next).forEach((k) => {
        if (
          k === proKey ||
          next[k]?.id === `pro-${proKey}` ||
          ((next[k] as any)?.email || '').toLowerCase() === cleanEmail
        ) {
          delete next[k];
        }
      });
      try {
        localStorage.setItem('belladoor_v2_pros_directory', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Dispara a limpeza remota no Cloud Firestore em background com timeout de segurança
    try {
      await Promise.race([
        adminDeleteUserFromFirestore(cleanEmail, proKey),
        new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 1500)),
      ]);
    } catch (err) {
      console.warn('[Admin Delete] Limpeza remota disparada:', err);
    }

    return { ok: true };
  };

  // Verifica se a conta de qualquer profissional (do diretório ou link público ?pro=...) está com plano/teste/cupom expirado
  const isProfessionalAccountExpired = (
    targetPro: MockProfessional | null | undefined,
    explicitProKey?: string
  ): boolean => {
    if (!targetPro) return false;

    const derivedKeyFromId =
      targetPro.id && targetPro.id.startsWith('pro-')
        ? targetPro.id.replace(/^pro-/, '')
        : '';
    const matchedDirEntry = Object.entries(directoryPros).find(
      ([k, v]) =>
        k === explicitProKey ||
        k === derivedKeyFromId ||
        (v && v.id && v.id === targetPro.id) ||
        (v && v.slug && targetPro.slug && v.slug.toLowerCase() === targetPro.slug.toLowerCase())
    );
    const resolvedProKey = explicitProKey || derivedKeyFromId || matchedDirEntry?.[0] || '';

    const matchingAccount = Object.values(cloudAccounts || {}).find((acc: any) => {
      if (!acc || typeof acc.email !== 'string') return false;
      const accKey = acc.email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      return (
        (resolvedProKey && accKey === resolvedProKey) ||
        (targetPro.name &&
          typeof acc.fullName === 'string' &&
          acc.fullName.trim().toLowerCase() === targetPro.name.trim().toLowerCase())
      );
    });

    if (matchingAccount) {
      const endMs = matchingAccount.trialEndsAt
        ? new Date(matchingAccount.trialEndsAt).getTime()
        : NaN;
      if (matchingAccount.subscriptionStatus !== 'ACTIVE') {
        if (!Number.isNaN(endMs) && endMs <= nowMs) return true;
        if (
          Number.isNaN(endMs) &&
          typeof matchingAccount.trialDaysLeft === 'number' &&
          matchingAccount.trialDaysLeft <= 0
        ) {
          return true;
        }
      } else if (!Number.isNaN(endMs) && endMs <= nowMs) {
        return true;
      }
    }

    if (
      currentUser?.role === 'PROFESSIONAL' &&
      targetPro.id === myCustomProProfile.id &&
      subscriptionStatus !== 'ACTIVE' &&
      trialDaysLeft <= 0
    ) {
      return true;
    }

    return false;
  };

  // Lista real de profissionais da vitrine (combina todas as profissionais ativas do diretório + a profissional logada)
  const allProfessionalsWithLivePro: MockProfessional[] = (() => {
    const map = new Map<string, MockProfessional>();
    Object.entries(directoryPros).forEach(([proKey, item]) => {
      if (item && item.name && item.name.trim()) {
        // [PRIVACIDADE ADMIN]: O perfil do gestor Everton NUNCA é exibido como barbeiro para os outros profissionais e clientes!
        if (isEvertonProEntity(item, proKey) && !isEvertonAccount) {
          return;
        }

        // Oculta da busca geral caso a profissional esteja com o teste/cupom/plano expirado
        if (isProfessionalAccountExpired(item, proKey)) {
          return;
        }

        const itemReviews = proReviews.filter((r) => isReviewForPro(r, item.id, item.slug));
        const liveRating =
          itemReviews.length > 0
            ? Number((itemReviews.reduce((acc, r) => acc + r.rating, 0) / itemReviews.length).toFixed(1))
            : item.rating || 5.0;
        map.set(item.id || item.slug, {
          ...item,
          rating: liveRating,
          reviewCount: itemReviews.length,
        });
      }
    });
    if (
      currentUser?.role === 'PROFESSIONAL' &&
      proDisplayName.trim() &&
      (currentUser?.subscriptionStatus === 'ACTIVE' || trialDaysLeft > 0)
    ) {
      // Se for a conta do gestor Everton, injeta na lista somente se ele mesmo estiver logado
      if (!isEvertonProEntity(myCustomProProfile) || isEvertonAccount) {
        map.set(myCustomProProfile.id, myCustomProProfile);
      }
    }
    return Array.from(map.values());
  })();

  // Filtragem dos profissionais na vitrine/busca
  const filteredPros = allProfessionalsWithLivePro.filter((p) => {
    const matchesCategory = categoryFilter === 'TODAS' || p.category === categoryFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.baseNeighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.services.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Agendamentos exclusivos do profissional logado no Painel Pro
  const myProAppointments = proAppointments.filter((app) => {
    if (!currentUser) return false;

    // 1. Match direto por proId
    if (
      app.proId &&
      (app.proId === myCustomProProfile.id ||
        app.proId === myProId ||
        (activeProKey && (app.proId === activeProKey || app.proId === `pro-${activeProKey}`)))
    ) {
      return true;
    }

    // 2. Match por e-mail do profissional
    if (
      app.proEmail &&
      currentUser.email &&
      app.proEmail.toLowerCase() === currentUser.email.toLowerCase()
    ) {
      return true;
    }

    // 3. Match por slug da vitrine
    if (app.proSlug) {
      const cleanAppSlug = app.proSlug.trim().toLowerCase();
      if (myCustomProProfile.slug && cleanAppSlug === myCustomProProfile.slug.trim().toLowerCase()) {
        return true;
      }
      if (dynamicSlug && cleanAppSlug === dynamicSlug.trim().toLowerCase()) {
        return true;
      }
    }

    // 4. Fallback de segurança para conta master do Everton
    if (currentUser.email && currentUser.email.trim().toLowerCase() === 'evertonrcsilva@gmail.com') {
      if (
        app.proId === 'pro-evertonrcsilva_gmail_com' ||
        app.proId === 'pro-main' ||
        (app.proSlug && (app.proSlug.includes('everton') || app.proSlug.includes('barber'))) ||
        (app.proName && app.proName.toLowerCase().includes('everton'))
      ) {
        return true;
      }
    }

    return false;
  });

  // Estados do Painel da Profissional (Etapa 4 & 5)
  const [proSubTab, setProSubTab] = useState<'portfolio' | 'agenda' | 'services' | 'areas' | 'billing'>('agenda');
  const [proFeedback, setProFeedback] = useState<string | null>(null);

  // Estado da Janelinha / Modal no padrão visual da plataforma (Substitui qualquer alert/pop-up do navegador)
  const [uiDialog, setUiDialog] = useState<UiDialogPayload | null>(null);

  const showProSuccess = (msg: string) => {
    setProFeedback(msg);
    setTimeout(() => {
      setProFeedback((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Estados de Gerenciamento de Fotos dos Trabalhos (Portfólio da Vitrine)
  const [portfolioFormMode, setPortfolioFormMode] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
  const [editingPortfolioIndex, setEditingPortfolioIndex] = useState<number | null>(null);
  const [portfolioPhotoUrl, setPortfolioPhotoUrl] = useState<string>('');
  const [portfolioPhotoTitle, setPortfolioPhotoTitle] = useState<string>('');
  const [portfolioFormError, setPortfolioFormError] = useState<string | null>(null);

  // Redimensiona e comprime imagens enviadas do celular/computador para salvar rápido na nuvem
  const compressImageFile = (
    file: File,
    maxDimension: number = 600,
    quality: number = 0.85
  ): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const resultStr = typeof reader.result === 'string' ? reader.result : '';
        if (!resultStr) {
          resolve('');
          return;
        }
        const img = new window.Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(resultStr);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(resultStr);
        img.src = resultStr;
      };
      reader.readAsDataURL(file);
    });

  // Upload de Foto de Perfil do Aparelho (Computador / Celular)
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImageFile(file, 500, 0.85);
    if (dataUrl) {
      setProAvatarUrl(dataUrl);
      if (currentUser && currentUser.role === 'PROFESSIONAL') {
        const updated = { ...currentUser, avatarUrl: dataUrl };
        setCurrentUser(updated);
        if (currentUser.email) {
          updateUserAccountInFirestore(currentUser.email, { avatarUrl: dataUrl });
        }
      }
      showProSuccess('📷 Foto de perfil atualizada na sua Vitrine!');
    }
  };

  // Upload de Imagem de Capa / Banner do Aparelho (Computador / Celular)
  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImageFile(file, 1200, 0.82);
    if (dataUrl) {
      setProCoverUrl(dataUrl);
      showProSuccess('🖼️ Imagem do banner de capa atualizada na sua Vitrine!');
    }
  };

  // Upload de Foto de Trabalho Realizado (Portfólio)
  const handlePortfolioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImageFile(file, 900, 0.82);
    if (dataUrl) {
      setPortfolioPhotoUrl(dataUrl);
      setPortfolioFormError(null);
      if (!portfolioPhotoTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setPortfolioPhotoTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const openCreatePortfolioPage = () => {
    setEditingPortfolioIndex(null);
    setPortfolioPhotoUrl('');
    setPortfolioPhotoTitle('');
    setPortfolioFormError(null);
    setPortfolioFormMode('CREATE');
  };

  const openEditPortfolioPage = (item: { url: string; title: string }, idx: number) => {
    setEditingPortfolioIndex(idx);
    setPortfolioPhotoUrl(item.url);
    setPortfolioPhotoTitle(item.title);
    setPortfolioFormError(null);
    setPortfolioFormMode('EDIT');
  };

  const handleSavePortfolioForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioPhotoUrl.trim()) {
      setPortfolioFormError('Envie uma foto do seu aparelho ou escolha uma imagem.');
      return;
    }
    if (!portfolioPhotoTitle.trim()) {
      setPortfolioFormError('Informe um título ou legenda para identificar este trabalho.');
      return;
    }

    if (portfolioFormMode === 'CREATE') {
      setProPortfolioList([
        { url: portfolioPhotoUrl.trim(), title: portfolioPhotoTitle.trim() },
        ...proPortfolioList,
      ]);
      showProSuccess(`✨ Foto "${portfolioPhotoTitle.trim()}" publicada na sua Vitrine!`);
    } else if (portfolioFormMode === 'EDIT' && editingPortfolioIndex !== null) {
      setProPortfolioList(
        proPortfolioList.map((item, idx) =>
          idx === editingPortfolioIndex
            ? { url: portfolioPhotoUrl.trim(), title: portfolioPhotoTitle.trim() }
            : item
        )
      );
      showProSuccess(`✅ Foto "${portfolioPhotoTitle.trim()}" atualizada na Vitrine!`);
    }

    setPortfolioFormMode('LIST');
  };

  const handleDeletePortfolioItem = (idx: number, title: string) => {
    setProPortfolioList(proPortfolioList.filter((_, i) => i !== idx));
    setPortfolioFormMode('LIST');
    showProSuccess(`🗑️ Foto "${title}" removida da Vitrine.`);
  };

  // Estados da Página de Criação / Edição de Serviço (Sem pop-ups nativos)
  const [serviceFormMode, setServiceFormMode] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [srvName, setSrvName] = useState<string>('');
  const [srvDescription, setSrvDescription] = useState<string>('');
  const [srvPrice, setSrvPrice] = useState<string>('150');
  const [srvDuration, setSrvDuration] = useState<number>(60);
  const [srvPopular, setSrvPopular] = useState<boolean>(false);
  const [srvFormError, setSrvFormError] = useState<string | null>(null);

  // Abre a página para criar novo serviço
  const openCreateServicePage = () => {
    setEditingServiceId(null);
    setSrvName('');
    setSrvDescription('Atendimento completo a domicílio com materiais profissionais higienizados.');
    setSrvPrice('150');
    setSrvDuration(60);
    setSrvPopular(false);
    setSrvFormError(null);
    setServiceFormMode('CREATE');
  };

  // Abre a página para editar serviço existente
  const openEditServicePage = (service: MockService) => {
    setEditingServiceId(service.id);
    setSrvName(service.name);
    setSrvDescription(service.description || 'Atendimento completo a domicílio.');
    setSrvPrice(String(service.price));
    setSrvDuration(service.durationMinutes);
    setSrvPopular(Boolean(service.popular));
    setSrvFormError(null);
    setServiceFormMode('EDIT');
  };

  // Salva novo serviço ou atualiza existente
  const handleSaveServiceForm = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = Number(String(srvPrice).replace(',', '.'));
    if (!srvName.trim()) {
      setSrvFormError('Informe o nome do serviço.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setSrvFormError('Informe um valor válido para o serviço.');
      return;
    }
    if (!srvDuration || srvDuration < 10) {
      setSrvFormError('A duração deve ser de pelo menos 10 minutos.');
      return;
    }

    if (serviceFormMode === 'CREATE') {
      const newService: MockService = {
        id: `srv-${Date.now()}`,
        name: srvName.trim(),
        description: srvDescription.trim() || 'Atendimento personalizado a domicílio.',
        price: parsedPrice,
        durationMinutes: Number(srvDuration),
        popular: srvPopular,
      };
      setProServicesList([newService, ...proServicesList]);
      showProSuccess(`✨ Serviço "${newService.name}" adicionado ao seu catálogo!`);
    } else if (serviceFormMode === 'EDIT' && editingServiceId) {
      setProServicesList(
        proServicesList.map((s) =>
          s.id === editingServiceId
            ? {
                ...s,
                name: srvName.trim(),
                description: srvDescription.trim() || s.description,
                price: parsedPrice,
                durationMinutes: Number(srvDuration),
                popular: srvPopular,
              }
            : s
        )
      );
      showProSuccess(`✅ Serviço "${srvName.trim()}" atualizado com sucesso!`);
    }

    setServiceFormMode('LIST');
  };

  // Exclui um serviço do catálogo
  const handleDeleteService = (id: string, name: string) => {
    setProServicesList(proServicesList.filter((s) => s.id !== id));
    setServiceFormMode('LIST');
    showProSuccess(`🗑️ Serviço "${name}" removido do catálogo.`);
  };

  // Estados da Página de Criação / Edição de Região & Custo de Deslocamento
  // Estados do Cadastro da Base da Profissional (Onde Você Mora) + Cadastramento de Regiões
  const [baseCepLoading, setBaseCepLoading] = useState<boolean>(false);
  const [baseCepError, setBaseCepError] = useState<string | null>(null);

  const [areaFormMode, setAreaFormMode] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [areaName, setAreaName] = useState<string>('');
  const [areaCity, setAreaCity] = useState<string>('');
  const [areaFee, setAreaFee] = useState<string>('15');
  const [areaIsFree, setAreaIsFree] = useState<boolean>(false);
  const [dynamicCitySuggestions, setDynamicCitySuggestions] = useState<string[]>([]);
  const [areaFormError, setAreaFormError] = useState<string | null>(null);

  // Busca automática de CEP da Base da Profissional (para o assistente/wizard)
  const handleBaseCepLookup = async (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setProBaseCep(formatted);
    setBaseCepError(null);

    if (digits.length === 8) {
      setBaseCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (data.erro) {
          setBaseCepError('CEP não encontrado. Verifique os números digitados.');
          return;
        }
        const cityUf =
          data.localidade && data.uf
            ? `${data.localidade}-${data.uf}`
            : data.localidade || '';
        if (cityUf) setProBaseCity(cityUf);
        if (data.bairro) setProBaseNeighborhood(data.bairro);
        if (data.logradouro) setProBaseAddress(data.logradouro);
      } catch {
        setBaseCepError('Não foi possível consultar o CEP no momento.');
      } finally {
        setBaseCepLoading(false);
      }
    }
  };

  // Busca automática de CEP para o Studio (em modo rascunho - Vitrine Bloco 2)
  const handleStudioCepLookup = async (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setDraftStudioCep(formatted);
    setBaseCepError(null);

    if (digits.length === 8) {
      setBaseCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (data.erro) {
          setBaseCepError('CEP não encontrado. Verifique os números digitados.');
          return;
        }
        const cityUf =
          data.localidade && data.uf
            ? `${data.localidade}-${data.uf}`
            : data.localidade || '';
        if (cityUf) setDraftStudioCity(cityUf);
        if (data.bairro) setDraftStudioNeighborhood(data.bairro);
        if (data.logradouro) setDraftStudioAddress(data.logradouro);
      } catch {
        setBaseCepError('Não foi possível consultar o CEP no momento.');
      } finally {
        setBaseCepLoading(false);
      }
    }
  };

  // Busca automática de CEP para Base Residencial (em modo rascunho - Aba Regiões quando Domicílio)
  const handleHomeCepLookup = async (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setDraftHomeCep(formatted);
    setBaseCepError(null);

    if (digits.length === 8) {
      setBaseCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (data.erro) {
          setBaseCepError('CEP não encontrado. Verifique os números digitados.');
          return;
        }
        const cityUf =
          data.localidade && data.uf
            ? `${data.localidade}-${data.uf}`
            : data.localidade || '';
        if (cityUf) setDraftHomeCity(cityUf);
        if (data.bairro) setDraftHomeNeighborhood(data.bairro);
        if (data.logradouro) setDraftHomeAddress(data.logradouro);
      } catch {
        setBaseCepError('Não foi possível consultar o CEP no momento.');
      } finally {
        setBaseCepLoading(false);
      }
    }
  };

  // Confirmação de Apresentação e Bio
  const handleConfirmPresentationData = () => {
    if (!draftDisplayName.trim()) {
      showProSuccess('⚠️ Por favor, informe seu Nome Profissional.');
      return;
    }
    setProDisplayName(draftDisplayName.trim());
    setProDisplayTitle(draftDisplayTitle.trim());
    setProInstagram(draftInstagram.trim());
    setProWhatsapp(draftWhatsapp.trim());
    setProDisplayBio(draftDisplayBio.trim());
    setProBusinessNiche(draftBusinessNiche);
    setProVisualTheme(draftVisualTheme);
    showProSuccess(
      draftBusinessNiche === 'BARBERSHOP'
        ? '💈 Segmento de Barbearia, tema visual e tom do WhatsApp salvos com sucesso!'
        : '✨ Informações de apresentação e Bio salvas com sucesso na sua Vitrine!'
    );
  };

  // Confirmação de Modalidade de Atendimento & Studio
  const handleConfirmServiceMode = () => {
    setProServiceMode(draftServiceMode);
    setProStudioName(draftStudioName.trim());
    setProBaseCep(draftStudioCep.trim());
    setProBaseAddress(draftStudioAddress.trim());
    setProBaseNeighborhood(draftStudioNeighborhood.trim());
    setProBaseCity(draftStudioCity.trim());
    showProSuccess(
      `✨ Modalidade de atendimento salva com sucesso! Seu perfil agora está configurado como ${
        draftServiceMode === 'STUDIO'
          ? 'Apenas no Studio'
          : draftServiceMode === 'DOMICILIO'
          ? 'Apenas a Domicílio'
          : 'Híbrido (No Studio & A Domicílio)'
      }.`
    );
  };

  // Salva CPF pendente de profissionais cadastradas via Google ou legado
  const handleSaveMissingProCpf = async (cpfFormatted: string): Promise<boolean> => {
    if (!currentUser || !currentUser.email) return false;
    try {
      await updateUserAccountInFirestore(currentUser.email, { cpf: cpfFormatted });
      const updatedUser: AuthUser = { ...currentUser, cpf: cpfFormatted };
      setCurrentUser(updatedUser);
      setAuthCpf(cpfFormatted);
      try {
        localStorage.setItem('belladoor_v2_user', JSON.stringify(updatedUser));
      } catch {}
      showProSuccess('💳 CPF salvo com sucesso no seu cadastro profissional!');
      if (!hasCompletedInitialOnboarding) {
        setShowTrialModal(true);
      }
      return true;
    } catch (e) {
      console.error('Erro ao salvar CPF do profissional:', e);
      return false;
    }
  };

  // Confirmação de Base Residencial (Onde Você Mora)
  const handleSaveBaseLocation = () => {
    if (!draftHomeCity.trim()) {
      setBaseCepError('Digite seu CEP ou informe sua Cidade-UF base.');
      return;
    }
    setProBaseCep(draftHomeCep.trim());
    setProBaseCity(draftHomeCity.trim());
    setProBaseNeighborhood(draftHomeNeighborhood.trim());
    setProBaseAddress(draftHomeAddress.trim());

    if (draftHomeNeighborhood.trim()) {
      const alreadyExists = proNeighborhoodsList.some(
        (n) => n.name.toLowerCase() === draftHomeNeighborhood.trim().toLowerCase()
      );
      if (!alreadyExists) {
        const baseArea: MockNeighborhood = {
          id: `b-base-${Date.now()}`,
          name: draftHomeNeighborhood.trim(),
          city: draftHomeCity.trim(),
          cep: draftHomeCep.trim() || undefined,
          address: draftHomeAddress.trim() || undefined,
          travelFee: 0,
        };
        setProNeighborhoodsList([baseArea, ...proNeighborhoodsList]);
      }
    }
    showProSuccess(
      `🏠 Sua base residencial em ${
        draftHomeNeighborhood ? `${draftHomeNeighborhood} (${draftHomeCity})` : draftHomeCity
      } foi salva com sucesso!`
    );
  };

  // Confirmação de Horários do Expediente Diário
  const handleConfirmSchedule = () => {
    setWorkingDays(draftWorkingDays);
    setWorkStartHour(draftWorkStartHour);
    setWorkEndHour(draftWorkEndHour);
    setLunchBreakEnabled(draftLunchBreakEnabled);
    setProBufferTime(draftBufferTime);
    showProSuccess('⏰ Horários do expediente, dias de atendimento e margem de trânsito salvos com sucesso!');
  };

  // Indicadores se há alterações não salvas
  const isPresentationDirty =
    draftDisplayName !== proDisplayName ||
    draftDisplayTitle !== proDisplayTitle ||
    draftInstagram !== proInstagram ||
    draftWhatsapp !== proWhatsapp ||
    draftDisplayBio !== proDisplayBio ||
    draftBusinessNiche !== proBusinessNiche ||
    draftVisualTheme !== proVisualTheme;

  const isServiceModeDirty =
    draftServiceMode !== proServiceMode ||
    draftStudioName !== proStudioName ||
    draftStudioCep !== proBaseCep ||
    draftStudioAddress !== proBaseAddress ||
    draftStudioNeighborhood !== proBaseNeighborhood ||
    draftStudioCity !== proBaseCity;

  const isHomeBaseDirty =
    draftHomeCep !== proBaseCep ||
    draftHomeCity !== proBaseCity ||
    draftHomeNeighborhood !== proBaseNeighborhood ||
    draftHomeAddress !== proBaseAddress;

  const isScheduleDirty =
    JSON.stringify(draftWorkingDays) !== JSON.stringify(workingDays) ||
    draftWorkStartHour !== workStartHour ||
    draftWorkEndHour !== workEndHour ||
    draftLunchBreakEnabled !== lunchBreakEnabled ||
    draftBufferTime !== proBufferTime;

  // =========================================================================
  // ASSISTENTE PASSO A PASSO DE CONFIGURAÇÃO DA CONTA PROFISSIONAL (EM JANELA MODAL)
  // =========================================================================
  const [onboardingWizardStep, setOnboardingWizardStep] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [wizardActivationBadge, setWizardActivationBadge] = useState<string | null>(null);
  const [pendingWizardAfterPayment, setPendingWizardAfterPayment] = useState<boolean>(false);

  // Identifica se a profissional já passou pelo primeiro acesso ou já configurou a conta
  const hasCompletedInitialOnboarding = Boolean(
    currentUser?.onboardingCompleted ||
      (currentUser?.email &&
        cloudAccounts[currentUser.email.trim().toLowerCase()]?.onboardingCompleted) ||
      (activeProKey &&
        loadFromStorage<boolean>(`belladoor_v2_onboarding_done_${activeProKey}`, false))
  );
  const [showPromoCardModal, setShowPromoCardModal] = useState<boolean>(false);
  const [showManualAppointmentModal, setShowManualAppointmentModal] = useState<boolean>(false);

  const handleSaveManualAppointment = (newApp: ClientAppointment) => {
    appendAppointmentToFirestore(newApp);
    setProAppointments((prev) => {
      const updated = [newApp, ...prev.filter((a) => a.id !== newApp.id)];
      try {
        localStorage.setItem('belladoor_v2_appointments', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showProSuccess(
      proBusinessNiche === 'BARBERSHOP'
        ? `✅ Agendamento de ${newApp.clientName} adicionado à sua agenda com sucesso!`
        : `✅ Agendamento de ${newApp.clientName} adicionado à sua agenda com sucesso!`
    );
  };

  const markOnboardingAsDone = () => {
    if (activeProKey) {
      try {
        localStorage.setItem(`belladoor_v2_onboarding_done_${activeProKey}`, JSON.stringify(true));
      } catch {}
    }
    if (currentUser) {
      if (!currentUser.onboardingCompleted) {
        setCurrentUser((prev) => (prev ? { ...prev, onboardingCompleted: true } : prev));
      }
      if (currentUser.email) {
        updateUserAccountInFirestore(currentUser.email, {
          onboardingCompleted: true,
        });
      }
    }
  };

  const goToWizardStep = (step: 1 | 2 | 3 | 4 | 5) => {
    setOnboardingWizardStep(step);
  };

  const startProOnboardingWizard = (badge?: string) => {
    setActiveTab('pro');
    setWizardActivationBadge(badge || null);
    setOnboardingWizardStep(1);
    setPendingWizardAfterPayment(false);
  };

  const skipProOnboardingWizard = () => {
    markOnboardingAsDone();
    setOnboardingWizardStep(null);
    setWizardActivationBadge(null);
    setPendingWizardAfterPayment(false);
    setProSubTab('agenda');
    showProSuccess(
      '✨ Assistente fechado! Você pode configurar sua conta depois pelas abas abaixo ou clicando em "Assistente Passo a Passo".'
    );
  };

  const finishProOnboardingWizard = () => {
    markOnboardingAsDone();
    if (proBaseCity.trim()) {
      handleSaveBaseLocation();
    }
    if (activeProKey && bookingRules) {
      try {
        localStorage.setItem(`belladoor_v2_booking_rules_${activeProKey}`, JSON.stringify(bookingRules));
      } catch {}
      syncDocumentToFirestore(`pro_booking_rules_${activeProKey}`, bookingRules);
    }
    setOnboardingWizardStep(null);
    setWizardActivationBadge(null);
    setPendingWizardAfterPayment(false);
    setProSubTab('agenda');
    setUiDialog({
      emoji: '🎉',
      badge: 'Configuração Concluída!',
      title: `Parabéns, ${proDisplayName || currentUser?.fullName || 'Profissional'}!`,
      message:
        'Sua Vitrine, Portfólio, Serviços, Regiões de Atendimento e Regras de Agendamento (Sinal) foram configurados! Agora é só copiar seu link exclusivo e divulgar para seus clientes no Instagram e WhatsApp.',
      highlight: `Seu link exclusivo: bellador.web.app/?pro=${dynamicSlug}`,
      buttonText: 'Ir para Minha Agenda 📅',
      variant: 'success',
    });
  };

  const openCreateAreaPage = () => {
    const initialCity =
      proBaseCity.trim() ||
      proNeighborhoodsList.find((n) => n.city && n.city.trim())?.city ||
      '';
    setEditingAreaId(null);
    setAreaName('');
    setAreaCity(initialCity);
    setAreaFee('15');
    setAreaIsFree(false);
    setAreaFormError(null);
    setAreaFormMode('CREATE');
  };

  const openEditAreaPage = (area: MockNeighborhood) => {
    setEditingAreaId(area.id);
    setAreaName(area.name);
    setAreaCity(area.city || proBaseCity || '');
    setAreaFee(String(area.travelFee));
    setAreaIsFree(area.travelFee === 0);
    setAreaFormError(null);
    setAreaFormMode('EDIT');
  };

  // Quando a cidade muda, busca sugestões dinâmicas caso seja uma cidade do interior
  useEffect(() => {
    const targetCity = areaCity.trim() || proBaseCity.trim();
    if (!targetCity || targetCity.length < 4) {
      setDynamicCitySuggestions([]);
      return;
    }
    let cancelled = false;
    fetchNeighborhoodsByCityFromViaCep(targetCity).then((list) => {
      if (!cancelled) {
        setDynamicCitySuggestions(list);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [areaCity, proBaseCity]);

  const handleSaveAreaForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) {
      setAreaFormError('Informe o nome do bairro ou região atendida.');
      return;
    }
    const parsedFee = areaIsFree ? 0 : Math.max(0, Number(String(areaFee).replace(',', '.')) || 0);
    const chosenCity = areaCity.trim() || proBaseCity.trim();

    if (chosenCity && !proBaseCity.trim()) {
      setProBaseCity(chosenCity);
    }

    if (areaFormMode === 'CREATE') {
      const newArea: MockNeighborhood = {
        id: `b-${Date.now()}`,
        name: areaName.trim(),
        travelFee: parsedFee,
        city: chosenCity || undefined,
      };
      setProNeighborhoodsList([...proNeighborhoodsList, newArea]);
      showProSuccess(
        `🚗 Região "${newArea.name}${chosenCity ? ` - ${chosenCity}` : ''}" cadastrada (${parsedFee === 0 ? 'Deslocamento Grátis' : `Taxa R$ ${parsedFee.toFixed(2).replace('.', ',')}`})!`
      );
    } else if (areaFormMode === 'EDIT' && editingAreaId) {
      setProNeighborhoodsList(
        proNeighborhoodsList.map((n) =>
          n.id === editingAreaId
            ? {
                ...n,
                name: areaName.trim(),
                travelFee: parsedFee,
                city: chosenCity || n.city,
              }
            : n
        )
      );
      showProSuccess(`✅ Região "${areaName.trim()}" atualizada com sucesso!`);
    }

    setAreaFormMode('LIST');
  };

  const handleDeleteArea = (id: string, name: string) => {
    setProNeighborhoodsList(proNeighborhoodsList.filter((n) => n.id !== id));
    setAreaFormMode('LIST');
    showProSuccess(`🗑️ Região "${name}" removida da sua lista.`);
  };

  // Sincroniza em tempo real os dados de assinatura e término de teste da conta logada a partir do Cloud Firestore
  useEffect(() => {
    if (!currentUser || !currentUser.email) return;
    const cleanEmail = currentUser.email.trim().toLowerCase();
    const cloudAcc = cloudAccounts[cleanEmail];
    if (!cloudAcc) return;

    const cloudStatus: 'TRIAL' | 'ACTIVE' =
      cloudAcc.subscriptionStatus === 'ACTIVE' ? 'ACTIVE' : 'TRIAL';
    if (cloudStatus !== subscriptionStatus) {
      setSubscriptionStatus(cloudStatus);
    }
    if (
      cloudAcc.trialEndsAt &&
      cloudAcc.trialEndsAt !== currentUser.trialEndsAt
    ) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              trialEndsAt: cloudAcc.trialEndsAt,
              trialDaysLeft: cloudAcc.trialDaysLeft,
              subscriptionStatus: cloudStatus,
              subscriptionPlan: cloudAcc.subscriptionPlan || prev.subscriptionPlan,
              appliedCoupon: cloudAcc.appliedCoupon ?? prev.appliedCoupon,
              couponDaysTotal: cloudAcc.couponDaysTotal ?? prev.couponDaysTotal,
              paymentMethod: cloudAcc.paymentMethod ?? prev.paymentMethod,
            }
          : prev
      );
    }
  }, [cloudAccounts, currentUser?.email]);

  // Verifica se o período gratuito de 7 dias (ou cupom temporário) da profissional expirou sem assinatura ativa
  const isProTrialExpired = Boolean(
    currentUser?.role === 'PROFESSIONAL' &&
      subscriptionStatus !== 'ACTIVE' &&
      trialDaysLeft <= 0
  );

  // Quando os 7 dias grátis expiram, bloqueia as demais telas e mantém a profissional na aba Plano & Cupom
  useEffect(() => {
    if (isProTrialExpired) {
      if (activeTab !== 'pro') {
        setActiveTab('pro');
      }
      if (proSubTab !== 'billing') {
        setProSubTab('billing');
      }
      if (onboardingWizardStep !== null) {
        setOnboardingWizardStep(null);
      }
      if (showTrialModal) {
        setShowTrialModal(false);
      }
    }
  }, [isProTrialExpired, activeTab, proSubTab, onboardingWizardStep, showTrialModal]);

  const showExpiredTrialLockDialog = () => {
    setActiveTab('pro');
    setProSubTab('billing');
    setUiDialog({
      emoji: '🔒',
      badge: 'Período de 7 Dias Grátis Encerrado',
      title: 'Acesso Bloqueado — Ative seu Plano ou Cupom',
      message: `Seus ${trialTotalDays} dias gratuitos encerraram em ${trialEndDateFormatted}. No momento, apenas a área de Plano & Cupom está liberada. Faça o pagamento do plano ou aplique um cupom de desconto para desbloquear sua Agenda, Vitrine, Serviços e Regiões imediatamente.`,
      highlight: 'Liberação instantânea via PIX, Cartão ou Cupom de Desconto',
      buttonText: 'Ir para Pagamento / Cupom 💳',
      variant: 'warning',
    });
  };

  const [couponsList, setCouponsList] = useState<CouponItem[]>(() =>
    loadFromStorage<CouponItem[]>('belladoor_v2_coupons', DEFAULT_MVP_COUPONS)
  );
  const [mpConfig, setMpConfig] = useState<MercadoPagoConfig>(() =>
    loadFromStorage<MercadoPagoConfig>('belladoor_v2_mp_config', DEFAULT_MP_CONFIG)
  );

  // Aplica um Cupom de Parceira / Acesso Livre (15, 30, 90 dias ou 1 Ano Livre)
  const handleApplyCoupon = (rawCode: string) => {
    const cleanCode = rawCode.trim().toUpperCase();
    const matched = couponsList.find((c) => c.code.toUpperCase() === cleanCode && c.active);

    if (!matched) {
      setUiDialog({
        emoji: '⚠️',
        badge: 'Cupom Inválido',
        title: 'Cupom Não Encontrado',
        message: `O código "${cleanCode}" não foi encontrado ou não está ativo. Verifique com a equipe BellaDoor se o código foi digitado corretamente.`,
        highlight: `Código informado: ${cleanCode}`,
        buttonText: 'Tentar Novamente',
        variant: 'warning',
      });
      return;
    }

    // Se o cupom for de menos de 30 dias (ex: +15 dias), soma aos dias atuais restantes;
    // Se for de 30, 60, 90, 180 ou 365 dias (1 ano livre), garante pelo menos esse período completo a partir de hoje.
    const existingEndMs = currentUser?.trialEndsAt
      ? new Date(currentUser.trialEndsAt).getTime()
      : Date.now() + 7 * 24 * 60 * 60 * 1000;
    const baseMs =
      matched.days < 30 ? Math.max(Date.now(), existingEndMs) : Date.now();
    const newEndMs = baseMs + matched.days * 24 * 60 * 60 * 1000;
    const newEndIso = new Date(newEndMs).toISOString();
    const newDaysLeft = Math.max(
      matched.days,
      Math.ceil((newEndMs - Date.now()) / (1000 * 60 * 60 * 24))
    );

    const isOneYearFree = matched.days >= 365;
    const nextStatus: 'TRIAL' | 'ACTIVE' = isOneYearFree ? 'ACTIVE' : 'TRIAL';
    const nextPlan: 'MONTHLY' | 'ANNUAL' = isOneYearFree ? 'ANNUAL' : planInterval;
    const shouldOpenFirstAccessWizard = showTrialModal && !hasCompletedInitialOnboarding;

    setSubscriptionStatus(nextStatus);
    setPlanInterval(nextPlan);
    setShowTrialModal(false);

    try {
      localStorage.setItem(
        'belladoor_v2_subscription',
        JSON.stringify({ status: nextStatus, interval: nextPlan })
      );
    } catch {}

    if (currentUser) {
      const updatedUser: AuthUser = {
        ...currentUser,
        subscriptionStatus: nextStatus,
        subscriptionPlan: nextPlan,
        isTrialActive: !isOneYearFree,
        trialDaysLeft: newDaysLeft,
        trialEndsAt: newEndIso,
        appliedCoupon: matched.code,
        couponDaysTotal: newDaysLeft,
        paymentMethod: 'COUPON',
        onboardingCompleted: true,
      };
      setCurrentUser(updatedUser);
      if (currentUser.email) {
        updateUserAccountInFirestore(currentUser.email, {
          subscriptionStatus: nextStatus,
          subscriptionPlan: nextPlan,
          isTrialActive: !isOneYearFree,
          trialDaysLeft: newDaysLeft,
          trialEndsAt: newEndIso,
          appliedCoupon: matched.code,
          couponDaysTotal: newDaysLeft,
          paymentMethod: 'COUPON',
          onboardingCompleted: true,
        });
      }
    }

    if (shouldOpenFirstAccessWizard) {
      startProOnboardingWizard(
        `🎁 Cupom ${matched.code} Ativo (${newDaysLeft} dias livres)`
      );
    } else {
      markOnboardingAsDone();
      setActiveTab('pro');
      setProSubTab('agenda');
      const formattedEnd = new Date(newEndMs).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      setUiDialog({
        emoji: '🎟️',
        badge: `Cupom ${matched.code} Ativado!`,
        title: 'Plataforma Desbloqueada com Sucesso!',
        message: `Seu cupom "${matched.code}" (${matched.label}) foi validado e ativado! Sua Agenda, Vitrine, Serviços e Regiões estão 100% liberados por ${newDaysLeft} dias.`,
        highlight: `Acesso liberado até ${formattedEnd} (${newDaysLeft} dias disponíveis)`,
        buttonText: 'Ir para Minha Agenda 📅',
        variant: 'success',
      });
    }
  };

  const handleCreateCoupon = (newCoupon: CouponItem) => {
    const exists = couponsList.some(
      (c) => c.code.toUpperCase() === newCoupon.code.toUpperCase()
    );
    const updated = exists
      ? couponsList.map((c) =>
          c.code.toUpperCase() === newCoupon.code.toUpperCase() ? newCoupon : c
        )
      : [newCoupon, ...couponsList];

    setCouponsList(updated);
    try {
      localStorage.setItem('belladoor_v2_coupons', JSON.stringify(updated));
    } catch {}
    syncDocumentToFirestore('billing_config', {
      coupons: updated,
      mpConfig,
    });
    showProSuccess(`🎟️ Cupom "${newCoupon.code}" (${newCoupon.label}) criado e salvo na nuvem!`);
  };

  const handleDeleteCoupon = (code: string) => {
    const updated = couponsList.filter((c) => c.code.toUpperCase() !== code.toUpperCase());
    setCouponsList(updated);
    try {
      localStorage.setItem('belladoor_v2_coupons', JSON.stringify(updated));
    } catch {}
    syncDocumentToFirestore('billing_config', {
      coupons: updated,
      mpConfig,
    });
    showProSuccess(`🗑️ Cupom "${code}" removido.`);
  };

  const handleUpdateMpConfig = (nextConfig: MercadoPagoConfig) => {
    setMpConfig(nextConfig);
    try {
      localStorage.setItem('belladoor_v2_mp_config', JSON.stringify(nextConfig));
    } catch {}
    syncDocumentToFirestore('billing_config', {
      coupons: couponsList,
      mpConfig: nextConfig,
    });
    showProSuccess('💳 Configurações do Mercado Pago e Chave PIX salvas com sucesso!');
  };

  // Verifica diretamente na API do Mercado Pago se o Crédito Recorrente (ou PIX) da profissional está em dia
  const handleVerifyMercadoPagoSubscription = async (silent: boolean = false) => {
    if (!mpConfig.mpAccessToken || !currentUser?.email) {
      if (!silent) {
        setUiDialog({
          emoji: '🔑',
          badge: 'Integração Mercado Pago',
          title: 'Configure o Access Token Primeiro',
          message:
            'Para verificar pagamentos automaticamente na API do Mercado Pago, informe seu Access Token de Produção (APP_USR-...) no painel Admin da aba Plano.',
          buttonText: 'Entendi',
          variant: 'warning',
        });
      }
      return;
    }

    if (!silent) setIsPaymentProcessing(true);
    const check = await verifyProfessionalSubscriptionInMercadoPago({
      accessToken: mpConfig.mpAccessToken,
      payerEmail: currentUser.email,
    });
    if (!silent) setIsPaymentProcessing(false);

    if (check.isAuthorized) {
      const resolvedPlan = check.planInterval || planInterval;
      const resolvedMethod = check.paymentMethod || 'CARD_RECURRING';
      const daysGranted = resolvedPlan === 'ANNUAL' ? 365 : 30;
      const nextEndIso =
        check.nextPaymentDate ||
        new Date(Date.now() + daysGranted * 24 * 60 * 60 * 1000).toISOString();

      setSubscriptionStatus('ACTIVE');
      setPlanInterval(resolvedPlan);
      setShowCheckoutModal(false);

      try {
        localStorage.setItem(
          'belladoor_v2_subscription',
          JSON.stringify({ status: 'ACTIVE', interval: resolvedPlan })
        );
      } catch {}

      const updatedUser: AuthUser = {
        ...currentUser,
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: resolvedPlan,
        isTrialActive: false,
        trialDaysLeft: daysGranted,
        trialEndsAt: nextEndIso,
        paymentMethod: resolvedMethod,
        onboardingCompleted: true,
      };
      setCurrentUser(updatedUser);
      updateUserAccountInFirestore(currentUser.email, {
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: resolvedPlan,
        isTrialActive: false,
        trialDaysLeft: daysGranted,
        trialEndsAt: nextEndIso,
        paymentMethod: resolvedMethod,
        onboardingCompleted: true,
      });

      const shouldOpenFirstAccessWizard =
        pendingWizardAfterPayment && !hasCompletedInitialOnboarding;

      if (shouldOpenFirstAccessWizard) {
        startProOnboardingWizard();
      } else {
        markOnboardingAsDone();
        setPendingWizardAfterPayment(false);
        setActiveTab('pro');
        setProSubTab('agenda');
      }

      if (!silent) {
        setUiDialog({
          emoji: '✅',
          badge: 'Confirmado pelo Mercado Pago',
          title: 'Assinatura Verificada e Ativa!',
          message:
            check.statusDetail ||
            (shouldOpenFirstAccessWizard
              ? 'Sua assinatura foi localizada e confirmada diretamente na conta do Mercado Pago. Agora vamos configurar sua Vitrine e seus serviços no assistente passo a passo!'
              : 'Seu pagamento foi localizado e confirmado diretamente no Mercado Pago! Sua Agenda, Vitrine e Serviços estão 100% liberados.'),
          highlight:
            resolvedPlan === 'ANNUAL'
              ? 'Plano Anual • R$ 299,00/ano (Ativo)'
              : resolvedMethod === 'PIX'
              ? 'Plano Mensal PIX • R$ 44,90/mês (Ativo)'
              : 'Crédito Recorrente • R$ 39,90/mês (Em dia)',
          buttonText: shouldOpenFirstAccessWizard
            ? 'Iniciar Passo a Passo da Conta 🚀'
            : 'Ir para Minha Agenda 📅',
          variant: 'success',
        });
      }
    } else if (check.statusDetail && currentUser.paymentMethod === 'CARD_RECURRING') {
      // Caso o cartão recorrente tenha sido recusado ou assinatura cancelada no mês seguinte
      setSubscriptionStatus('TRIAL');
      const updatedUser: AuthUser = {
        ...currentUser,
        subscriptionStatus: 'TRIAL',
      };
      setCurrentUser(updatedUser);
      updateUserAccountInFirestore(currentUser.email, {
        subscriptionStatus: 'TRIAL',
      });
      if (!silent) {
        setUiDialog({
          emoji: '⚠️',
          badge: 'Status Mercado Pago',
          title: 'Pagamento Pendente no Mercado Pago',
          message: check.statusDetail,
          buttonText: 'Regularizar Agora',
          variant: 'warning',
        });
      }
    } else if (!silent) {
      setUiDialog({
        emoji: '⏳',
        badge: 'Aguardando Confirmação',
        title: 'Pagamento Ainda Não Identificado',
        message: `Ainda não encontramos um pagamento aprovado no Mercado Pago para o e-mail ${currentUser.email}. Se você acabou de pagar, aguarde alguns segundos e clique novamente.`,
        buttonText: 'Entendi',
        variant: 'warning',
      });
    }
  };

  // Conferência automática no login da profissional ou ao retornar do checkout do Mercado Pago
  useEffect(() => {
    if (
      currentUser?.role === 'PROFESSIONAL' &&
      currentUser?.email &&
      mpConfig.mpAccessToken &&
      mpConfig.mpAccessToken.trim().length > 15
    ) {
      const params = new URLSearchParams(window.location.search);
      const isReturnFromMp = params.get('mp_subscription') === 'verified';
      handleVerifyMercadoPagoSubscription(!isReturnFromMp);
    }
  }, [currentUser?.email, mpConfig.mpAccessToken]);

  // =========================================================================
  // PASSO 1: PERSISTÊNCIA AUTOMÁTICA (LOCALSTORAGE + GOOGLE CLOUD FIRESTORE)
  // =========================================================================
  const cloudHydratedRef = useRef<Record<string, boolean>>({});
  const applyingRemoteRef = useRef<Record<string, boolean>>({});

  // 1A. Listeners Globais da Plataforma (Usuários, Agendamentos, Avaliações, Billing e Diretório de Profissionais)
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const unsubUsers = subscribeToFirestoreDocument<{
      accounts?: Record<string, any>;
      deletedEmails?: Record<string, any>;
    }>(
      'users',
      (data) => {
        if (data?.accounts && typeof data.accounts === 'object') {
          let localDeleted: Record<string, any> = {};
          try {
            const raw = localStorage.getItem('belladoor_v2_deleted_emails');
            if (raw) localDeleted = JSON.parse(raw);
          } catch {}

          const remoteDeleted = data.deletedEmails || {};
          const sanitizedAccounts: Record<string, any> = {};
          for (const [key, acc] of Object.entries(data.accounts)) {
            const normKey = key.trim().toLowerCase();
            // Ignora usuários que foram excluídos pelo Admin local ou remotamente
            if (localDeleted[normKey] || remoteDeleted[normKey]) {
              continue;
            }
            if (acc && typeof acc === 'object') {
              const { passwordHash: _removed, ...safeAccount } = acc;
              sanitizedAccounts[normKey] = safeAccount;
            }
          }
          setCloudAccounts(sanitizedAccounts);
          try {
            localStorage.setItem('belladoor_v2_cloud_accounts', JSON.stringify(sanitizedAccounts));
          } catch {}
        }
      }
    );

    const unsubDirectory = subscribeToFirestoreDocument<{
      profiles?: Record<string, MockProfessional>;
    }>(
      'professionals_directory',
      (data) => {
        if (data?.profiles && typeof data.profiles === 'object') {
          // Remove automaticamente qualquer rascunho de teste do Everton do diretório público compartilhado
          const cleaned: Record<string, MockProfessional> = {};
          Object.entries(data.profiles).forEach(([k, p]) => {
            if (!isEvertonProEntity(p, k)) {
              cleaned[k] = p;
            }
          });
          setDirectoryPros(cleaned);
          try {
            localStorage.setItem('belladoor_v2_pros_directory', JSON.stringify(cleaned));
          } catch {}
          // AVISO: NUNCA execute syncDocumentToFirestore dentro do listener de snapshot para evitar loop de gravação!
        }
      }
    );

    const unsubAppointments = subscribeToFirestoreDocument<{ items: ClientAppointment[] }>(
      'appointments',
      (data) => {
        if (Array.isArray(data.items)) {
          applyingRemoteRef.current['appointments'] = true;
          setProAppointments(data.items);
          try {
            localStorage.setItem('belladoor_v2_appointments', JSON.stringify(data.items));
          } catch {}
        }
      },
      (exists) => {
        cloudHydratedRef.current['appointments'] = true;
        if (!exists && proAppointments.length > 0) {
          syncDocumentToFirestore('appointments', { items: proAppointments });
        }
      }
    );

    const unsubReviews = subscribeToFirestoreDocument<{ items: ClientReview[] }>(
      'reviews',
      (data) => {
        if (Array.isArray(data.items)) {
          applyingRemoteRef.current['reviews'] = true;
          setProReviews(data.items);
        }
      },
      (exists) => {
        cloudHydratedRef.current['reviews'] = true;
        if (!exists && proReviews.length > 0) {
          syncDocumentToFirestore('reviews', { items: proReviews });
        }
      }
    );

    const unsubBilling = subscribeToFirestoreDocument<{
      coupons?: CouponItem[];
      mpConfig?: MercadoPagoConfig;
    }>(
      'billing_config',
      (data) => {
        if (Array.isArray(data.coupons) && data.coupons.length > 0) {
          setCouponsList(data.coupons);
          try {
            localStorage.setItem('belladoor_v2_coupons', JSON.stringify(data.coupons));
          } catch {}
        }
        if (data.mpConfig) {
          setMpConfig(data.mpConfig);
          try {
            localStorage.setItem('belladoor_v2_mp_config', JSON.stringify(data.mpConfig));
          } catch {}
        }
      },
      (exists) => {
        if (!exists) {
          syncDocumentToFirestore('billing_config', {
            coupons: couponsList,
            mpConfig,
          });
        }
      }
    );

    const unsubFeedback = subscribeToFirestoreDocument<{ items?: BetaFeedbackEntry[] }>(
      'beta_feedback',
      (data) => {
        if (Array.isArray(data?.items)) {
          setBetaFeedbacks(data.items);
          try {
            localStorage.setItem('belladoor_v2_beta_feedbacks', JSON.stringify(data.items));
          } catch {}
        }
      }
    );

    return () => {
      unsubUsers();
      unsubDirectory();
      unsubAppointments();
      unsubReviews();
      unsubBilling();
      unsubFeedback();
    };
  }, []);

  // 1B. Listeners Exclusivos da Profissional Logada (100% isolados por conta de e-mail)
  useEffect(() => {
    if (!isFirebaseConfigured() || !activeProKey) return;

    const vitrineDoc = `pro_vitrine_${activeProKey}`;
    const servicesDoc = `pro_services_${activeProKey}`;
    const areasDoc = `pro_areas_${activeProKey}`;
    const scheduleDoc = `pro_schedule_${activeProKey}`;

    const unsubVitrine = subscribeToFirestoreDocument<any>(
      vitrineDoc,
      (data) => {
        applyingRemoteRef.current[vitrineDoc] = true;
        if (typeof data.name === 'string' && data.name.trim()) {
          setProDisplayName(data.name);
        } else if (currentUser?.fullName) {
          setProDisplayName(currentUser.fullName);
        }
        if (typeof data.title === 'string') setProDisplayTitle(data.title);
        if (typeof data.bio === 'string') setProDisplayBio(data.bio);
        if (typeof data.instagram === 'string') setProInstagram(data.instagram);
        if (typeof data.whatsapp === 'string') setProWhatsapp(data.whatsapp);
        if (typeof data.avatarUrl === 'string' && data.avatarUrl.trim()) {
          setProAvatarUrl(data.avatarUrl);
        }
        if (data.coverUrl) setProCoverUrl(data.coverUrl);
        if (Array.isArray(data.portfolio)) setProPortfolioList(data.portfolio);
        if (typeof data.bufferTimeMinutes === 'number') setProBufferTime(data.bufferTimeMinutes);
        if (typeof data.baseCity === 'string') setProBaseCity(data.baseCity);
        if (typeof data.baseNeighborhood === 'string') setProBaseNeighborhood(data.baseNeighborhood);
        if (typeof data.baseCep === 'string') setProBaseCep(data.baseCep);
        if (typeof data.baseAddress === 'string') setProBaseAddress(data.baseAddress);
        if (data.serviceMode === 'STUDIO' || data.serviceMode === 'DOMICILIO' || data.serviceMode === 'HIBRIDO') {
          setProServiceMode(data.serviceMode);
        }
        if (typeof data.studioName === 'string') setProStudioName(data.studioName);
        if (data.businessNiche === 'BEAUTY' || data.businessNiche === 'BARBERSHOP' || data.businessNiche === 'NEUTRAL') {
          setProBusinessNiche(data.businessNiche);
        }
        if (data.visualTheme === 'DARK_BARBER' || data.visualTheme === 'EMERALD' || data.visualTheme === 'MINIMAL') {
          setProVisualTheme(data.visualTheme);
        } else if (data.visualTheme === 'ROSE') {
          setProVisualTheme(data.businessNiche === 'BARBERSHOP' ? 'DARK_BARBER' : 'ROSE');
        } else if (data.businessNiche === 'BARBERSHOP') {
          setProVisualTheme('DARK_BARBER');
        }
        if (data.subscriptionStatus === 'ACTIVE' || data.subscriptionStatus === 'TRIAL') {
          setSubscriptionStatus(data.subscriptionStatus);
        }
        if (data.planInterval === 'ANNUAL' || data.planInterval === 'MONTHLY') {
          setPlanInterval(data.planInterval);
        }
        if (typeof data.isVerified === 'boolean') setProIsVerified(data.isVerified);
        if (typeof data.verificationStatus === 'string') setProVerificationStatus(data.verificationStatus);
        if (typeof data.verificationDocUrl === 'string') setProVerificationDocUrl(data.verificationDocUrl);
        if (typeof data.verificationDocType === 'string') setProVerificationDocType(data.verificationDocType);
        if (typeof data.verifiedAt === 'string') setProVerifiedAt(data.verifiedAt);
        if (data.bookingRules) {
          applyingRemoteRef.current[rulesDoc] = true;
          setBookingRules(
            getEffectiveBookingRules(data.bookingRules, {
              name: data.name || proDisplayName,
              whatsapp: data.whatsapp || proWhatsapp,
              email: currentUser?.email,
              businessNiche: data.businessNiche || proBusinessNiche,
            })
          );
        }
      },
      (exists) => {
        cloudHydratedRef.current[vitrineDoc] = true;
        if (!exists && currentUser?.role === 'PROFESSIONAL') {
          const initialName = currentUser.fullName || proDisplayName || '';
          const initialAvatar =
            currentUser.avatarUrl || proAvatarUrl || mockProfessional.avatarUrl;
          if (initialName) setProDisplayName(initialName);
          if (initialAvatar) setProAvatarUrl(initialAvatar);
          syncDocumentToFirestore(vitrineDoc, {
            email: currentUser.email,
            name: initialName,
            title: proDisplayTitle,
            bio: proDisplayBio,
            instagram: proInstagram,
            whatsapp: proWhatsapp,
            avatarUrl: initialAvatar,
            coverUrl: proCoverUrl,
            portfolio: proPortfolioList,
            bufferTimeMinutes: proBufferTime,
            baseCity: proBaseCity,
            baseNeighborhood: proBaseNeighborhood,
            baseCep: proBaseCep,
            baseAddress: proBaseAddress,
            serviceMode: proServiceMode,
            studioName: proStudioName,
            businessNiche: proBusinessNiche,
            visualTheme: proVisualTheme,
            subscriptionStatus: currentUser.subscriptionStatus || 'TRIAL',
            planInterval: currentUser.subscriptionPlan || 'ANNUAL',
            bookingRules,
          });
        }
      }
    );

    const unsubServices = subscribeToFirestoreDocument<{ items: MockService[] }>(
      servicesDoc,
      (data) => {
        if (Array.isArray(data.items)) {
          applyingRemoteRef.current[servicesDoc] = true;
          setProServicesList(data.items);
        }
      },
      (exists) => {
        cloudHydratedRef.current[servicesDoc] = true;
        if (!exists && proServicesList.length > 0) {
          syncDocumentToFirestore(servicesDoc, { items: proServicesList });
        }
      }
    );

    const unsubAreas = subscribeToFirestoreDocument<{ items: MockNeighborhood[] }>(
      areasDoc,
      (data) => {
        if (Array.isArray(data.items)) {
          applyingRemoteRef.current[areasDoc] = true;
          setProNeighborhoodsList(data.items);
        }
      },
      (exists) => {
        cloudHydratedRef.current[areasDoc] = true;
        if (!exists && proNeighborhoodsList.length > 0) {
          syncDocumentToFirestore(areasDoc, { items: proNeighborhoodsList });
        }
      }
    );

    const unsubSchedule = subscribeToFirestoreDocument<any>(
      scheduleDoc,
      (data) => {
        applyingRemoteRef.current[scheduleDoc] = true;
        if (Array.isArray(data.workingDays)) setWorkingDays(data.workingDays);
        if (typeof data.workStartHour === 'number') setWorkStartHour(data.workStartHour);
        if (typeof data.workEndHour === 'number') setWorkEndHour(data.workEndHour);
        if (typeof data.lunchBreakEnabled === 'boolean') setLunchBreakEnabled(data.lunchBreakEnabled);
        if (Array.isArray(data.blockedPeriods)) setBlockedPeriods(data.blockedPeriods);
      },
      (exists) => {
        cloudHydratedRef.current[scheduleDoc] = true;
        if (!exists) {
          syncDocumentToFirestore(scheduleDoc, {
            workingDays,
            workStartHour,
            workEndHour,
            lunchBreakEnabled,
            blockedPeriods,
          });
        }
      }
    );

    const rulesDoc = `pro_booking_rules_${activeProKey}`;
    const unsubRules = subscribeToFirestoreDocument<any>(
      rulesDoc,
      (data) => {
        if (data) {
          applyingRemoteRef.current[rulesDoc] = true;
          setBookingRules(
            getEffectiveBookingRules(data, {
              name: proDisplayName,
              whatsapp: proWhatsapp,
              email: currentUser?.email,
              businessNiche: proBusinessNiche,
            })
          );
        }
      },
      (exists) => {
        cloudHydratedRef.current[rulesDoc] = true;
        if (!exists && bookingRules) {
          syncDocumentToFirestore(rulesDoc, bookingRules);
        }
      }
    );

    return () => {
      unsubVitrine();
      unsubServices();
      unsubAreas();
      unsubSchedule();
      unsubRules();
    };
  }, [activeProKey]);

  useEffect(() => {
    try {
      localStorage.setItem('belladoor_v2_active_tab', JSON.stringify(activeTab));
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('belladoor_v2_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('belladoor_v2_user');
      }
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    if (!activeProKey) return;
    const vitrineDoc = `pro_vitrine_${activeProKey}`;
    const payload = {
      email: currentUser?.email || '',
      name: proDisplayName,
      title: proDisplayTitle,
      bio: proDisplayBio,
      instagram: proInstagram,
      whatsapp: proWhatsapp,
      avatarUrl: proAvatarUrl,
      coverUrl: proCoverUrl,
      portfolio: proPortfolioList,
      bufferTimeMinutes: proBufferTime,
      baseCity: proBaseCity,
      baseNeighborhood: proBaseNeighborhood,
      baseCep: proBaseCep,
      baseAddress: proBaseAddress,
      serviceMode: proServiceMode,
      studioName: proStudioName,
      businessNiche: proBusinessNiche,
      visualTheme: proVisualTheme,
      subscriptionStatus,
      planInterval,
      bookingRules,
      isVerified: proIsVerified,
      verificationStatus: proVerificationStatus,
      verificationDocUrl: proVerificationDocUrl,
      verificationDocType: proVerificationDocType,
      verifiedAt: proVerifiedAt,
    };
    try {
      localStorage.setItem(`belladoor_v2_pro_vitrine_${activeProKey}`, JSON.stringify(payload));
    } catch {}
    if (!cloudHydratedRef.current[vitrineDoc]) return;
    if (applyingRemoteRef.current[vitrineDoc]) {
      applyingRemoteRef.current[vitrineDoc] = false;
      return;
    }
    syncDocumentToFirestore(vitrineDoc, payload);
  }, [
    activeProKey,
    proDisplayName,
    proDisplayTitle,
    proDisplayBio,
    proInstagram,
    proWhatsapp,
    proAvatarUrl,
    proCoverUrl,
    proPortfolioList,
    proBufferTime,
    proBaseCity,
    proBaseNeighborhood,
    proBaseCep,
    proBaseAddress,
    proServiceMode,
    proStudioName,
    proBusinessNiche,
    proVisualTheme,
    subscriptionStatus,
    planInterval,
    bookingRules,
    proIsVerified,
    proVerificationStatus,
    proVerificationDocUrl,
    proVerificationDocType,
    proVerifiedAt,
  ]);

  // Sincronização em tempo real das regras de agendamento e sinal de 50%
  useEffect(() => {
    if (!activeProKey) return;
    const rulesDoc = `pro_booking_rules_${activeProKey}`;
    try {
      localStorage.setItem(`belladoor_v2_booking_rules_${activeProKey}`, JSON.stringify(bookingRules));
    } catch {}
    if (!cloudHydratedRef.current[rulesDoc]) return;
    if (applyingRemoteRef.current[rulesDoc]) {
      applyingRemoteRef.current[rulesDoc] = false;
      return;
    }
    syncDocumentToFirestore(rulesDoc, bookingRules);
  }, [activeProKey, bookingRules]);

  // Atualiza o Diretório Público de Profissionais quando a profissional logada edita sua vitrine, serviços, regiões ou expediente
  useEffect(() => {
    if (!activeProKey || !proDisplayName.trim()) return;
    const vitrineDoc = `pro_vitrine_${activeProKey}`;
    if (!cloudHydratedRef.current[vitrineDoc]) return;

    // Se for a conta do gestor Everton, NUNCA adiciona no diretório público das profissionais!
    if (isEvertonAccount || isEvertonProEntity(myCustomProProfile, activeProKey)) {
      return;
    }

    const updatedDirectory = {
      ...directoryPros,
      [activeProKey]: {
        ...myCustomProProfile,
        workingDays,
        workStartHour,
        workEndHour,
        lunchBreakEnabled,
        blockedPeriods,
      },
    };
    setDirectoryPros(updatedDirectory);
    try {
      localStorage.setItem('belladoor_v2_pros_directory', JSON.stringify(updatedDirectory));
    } catch {}
    syncDocumentToFirestore('professionals_directory', {
      profiles: updatedDirectory,
    });
  }, [
    activeProKey,
    proDisplayName,
    proDisplayTitle,
    proDisplayBio,
    proInstagram,
    proWhatsapp,
    proAvatarUrl,
    proCoverUrl,
    proPortfolioList,
    proServicesList,
    proNeighborhoodsList,
    proBufferTime,
    proBaseCity,
    proBaseNeighborhood,
    proBaseCep,
    proBaseAddress,
    proServiceMode,
    proStudioName,
    proBusinessNiche,
    proVisualTheme,
    workingDays,
    workStartHour,
    workEndHour,
    lunchBreakEnabled,
    blockedPeriods,
  ]);

  useEffect(() => {
    if (!activeProKey) return;
    const servicesDoc = `pro_services_${activeProKey}`;
    try {
      localStorage.setItem(`belladoor_v2_pro_services_${activeProKey}`, JSON.stringify(proServicesList));
    } catch {}
    if (!cloudHydratedRef.current[servicesDoc]) return;
    if (applyingRemoteRef.current[servicesDoc]) {
      applyingRemoteRef.current[servicesDoc] = false;
      return;
    }
    syncDocumentToFirestore(servicesDoc, { items: proServicesList });
  }, [activeProKey, proServicesList]);

  useEffect(() => {
    if (!activeProKey) return;
    const areasDoc = `pro_areas_${activeProKey}`;
    try {
      localStorage.setItem(`belladoor_v2_pro_areas_${activeProKey}`, JSON.stringify(proNeighborhoodsList));
    } catch {}
    if (!cloudHydratedRef.current[areasDoc]) return;
    if (applyingRemoteRef.current[areasDoc]) {
      applyingRemoteRef.current[areasDoc] = false;
      return;
    }
    syncDocumentToFirestore(areasDoc, { items: proNeighborhoodsList });
  }, [activeProKey, proNeighborhoodsList]);

  useEffect(() => {
    try {
      localStorage.setItem('belladoor_v2_appointments', JSON.stringify(proAppointments));
    } catch {}
    if (!cloudHydratedRef.current['appointments']) return;
    if (applyingRemoteRef.current['appointments']) {
      applyingRemoteRef.current['appointments'] = false;
      return;
    }
    syncDocumentToFirestore('appointments', { items: proAppointments });
  }, [proAppointments]);

  useEffect(() => {
    if (!activeProKey) return;
    const scheduleDoc = `pro_schedule_${activeProKey}`;
    const schedulePayload = {
      workingDays,
      workStartHour,
      workEndHour,
      lunchBreakEnabled,
      blockedPeriods,
    };
    try {
      localStorage.setItem(`belladoor_v2_schedule_${activeProKey}`, JSON.stringify(schedulePayload));
    } catch {}
    if (!cloudHydratedRef.current[scheduleDoc]) return;
    if (applyingRemoteRef.current[scheduleDoc]) {
      applyingRemoteRef.current[scheduleDoc] = false;
      return;
    }
    syncDocumentToFirestore(scheduleDoc, schedulePayload);
  }, [activeProKey, workingDays, workStartHour, workEndHour, lunchBreakEnabled, blockedPeriods]);

  useEffect(() => {
    try {
      localStorage.setItem('belladoor_v2_reviews', JSON.stringify(proReviews));
    } catch {}
    if (!cloudHydratedRef.current['reviews']) return;
    if (applyingRemoteRef.current['reviews']) {
      applyingRemoteRef.current['reviews'] = false;
      return;
    }
    syncDocumentToFirestore('reviews', { items: proReviews });
  }, [proReviews]);

  useEffect(() => {
    if (!activeProKey) return;
    try {
      localStorage.setItem(
        `belladoor_v2_subscription_${activeProKey}`,
        JSON.stringify({ status: subscriptionStatus, interval: planInterval })
      );
    } catch {}
  }, [activeProKey, subscriptionStatus, planInterval]);

  // =========================================================================
  // PASSO 2: LINK DIRETO DA VITRINE (?pro=ana-silva-nails) + COMPARTILHAMENTO / QR CODE
  // =========================================================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSlug = params.get('pro')?.trim().toLowerCase();
    let storedSlug: string | null = null;
    try {
      if (urlSlug) {
        sessionStorage.setItem('belladoor_v2_direct_pro_slug', urlSlug);
      }
      storedSlug = sessionStorage.getItem('belladoor_v2_direct_pro_slug')?.trim().toLowerCase() || null;
    } catch {}

    const targetSlug = urlSlug || storedSlug;
    if (!targetSlug) return;

    const matchedActive = allProfessionalsWithLivePro.find(
      (p) => p.slug && p.slug.toLowerCase() === targetSlug
    );
    const matchedDirectory = Object.values(directoryPros).find(
      (p) => p && p.slug && p.slug.toLowerCase() === targetSlug
    );
    const targetPro =
      matchedActive ||
      matchedDirectory ||
      (myCustomProProfile.slug?.toLowerCase() === targetSlug ? myCustomProProfile : null);

    if (targetPro) {
      // Se for a conta de gestão do Everton e o visitante não for o próprio Everton, bloqueia a exibição pública
      if (isEvertonProEntity(targetPro) && !isEvertonAccount) {
        setSelectedPro(null);
        setActiveTab('client');
        setClientSubView('EXPLORE');
        return;
      }
      setSelectedPro(targetPro);
    }
    setActiveTab('client');
    setClientSubView('EXPLORE');
    setAuthRole('CLIENT');
  }, [directoryPros, currentUser]);

  // Atualiza o título da aba do navegador dinamicamente quando uma vitrine de profissional está aberta
  useEffect(() => {
    if (isVitrinePreviewOpen) {
      document.title = `Prévia da Vitrine — ${proDisplayName.trim() || 'BellaDoor'}`;
    } else if (activeTab === 'client' && selectedPro && selectedPro.name && selectedPro.name.trim()) {
      document.title = `${selectedPro.name.trim()} — Agendamento Online | BellaDoor`;
    } else {
      document.title = 'BellaDoor — A beleza que bate à sua porta';
    }
  }, [activeTab, selectedPro, isVitrinePreviewOpen, proDisplayName]);

  // Guarda de consistência de sessão: garante que a tela sempre corresponda ao tipo de conta logada
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'CLIENT' && activeTab === 'pro') {
        setActiveTab('client');
        setClientSubView('EXPLORE');
      }
    } else {
      if (activeTab === 'pro') {
        setActiveTab('client');
        setClientSubView('EXPLORE');
      }
    }
  }, [currentUser, activeTab]);

  const getDirectVitrineUrl = () => {
    if (typeof window === 'undefined') return `http://localhost:3000/?pro=${myCustomProProfile.slug}`;
    const basePath = window.location.pathname.endsWith('/')
      ? window.location.pathname
      : `${window.location.pathname}/`;
    return `${window.location.origin}${basePath}?pro=${myCustomProProfile.slug}`;
  };

  const handleCopyVitrineLink = async () => {
    const url = getDirectVitrineUrl();
    try {
      await navigator.clipboard.writeText(url);
      showProSuccess('🔗 Link exclusivo da sua Vitrine copiado! Cole no Instagram ou WhatsApp.');
    } catch {
      setUiDialog({
        emoji: '🔗',
        badge: 'Seu Link Exclusivo',
        title: 'Copie o Link da Sua Vitrine',
        message: proBusinessNiche === 'BARBERSHOP'
          ? 'Envie este link direto para seus clientes ou coloque na Bio do seu Instagram:'
          : 'Envie este link direto para clientes ou coloque na Bio do seu Instagram:',
        highlight: url,
        buttonText: 'Pronto!',
        variant: proBusinessNiche === 'BARBERSHOP' ? 'amber' : 'rose',
      });
    }
  };

  const handleShareVitrineWhatsApp = () => {
    const url = getDirectVitrineUrl();
    const isBarber = proBusinessNiche === 'BARBERSHOP';
    const text = encodeURIComponent(
      isBarber
        ? `Fala, irmão! Beleza? 💈 Pra agilizar seu agendamento e você não perder tempo no WhatsApp, agora dá pra ver meus horários livres, tabela de serviços e marcar seu horário direto no meu link:\n\n👉 ${url} ✂️🔥`
        : proBusinessNiche === 'NEUTRAL'
        ? `Olá! Para facilitar seu agendamento, consultar horários livres e tabela de valores, acesse meu link de atendimento online:\n\n👉 ${url}`
        : `Olá! ✨ Agora você pode ver meu portfólio de trabalhos, valores e agendar seu atendimento direto pela minha vitrine online no *BellaDoor*:\n\n👉 ${url}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  // Data e hora reais do dispositivo para os calendários da cliente e da profissional
  const todayLocalDateObj = new Date(nowMs);
  const currentRealYear = todayLocalDateObj.getFullYear();
  const currentRealMonth = todayLocalDateObj.getMonth();
  const todayIsoDateStr = `${currentRealYear}-${String(currentRealMonth + 1).padStart(2, '0')}-${String(
    todayLocalDateObj.getDate()
  ).padStart(2, '0')}`;
  const currentRealHour = todayLocalDateObj.getHours();

  // Estado para novo bloqueio de período no Painel da Profissional
  const [newBlockStartDate, setNewBlockStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [newBlockEndDate, setNewBlockEndDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [newBlockReason, setNewBlockReason] = useState<string>('Férias & Descanso');
  const [proCalendarYear, setProCalendarYear] = useState<number>(() => new Date().getFullYear());
  const [proCalendarMonth, setProCalendarMonth] = useState<number>(() => new Date().getMonth());
  const [rangeSelectStep, setRangeSelectStep] = useState<'START' | 'END'>('START');

  // Alternador de dias de atendimento padrão (no rascunho até confirmar)
  const toggleWorkingDay = (dayIndex: number) => {
    if (draftWorkingDays.includes(dayIndex)) {
      if (draftWorkingDays.length === 1) {
        setUiDialog({
          emoji: '⚠️',
          badge: 'Rotina Semanal',
          title: 'Mantenha ao menos 1 dia ativo',
          message:
            'Para que sua vitrine continue recebendo agendamentos, você precisa manter pelo menos 1 dia de atendimento ativo na semana.',
          buttonText: 'Entendi',
          variant: 'warning',
        });
        return;
      }
      setDraftWorkingDays(draftWorkingDays.filter((d) => d !== dayIndex));
    } else {
      setDraftWorkingDays([...draftWorkingDays, dayIndex].sort());
    }
  };

  // Clique interativo no calendário da profissional para marcar período
  const handleProCalendarDateClick = (dateStr: string) => {
    if (rangeSelectStep === 'START') {
      setNewBlockStartDate(dateStr);
      setNewBlockEndDate(dateStr);
      setRangeSelectStep('END');
    } else {
      if (dateStr >= newBlockStartDate) {
        setNewBlockEndDate(dateStr);
      } else {
        setNewBlockStartDate(dateStr);
        setNewBlockEndDate(dateStr);
      }
      setRangeSelectStep('START');
    }
  };

  // Estados do Agendamento da Cliente
  const [selectedService, setSelectedService] = useState<MockService | null>(null);
  const [selectedLocationType, setSelectedLocationType] = useState<'DOMICILIO' | 'STUDIO'>('DOMICILIO');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1);
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);
  const [lastBooking, setLastBooking] = useState<ClientAppointment | null>(null);

  // Sincroniza a modalidade de agendamento selecionada com a modalidade suportada pela profissional
  useEffect(() => {
    if (pro.serviceMode === 'STUDIO') {
      setSelectedLocationType('STUDIO');
      setTravelFee(0);
      setIsNeighborhoodCovered(true);
    } else if (pro.serviceMode === 'DOMICILIO') {
      setSelectedLocationType('DOMICILIO');
    }
  }, [pro.serviceMode, pro.id]);

  // Navegação de Meses no Calendário (inicia sempre no mês e ano reais de hoje)
  const [calendarYear, setCalendarYear] = useState<number>(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(() => new Date().getMonth());

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    if (
      calendarYear < currentRealYear ||
      (calendarYear === currentRealYear && calendarMonth <= currentRealMonth)
    ) {
      return;
    }
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const handleProPrevMonth = () => {
    if (
      proCalendarYear < currentRealYear ||
      (proCalendarYear === currentRealYear && proCalendarMonth <= currentRealMonth)
    ) {
      return;
    }
    if (proCalendarMonth === 0) {
      setProCalendarMonth(11);
      setProCalendarYear(proCalendarYear - 1);
    } else {
      setProCalendarMonth(proCalendarMonth - 1);
    }
  };

  const handleProNextMonth = () => {
    if (proCalendarMonth === 11) {
      setProCalendarMonth(0);
      setProCalendarYear(proCalendarYear + 1);
    } else {
      setProCalendarMonth(proCalendarMonth + 1);
    }
  };

  // Estados do Endereço & CEP
  const [cep, setCep] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [travelFee, setTravelFee] = useState<number>(0);
  const [isNeighborhoodCovered, setIsNeighborhoodCovered] = useState<boolean | null>(null);

  // Dados Pessoais da Cliente
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Auto-Fill Inteligente: Pré-preenche Nome Completo da cliente logada + último WhatsApp/CEP/Endereço usados
  const clientAutoFillStorageKey = currentUser?.email
    ? `belladoor_v2_client_autofill_${currentUser.email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    : 'belladoor_v2_client_autofill_guest';

  useEffect(() => {
    try {
      const rawSaved = localStorage.getItem(clientAutoFillStorageKey);
      const savedData = rawSaved ? JSON.parse(rawSaved) : null;

      const loggedRealName =
        currentUser?.fullName && currentUser.fullName !== 'Cliente Convidada'
          ? currentUser.fullName
          : '';

      if (savedData && typeof savedData === 'object') {
        if (savedData.clientName || loggedRealName) {
          setClientName(savedData.clientName || loggedRealName);
        }
        if (savedData.clientPhone) setClientPhone(savedData.clientPhone);
        if (savedData.cep) setCep(savedData.cep);
        if (savedData.street) setStreet(savedData.street);
        if (savedData.number) setNumber(savedData.number);
        if (savedData.complement) setComplement(savedData.complement);
        if (savedData.neighborhood) {
          setNeighborhood(savedData.neighborhood);
          // Recalcula automaticamente a taxa de deslocamento para a profissional selecionada
          const clientBairroLower = String(savedData.neighborhood).toLowerCase();
          const cleanSavedCep = String(savedData.cep || '').replace(/\D/g, '');
          const activeNeighborhoods = pro.neighborhoods || proNeighborhoodsList;
          const matchedArea = activeNeighborhoods.find(
            (n) =>
              (clientBairroLower &&
                (n.name.toLowerCase().includes(clientBairroLower) ||
                  clientBairroLower.includes(n.name.toLowerCase()))) ||
              (n.cep && cleanSavedCep && n.cep.replace(/\D/g, '') === cleanSavedCep)
          );
          if (matchedArea) {
            setTravelFee(matchedArea.travelFee);
            setIsNeighborhoodCovered(true);
          } else if (
            savedData.city &&
            pro.baseCity &&
            pro.baseCity.toLowerCase().includes(String(savedData.city).split('-')[0].toLowerCase())
          ) {
            setTravelFee(20);
            setIsNeighborhoodCovered(true);
          } else {
            setIsNeighborhoodCovered(false);
            setTravelFee(35);
          }
        }
        if (savedData.city) setCity(savedData.city);
      } else if (loggedRealName) {
        setClientName((prev) => prev || loggedRealName);
      }
    } catch {}
  }, [clientAutoFillStorageKey, selectedPro?.id]);

  // =========================================================================
  // PASSO 3: HORÁRIOS DINÂMICOS BASEADOS NO EXPEDIENTE, DURAÇÃO REAL + TRÂNSITO E AGENDAMENTOS
  // =========================================================================
  const availableSlots = (() => {
    const slots: { time: string; available: boolean; reason?: string }[] = [];
    const selectedDurationMin = Math.max(15, Number(selectedService?.durationMinutes) || 60);
    const bufferMin = Math.max(0, clientViewBufferTime);
    const activeServicesCatalog = pro.services || proServicesList;

    const proActiveAppsOnDate = selectedDate
      ? proAppointments.filter(
          (app) =>
            app.date === selectedDate &&
            app.status !== 'Cancelado' &&
            ((app.proId && app.proId === pro.id) ||
              (app.proSlug && pro.slug && app.proSlug.toLowerCase() === pro.slug.toLowerCase()))
        )
      : [];

    for (let h = clientViewWorkStartHour; h < clientViewWorkEndHour; h++) {
      if (clientViewLunchBreakEnabled && h === 12) {
        continue; // Pausa para almoço (12:00 às 13:00)
      }
      const timeLabel = `${String(h).padStart(2, '0')}:00`;
      const slotStartMin = h * 60;
      const slotServiceEndMin = slotStartMin + selectedDurationMin;
      const slotOccupiedEndMin = slotServiceEndMin + bufferMin;

      // Verifica colisão de janela de tempo (duração do serviço + margem de deslocamento) com agendamentos existentes
      const hasTimeOverlap = proActiveAppsOnDate.some((app) => {
        const [appH, appM] = (app.time || '00:00').split(':').map((n) => Number(n) || 0);
        const appStartMin = appH * 60 + appM;
        const matchedSvc = activeServicesCatalog.find(
          (s) => s.name.trim().toLowerCase() === (app.serviceName || '').trim().toLowerCase()
        );
        const appDurationMin =
          typeof app.durationMinutes === 'number' && app.durationMinutes > 0
            ? app.durationMinutes
            : matchedSvc?.durationMinutes || 60;
        const appServiceEndMin = appStartMin + appDurationMin;

        // Regra de Trânsito Inteligente do BellaDoor:
        // Studio -> Studio: 0 min de trânsito (ambos no mesmo endereço fixo).
        // Studio -> Domicílio, Domicílio -> Studio ou Domicílio -> Domicílio: bloqueia bufferTimeMinutes de trânsito.
        const appLocation = app.locationType || 'DOMICILIO';
        const isBothStudio = appLocation === 'STUDIO' && selectedLocationType === 'STUDIO';
        const transitBufferMin = isBothStudio ? 0 : bufferMin;

        return (
          slotStartMin < appServiceEndMin + transitBufferMin &&
          slotServiceEndMin + transitBufferMin > appStartMin
        );
      });

      // Evita que um serviço longo (ex: 120min) seja iniciado no último horário ultrapassando o fim do expediente
      const exceedsWorkdayEnd =
        h > clientViewWorkStartHour && slotServiceEndMin > clientViewWorkEndHour * 60;

      // Bloqueia horários já encerrados quando a cliente seleciona o dia de hoje
      const isPastHourToday = selectedDate === todayIsoDateStr && h <= currentRealHour;

      slots.push({
        time: timeLabel,
        available: !hasTimeOverlap && !exceedsWorkdayEnd && !isPastHourToday,
        reason: hasTimeOverlap
          ? 'Conflito com outro atendimento / tempo de deslocamento'
          : exceedsWorkdayEnd
          ? `A duração deste serviço (${selectedDurationMin}min) ultrapassa o fim do expediente (${String(clientViewWorkEndHour).padStart(2, '0')}:00)`
          : isPastHourToday
          ? 'Horário já encerrado hoje'
          : undefined,
      });
    }
    return slots;
  })();

  const effectiveTravelFee = selectedLocationType === 'STUDIO' ? 0 : travelFee;
  const totalAmount = (selectedService?.price || 0) + effectiveTravelFee;

  // Função para buscar CEP na API pública ViaCEP
  const handleCepLookup = async (cepInput: string) => {
    const cleanCep = cepInput.replace(/\D/g, '');
    setCep(cepInput);

    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      setCepError(null);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();

        if (data.erro) {
          setCepError('CEP não encontrado. Verifique o número digitado.');
          setIsNeighborhoodCovered(null);
          return;
        }

        setStreet(data.logradouro || '');
        setNeighborhood(data.bairro || '');
        const clientCityUf =
          data.localidade && data.uf ? `${data.localidade}-${data.uf}` : data.localidade || '';
        setCity(clientCityUf);

        const clientBairroLower = (data.bairro || '').toLowerCase();
        const activeNeighborhoods = pro.neighborhoods || proNeighborhoodsList;
        const matchedArea = activeNeighborhoods.find(
          (n) =>
            (clientBairroLower &&
              (n.name.toLowerCase().includes(clientBairroLower) ||
                clientBairroLower.includes(n.name.toLowerCase()))) ||
            (n.cep && n.cep.replace(/\D/g, '') === cleanCep)
        );

        if (matchedArea) {
          setTravelFee(matchedArea.travelFee);
          setIsNeighborhoodCovered(true);
        } else if (
          data.localidade &&
          pro.baseCity &&
          pro.baseCity.toLowerCase().includes(data.localidade.toLowerCase())
        ) {
          setTravelFee(20);
          setIsNeighborhoodCovered(true);
        } else {
          setIsNeighborhoodCovered(false);
          setTravelFee(35);
        }
      } catch (err) {
        setCepError('Não foi possível consultar o CEP no momento.');
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  // Confirmação do Agendamento
  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();

    // Trava de Segurança: bloqueia qualquer tentativa de autoagendamento da profissional para si mesma
    if (
      currentUser?.role === 'PROFESSIONAL' &&
      (isViewingOwnProVitrine ||
        isVitrinePreviewOpen ||
        pro.id === myCustomProProfile.id ||
        pro.id === myProId ||
        (currentUser.id &&
          (pro.id === currentUser.id ||
            pro.id === `pro-${currentUser.id}` ||
            (pro as any).userId === currentUser.id)) ||
        (pro.slug && dynamicSlug && pro.slug.toLowerCase() === dynamicSlug.toLowerCase()) ||
        (currentUser.email &&
          (pro as any).email &&
          (pro as any).email.toLowerCase() === currentUser.email.toLowerCase()))
    ) {
      setUiDialog({
        emoji: '🚫',
        badge: 'Autoagendamento Não Permitido',
        title: 'Você não pode agendar para você mesma',
        message:
          'Profissionais não podem realizar agendamentos em sua própria vitrine. Para cadastrar um agendamento na sua agenda, acesse seu Painel Pro e clique em "Novo Agendamento".',
        buttonText: 'Entendido',
        variant: 'rose',
      });
      return;
    }

    if (selectedLocationType === 'STUDIO') {
      if (!clientName.trim() || !clientPhone.trim()) {
        setUiDialog({
          emoji: '📝',
          badge: 'Dados Incompletos',
          title: 'Preencha seus dados de contato',
          message:
            'Para confirmar seu atendimento no Studio, informe seu nome completo e seu WhatsApp.',
          buttonText: 'Revisar Dados',
          variant: 'rose',
        });
        return;
      }
    } else {
      if (!clientName || !clientPhone || !street || !number || !neighborhood) {
        setUiDialog({
          emoji: '📝',
          badge: 'Dados Incompletos',
          title: 'Preencha os campos obrigatórios',
          message:
            'Para confirmar seu atendimento a domicílio, informe seu nome completo, WhatsApp e o endereço com número.',
          buttonText: 'Revisar Dados',
          variant: 'rose',
        });
        return;
      }
    }

    // Salva os dados para preenchimento automático (Auto-Fill) nos próximos agendamentos da cliente
    try {
      localStorage.setItem(
        clientAutoFillStorageKey,
        JSON.stringify({
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          cep: cep.trim(),
          street: street.trim(),
          number: number.trim(),
          complement: complement.trim(),
          neighborhood: neighborhood.trim(),
          city: city.trim(),
        })
      );
    } catch {}

    const studioFullAddress =
      [pro.baseAddress, pro.baseNeighborhood, pro.baseCity].filter(Boolean).join(', ') ||
      pro.studioName ||
      'Studio / Atelier da Profissional';

    const appointmentAddress =
      selectedLocationType === 'STUDIO'
        ? studioFullAddress
        : `${street}, ${number}${complement ? ` - ${complement}` : ''}`;

    const appointmentNeighborhood =
      selectedLocationType === 'STUDIO'
        ? pro.studioName ? `${pro.studioName} (Studio)` : (pro.baseNeighborhood || 'Studio')
        : neighborhood;

    const appointmentTravelFee = selectedLocationType === 'STUDIO' ? 0 : travelFee;
    const appointmentTotalPrice = (selectedService?.price || 0) + appointmentTravelFee;

    // Validação de segurança anti-dupla reserva em tempo real:
    // Impede que duas pessoas reservem o mesmo horário simultaneamente
    const isSlotStillAvailable = availableSlots.some((s) => s.time === selectedTime && s.available);
    if (!isSlotStillAvailable) {
      setUiDialog({
        emoji: '⚠️',
        badge: 'Horário Indisponível',
        title: 'Horário já reservado!',
        message: `O horário das ${selectedTime} no dia ${selectedDate.split('-').reverse().join('/')} acabou de ser preenchido ou está em conflito com outro atendimento. Por favor, escolha outro horário livre.`,
        buttonText: 'Escolher Outro Horário',
        variant: 'amber',
      });
      setSelectedTime(null);
      setStep(2);
      return;
    }

    const resolvedProEmail =
      (pro as any).email ||
      (pro.id && pro.id.startsWith('pro-') && pro.id.includes('@') ? pro.id.replace('pro-', '') : undefined) ||
      (activeProKey && activeProKey.includes('_') ? activeProKey.replace(/_/g, '.') : undefined) ||
      (currentUser?.role === 'PROFESSIONAL' ? currentUser.email : undefined);

    const effectiveRules = getEffectiveBookingRules(
      pro.bookingRules || (isViewingOwnProVitrine ? bookingRules : null),
      pro
    );
    const depositCalc = calculateDeposit(appointmentTotalPrice, effectiveRules);

    const newAppointment: ClientAppointment = {
      id: `app-${Date.now()}`,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: currentUser?.email?.toLowerCase() || undefined,
      clientId: currentUser?.id || undefined,
      serviceName: selectedService?.name || 'Atendimento',
      durationMinutes: selectedService?.durationMinutes || 60,
      date: selectedDate,
      time: selectedTime || '14:00',
      address: appointmentAddress,
      neighborhood: appointmentNeighborhood,
      travelFee: appointmentTravelFee,
      totalPrice: appointmentTotalPrice,
      status: 'Confirmado',
      locationType: selectedLocationType,
      locationAddress: appointmentAddress,
      proId: pro.id || myProId,
      proEmail: resolvedProEmail,
      proName: pro.name || proDisplayName,
      proSlug: pro.slug || dynamicSlug,
      proAvatarUrl: pro.avatarUrl,
      proWhatsapp: pro.whatsapp,
      reviewed: false,
      depositAmount: depositCalc.depositAmount,
      depositPercentage: depositCalc.depositPercentage,
      depositPaid: false,
    };

    // Grava de forma atômica no Cloud Firestore imediatamente
    appendAppointmentToFirestore(newAppointment);

    setProAppointments((prev) => [newAppointment, ...prev.filter((a) => a.id !== newAppointment.id)]);
    try {
      const currentSaved = loadFromStorage<ClientAppointment[]>('belladoor_v2_appointments', []);
      localStorage.setItem(
        'belladoor_v2_appointments',
        JSON.stringify([newAppointment, ...currentSaved.filter((a) => a.id !== newAppointment.id)])
      );
    } catch {}

    setLastBooking(newAppointment);
    setBookingConfirmed(true);
  };

  // =========================================================================
  // PASSO 4: GERENCIAMENTO DE AGENDAMENTOS DA CLIENTE & AVALIAÇÕES (⭐)
  // =========================================================================
  const isAppointmentOwnedByClient = (app: ClientAppointment) => {
    if (!currentUser) return false;
    if (app.clientId && currentUser.id) {
      return app.clientId === currentUser.id;
    }
    if (app.clientEmail && currentUser.email) {
      return app.clientEmail.toLowerCase() === currentUser.email.toLowerCase();
    }
    if (!app.clientId && !app.clientEmail) {
      return true;
    }
    return false;
  };

  const clientOwnAppointments = proAppointments.filter(isAppointmentOwnedByClient);
  const pendingCompletedAppointmentForClient = clientOwnAppointments.find(
    (a) =>
      a.status === 'Concluído' &&
      !a.reviewed &&
      ((a.proId && a.proId === pro.id) || (a.proSlug && a.proSlug === pro.slug))
  );

  const handleCancelClientAppointment = (appointmentId: string, serviceName: string) => {
    setProAppointments((prev) => {
      const updated = prev.map((app) => (app.id === appointmentId ? { ...app, status: 'Cancelado' } : app));
      try {
        localStorage.setItem('belladoor_v2_appointments', JSON.stringify(updated));
      } catch {}
      syncDocumentToFirestore('appointments', { items: updated });
      return updated;
    });
    setUiDialog({
      emoji: '🗓️',
      badge: 'Agendamento Cancelado',
      title: 'Horário Liberado com Sucesso',
      message: `O agendamento de "${serviceName}" foi cancelado e o horário já foi liberado novamente na agenda da profissional.`,
      buttonText: 'Entendi',
      variant: 'warning',
    });
  };

  const handleOpenReviewForAppointment = (app: ClientAppointment) => {
    if (!isAppointmentOwnedByClient(app)) {
      setUiDialog({
        emoji: '🔒',
        badge: 'Acesso Restrito',
        title: 'Avaliação exclusiva para o(a) cliente',
        message: 'Somente quem realizou este agendamento pode avaliar o atendimento.',
        buttonText: 'Entendi',
        variant: 'warning',
      });
      return;
    }

    if (app.status !== 'Concluído') {
      setUiDialog({
        emoji: '⏳',
        badge: 'Atendimento Pendente',
        title: 'Avaliação liberada após conclusão',
        message:
          pro.businessNiche === 'BARBERSHOP'
            ? 'A avaliação só fica liberada depois que o barbeiro marcar este atendimento como "Concluído" no painel dele.'
            : 'A avaliação só fica liberada depois que o atendimento for marcado como "Concluído" no painel.',
        buttonText: 'Entendi',
        variant: 'warning',
      });
      return;
    }

    if (app.reviewed) {
      setUiDialog({
        emoji: '✅',
        badge: 'Já Avaliado',
        title: 'Atendimento já foi avaliado',
        message: 'Você já enviou sua avaliação verificada para este atendimento concluído.',
        buttonText: 'Fechar',
        variant: 'success',
      });
      return;
    }

    setReviewAppointmentId(app.id);
    setReviewClientName(app.clientName);
    setReviewServiceName(app.serviceName);
    setReviewRating(5);
    setReviewComment('');
    setShowReviewForm(true);
  };

  const handleSubmitClientReview = (e: React.FormEvent) => {
    e.preventDefault();

    const targetApp = proAppointments.find((a) => a.id === reviewAppointmentId);
    if (!targetApp || !isAppointmentOwnedByClient(targetApp) || targetApp.status !== 'Concluído' || targetApp.reviewed) {
      setUiDialog({
        emoji: '🔒',
        badge: 'Avaliação Protegida',
        title: 'Atendimento Concluído Necessário',
        message:
          pro.businessNiche === 'BARBERSHOP'
            ? 'Para garantir avaliações 100% reais, somente quem contratou o serviço pode avaliar após o barbeiro marcar o agendamento como "Concluído".'
            : 'Para garantir avaliações 100% reais, somente quem contratou o serviço pode avaliar após o agendamento ser marcado como "Concluído".',
        buttonText: 'Entendi',
        variant: 'warning',
      });
      setShowReviewForm(false);
      return;
    }

    if (!reviewComment.trim()) {
      setUiDialog({
        emoji: pro.businessNiche === 'BARBERSHOP' ? '💈' : '⭐',
        badge: 'Avaliação',
        title: 'Escreva um breve comentário',
        message:
          pro.businessNiche === 'BARBERSHOP'
            ? 'Conte como foi sua experiência para fortalecer a barbearia e ajudar outros clientes!'
            : 'Conte como foi sua experiência com o atendimento para ajudar outros clientes!',
        buttonText: 'Voltar',
        variant: pro.businessNiche === 'BARBERSHOP' ? 'amber' : 'rose',
      });
      return;
    }

    const todayStr = new Date().toLocaleDateString('pt-BR');
    const newReview: ClientReview = {
      id: `rev-${Date.now()}`,
      appointmentId: targetApp.id,
      proId: targetApp.proId || pro.id,
      proSlug: targetApp.proSlug || pro.slug,
      clientName: targetApp.clientName || currentUser?.fullName || 'Cliente Verificado',
      serviceName: targetApp.serviceName || (pro.businessNiche === 'BARBERSHOP' ? 'Corte / Barba' : 'Atendimento a Domicílio'),
      rating: reviewRating,
      comment: reviewComment.trim(),
      date: todayStr,
    };

    setProReviews((prev) => [newReview, ...prev]);
    setProAppointments((prev) =>
      prev.map((a) => (a.id === targetApp.id ? { ...a, reviewed: true, status: 'Concluído' } : a))
    );

    setShowReviewForm(false);
    setReviewAppointmentId(null);
    setReviewComment('');

    setUiDialog({
      emoji: pro.businessNiche === 'BARBERSHOP' ? '💈' : '💖',
      badge: 'Avaliação Publicada',
      title: pro.businessNiche === 'BARBERSHOP' ? 'Valeu pela Avaliação!' : 'Obrigada pelo seu Carinho!',
      message:
        pro.businessNiche === 'BARBERSHOP'
          ? 'Sua avaliação já está publicada na vitrine do barbeiro e fortaleceu o perfil!'
          : 'Sua avaliação com estrelas já está publicada na vitrine e atualizou a nota média.',
      highlight: `${'⭐'.repeat(newReview.rating)} "${newReview.comment}"`,
      buttonText: 'Fechar',
      variant: 'success',
    });
  };

  // Gera o link direto para o WhatsApp da Profissional com a mensagem pré-formatada da CLIENTE para a PROFISSIONAL
  const getWhatsAppBookingLink = () => {
    if (!lastBooking) return '#';
    const effectiveRules = getEffectiveBookingRules(
      pro.bookingRules || (isViewingOwnProVitrine ? bookingRules : null),
      pro
    );
    const message = formatClientToProMessage({
      settings: effectiveRules,
      booking: lastBooking,
      proName: pro.name || proDisplayName,
      isBarbershop: pro.businessNiche === 'BARBERSHOP',
    });
    return buildWhatsAppLink(pro.whatsapp, message);
  };

  const resetBooking = (clearPersonalData?: boolean | React.SyntheticEvent) => {
    setSelectedService(null);
    setSelectedTime(null);
    setBookingConfirmed(false);
    setLastBooking(null);
    setStep(1);
    if (pro.serviceMode === 'STUDIO') {
      setSelectedLocationType('STUDIO');
      setTravelFee(0);
      setIsNeighborhoodCovered(true);
    } else {
      setSelectedLocationType('DOMICILIO');
    }
    if (clearPersonalData === true) {
      setCep('');
      setStreet('');
      setNumber('');
      setComplement('');
      setNeighborhood('');
      setCity('');
      setTravelFee(0);
      setIsNeighborhoodCovered(null);
      setClientName('');
      setClientPhone('');
    }
  };

  const handleOpenVitrinePreview = () => {
    if (isProTrialExpired) {
      showExpiredTrialLockDialog();
      return;
    }
    setIsVitrinePreviewOpen(true);
    setSelectedPro(myCustomProProfile);
  };

  const handleExitVitrinePreview = () => {
    setIsVitrinePreviewOpen(false);
    setSelectedPro(null);
    resetBooking();
    setActiveTab('pro');
  };

  const handleEnterClientMode = () => {
    setIsVitrinePreviewOpen(false);
    setSelectedPro(null);
    resetBooking();
    setClientSubView('EXPLORE');
    setActiveTab('client');
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-stone-100 flex flex-col items-center">
      {/* BARRA SUPERIOR DO BELLADOOR (COMPONENTE MODULAR) */}
      <HeaderBar
        currentUser={currentUser}
        activeTab={activeTab}
        clientSubView={clientSubView}
        showAdminPanel={showAdminPanel}
        isProTrialExpired={isProTrialExpired}
        isProVitrinePreview={isVitrinePreviewOpen}
        activeAppointmentsCount={clientOwnAppointments.filter((a) => a.status === 'Confirmado').length}
        proDisplayName={proDisplayName}
        proAvatarUrl={proAvatarUrl}
        onToggleClientSubView={() =>
          setClientSubView(clientSubView === 'MY_BOOKINGS' ? 'EXPLORE' : 'MY_BOOKINGS')
        }
        onEnterClientMode={handleEnterClientMode}
        onExitVitrinePreview={handleExitVitrinePreview}
        onToggleProPreview={handleOpenVitrinePreview}
        onToggleAdminPanel={() => setShowAdminPanel((prev) => !prev)}
        onLogout={handleLogout}
      />

      {/* CONTEÚDO PRINCIPAL COM LARGURA RESPONSIVA EXPANDIDA PARA PC DESKTOP */}
      <main className={`w-full py-6 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
        !currentUser
          ? 'max-w-md sm:max-w-xl mx-auto'
          : isVitrinePreviewOpen
          ? 'max-w-md sm:max-w-xl lg:max-w-6xl xl:max-w-7xl mx-auto'
          : activeTab === 'client' && !selectedPro
          ? 'max-w-md sm:max-w-xl lg:max-w-7xl mx-auto'
          : activeTab === 'client' && selectedPro
          ? 'max-w-md sm:max-w-xl lg:max-w-6xl xl:max-w-7xl mx-auto'
          : activeTab === 'pro'
          ? 'max-w-md sm:max-w-xl lg:max-w-5xl xl:max-w-6xl mx-auto'
          : 'max-w-md sm:max-w-xl lg:max-w-5xl mx-auto'
      }`}>
        {/* BANNER INFORMATIVO: PROFISSIONAL NAVEGANDO EM MODO CLIENTE */}
        {currentUser && currentUser.role === 'PROFESSIONAL' && activeTab === 'client' && !isVitrinePreviewOpen && (
          <div className="mb-4 bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 border border-rose-200 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0 font-extrabold text-sm">
                🛍️
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-rose-950 truncate">
                  Modo Cliente Ativo ({proDisplayName.trim() || currentUser.fullName})
                </p>
                <p className="text-[11px] text-rose-800 truncate">
                  Você está navegando como cliente. Pode agendar serviços com outras profissionais ou consultar seus agendamentos.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('pro');
                setClientSubView('EXPLORE');
                setSelectedPro(null);
                resetBooking();
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
            >
              ← Voltar ao Painel Pro
            </button>
          </div>
        )}

        {/* BARRA DE ACESSO RÁPIDO DO ADMINISTRADOR MASTER (EVERTON) */}
        {currentUser && isMasterAdminAccount && !showAdminPanel && (
          <div className="mb-4 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 border border-amber-500/40 rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0 text-base">
                🛡️
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                  Acesso Master Admin • Everton
                </p>
                <p className="text-xs font-bold text-white truncate">
                  Usuários, Cupons de Desconto e Mercado Pago
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAdminPanel(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs shadow-sm transition cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <span>Painel Admin</span>
              <span>→</span>
            </button>
          </div>
        )}

        {!currentUser ? (
          /* ============================================================ */
          /* 0. TELA INICIAL: LOGIN & CADASTRO (COMPONENTE MODULAR)       */
          /* ============================================================ */
          <div className="space-y-3">
            {selectedPro && selectedPro.name && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
                <img
                  src={selectedPro.avatarUrl}
                  alt={selectedPro.name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow-xs shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700">
                    Vitrine Exclusiva • Acesso Seguro
                  </p>
                  <p className="text-xs font-extrabold text-stone-900 truncate">
                    {selectedPro.name}
                  </p>
                  <p className="text-[11px] text-stone-600 leading-snug">
                    Faça login ou crie sua conta gratuita para visualizar a vitrine e agendar seu atendimento.
                  </p>
                </div>
              </div>
            )}
            <AuthView
              authMode={authMode}
              authRole={authRole}
              authName={authName}
              authBirthDate={authBirthDate}
              authCpf={authCpf}
              authEmail={authEmail}
              authPassword={authPassword}
              authConfirmPassword={authConfirmPassword}
              termsAccepted={termsAccepted}
              privacyAccepted={privacyAccepted}
              onChangeTermsAccepted={setTermsAccepted}
              onChangePrivacyAccepted={setPrivacyAccepted}
              lgpdAccepted={termsAccepted && privacyAccepted}
              authLoading={authLoading}
              authError={authError}
              pendingVerificationEmail={pendingVerificationEmail}
              verificationFeedback={verificationFeedback}
              resendCooldown={resendCooldown}
              onSelectRole={(role) => {
                setAuthRole(role);
                setRoleExplicitlyChosen(true);
              }}
              onChangeMode={(mode) => {
                setAuthMode(mode);
                setAuthError(null);
                setVerificationFeedback(null);
              }}
              onChangeName={setAuthName}
              onChangeBirthDate={setAuthBirthDate}
              onChangeCpf={setAuthCpf}
              onChangeEmail={setAuthEmail}
              onChangePassword={setAuthPassword}
              onChangeConfirmPassword={setAuthConfirmPassword}
              onChangeLgpdAccepted={setLgpdAccepted}
              onOpenLgpdModal={(tab) => setLgpdModalState({ open: true, tab })}
              onGoogleAuth={handleGoogleAuth}
              onEmailAuthSubmit={handleEmailAuthSubmit}
              onVerifyEmailCheck={handleVerifyEmailCheck}
              onResendVerificationEmail={handleResendVerificationEmail}
              onCancelVerification={handleCancelVerification}
            />
          </div>
        ) : showAdminPanel && isMasterAdminAccount ? (
          /* ============================================================ */
          /* PAINEL EXCLUSIVO DE ADMINISTRAÇÃO (EVERTON)                  */
          /* ============================================================ */
          <AdminUsersView
            currentUserEmail={currentUser.email || 'evertonrcsilva@gmail.com'}
            cloudAccounts={cloudAccounts}
            directoryPros={directoryPros}
            allAppointments={proAppointments}
            betaFeedbacks={betaFeedbacks}
            coupons={couponsList}
            mpConfig={mpConfig}
            subscriptionStatus={subscriptionStatus}
            onSaveUser={handleAdminSaveUser}
            onDeleteUser={handleAdminDeleteUser}
            onCreateCoupon={handleCreateCoupon}
            onDeleteCoupon={handleDeleteCoupon}
            onUpdateMpConfig={handleUpdateMpConfig}
            onToggleSimulationStatus={() => {
              const nextStatus = subscriptionStatus === 'ACTIVE' ? 'TRIAL' : 'ACTIVE';
              setSubscriptionStatus(nextStatus);
              try {
                localStorage.setItem(
                  'belladoor_v2_subscription',
                  JSON.stringify({ status: nextStatus, interval: planInterval })
                );
              } catch {}
              if (currentUser) {
                setCurrentUser({ ...currentUser, subscriptionStatus: nextStatus });
                if (currentUser.email) {
                  updateUserAccountInFirestore(currentUser.email, {
                    subscriptionStatus: nextStatus,
                  });
                }
              }
            }}
            onShowUiDialog={setUiDialog}
            onCloseAdmin={() => setShowAdminPanel(false)}
          />
        ) : isVitrinePreviewOpen || (activeTab === 'client' && selectedPro) ? (
          /* ========================================================== */
          /* B. PERFIL INDIVIDUAL DA PROFISSIONAL ESCOLHIDA (OU PRÉVIA)  */
          /* ========================================================== */
          <div className="space-y-3">
            {/* Barra Superior: Modo Prévia da Vitrine vs Autoagendamento vs Voltar para Busca */}
            {isVitrinePreviewOpen ? (
              <div className="bg-stone-900 text-white border border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-extrabold text-white">
                        Prévia da Sua Vitrine
                      </h2>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                        Somente Visualização
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 mt-0.5">
                      Visualização pública de como clientes enxergam seus serviços, fotos e valores. Interações de agendamento desativadas.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExitVitrinePreview}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-extrabold text-stone-900 bg-white hover:bg-stone-100 px-4 py-2 rounded-xl transition shadow-xs cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-rose-600" />
                  Voltar ao Painel Pro
                </button>
              </div>
            ) : isViewingOwnProVitrine ? (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 text-lg shrink-0">
                    🚫
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-amber-900">
                      Autoagendamento Não Permitido
                    </p>
                    <p className="text-xs text-amber-900 font-medium mt-0.5">
                      Você está visualizando a sua própria vitrine. Você não pode agendar serviços para você mesma. Escolha outra profissional na vitrine para agendar.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPro(null);
                      resetBooking();
                    }}
                    className="text-xs font-bold bg-white text-stone-800 hover:bg-stone-100 border border-stone-300 px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    🔍 Explorar Outras Profissionais
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetBooking();
                      setActiveTab('pro');
                    }}
                    className="text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
                  >
                    ← Painel Pro
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPro(null);
                    resetBooking();
                    try {
                      sessionStorage.removeItem('belladoor_v2_direct_pro_slug');
                      if (window.location.search) {
                        const cleanUrl = window.location.origin + window.location.pathname;
                        window.history.replaceState({}, document.title, cleanUrl);
                      }
                    } catch {}
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-white border border-stone-200 px-3.5 py-2 rounded-xl hover:bg-stone-50 transition shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-rose-600" />
                  Ver Todos os Profissionais
                </button>
                <span className="text-[11px] text-stone-400 font-medium">Perfil verificado BellaDoor</span>
              </div>
            )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* 1. PERFIL DO PROFISSIONAL (TOPO ESQUERDA NO DESKTOP, TOPO NO MOBILE) */}
                <div className={`col-span-1 lg:col-span-7 xl:col-span-8 rounded-3xl shadow-sm border overflow-hidden transition-colors ${proTheme.headerCardBg} ${proTheme.headerCardBorder}`}>
                  {/* Foto de Capa */}
                  <div className={`relative h-40 sm:h-52 lg:h-60 ${proTheme.coverBg}`}>
                    <img
                      src={pro.coverUrl}
                      alt="Capa"
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className={`absolute inset-0 ${proTheme.coverGradient}`} />
                  </div>

            {/* Cabeçalho do Perfil */}
            <div className="px-6 pt-0 pb-6 relative">
              <div className="flex justify-between items-end -mt-12 mb-4">
                <div className="relative">
                  <img
                    src={pro.avatarUrl}
                    alt={pro.name}
                    referrerPolicy="no-referrer"
                    className={`w-24 h-24 rounded-2xl object-cover border-4 ${proTheme.avatarRing}`}
                  />
                  <span
                    className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                      isProfessionalAccountExpired(pro) ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    title={
                      isProfessionalAccountExpired(pro)
                        ? 'Agenda temporariamente pausada'
                        : 'Disponível para agendamento'
                    }
                  />
                </div>
                {!isProfessionalAccountExpired(pro) && (
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {pro.instagram && (
                      <a
                        href={`https://instagram.com/${pro.instagram}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`p-2.5 rounded-xl text-xs flex items-center gap-1 font-medium transition ${
                          proTheme.isDark
                            ? 'bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        <Instagram className="w-4 h-4 text-pink-600" />
                        @{pro.instagram}
                      </a>
                    )}
                    {pro.whatsapp && (
                      <a
                        href={`https://wa.me/${pro.whatsapp}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs flex items-center gap-1 font-bold transition"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        WhatsApp
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/?pro=${pro.slug}`;
                        navigator.clipboard?.writeText(shareUrl);
                        const isBarber = pro.businessNiche === 'BARBERSHOP';
                        if (navigator.share) {
                          navigator
                            .share({
                              title: `${pro.name} — ${isBarber ? 'Barbearia & Cuidados' : 'Agendamento Online'} | BellaDoor`,
                              text: isBarber
                                ? `Fala, irmão! Dá uma olhada nos meus horários e tabela de serviços e agende seu horário direto pelo link: ${shareUrl}`
                                : `Confira o portfólio e agende seu atendimento com ${pro.name} pelo BellaDoor:`,
                              url: shareUrl,
                            })
                            .catch(() => {});
                        } else {
                          setUiDialog({
                            emoji: isBarber ? '💈' : '🔗',
                            badge: 'Link da Vitrine Copiado',
                            title: `Compartilhe a Vitrine de ${pro.name}!`,
                            message: isBarber
                              ? 'O link direto desta vitrine já foi copiado para a sua área de transferência. Envie para seus clientes e amigos no WhatsApp ou Instagram:'
                              : 'O link direto desta vitrine já foi copiado para a sua área de transferência. Envie para clientes e amigas no WhatsApp ou Instagram:',
                            highlight: shareUrl,
                            buttonText: 'Perfeito!',
                            variant: isBarber ? 'amber' : 'rose',
                          });
                        }
                      }}
                      className={`p-2.5 rounded-xl text-xs flex items-center gap-1 font-bold transition cursor-pointer ${proTheme.primaryBtnSecondary}`}
                      title="Compartilhar vitrine desta profissional"
                    >
                      <Share2 className="w-4 h-4" />
                      Indicar
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`text-xl font-bold ${proTheme.headerTitleText}`}>{pro.name}</h1>
                  {pro.isVerified ? (
                    <span
                      className="text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-emerald-600 text-white shadow-xs cursor-pointer"
                      title="Selo Oficial • Identidade e WhatsApp conferidos pela equipe BellaDoor"
                      onClick={() =>
                        setUiDialog({
                          emoji: '🛡️',
                          badge: 'Identidade Verificada',
                          title: 'Profissional com Identidade Verificada',
                          message: `${pro.name} enviou documento oficial de identificação e teve seus dados e canal de WhatsApp conferidos pela equipe BellaDoor. Mais segurança e tranquilidade para o seu atendimento em domicílio.`,
                          buttonText: 'Excelente!',
                          variant: 'success',
                        })
                      }
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Identidade Verificada
                    </span>
                  ) : null}
                </div>
                <p className={`text-xs mt-0.5 ${proTheme.headerSubText}`}>
                  {pro.title || (pro.businessNiche === 'BARBERSHOP' ? 'Barbeiro & Cuidados Masculinos' : 'Especialista em Beleza a Domicílio')}
                </p>
                <div className={`flex items-center gap-2 mt-2 text-xs ${proTheme.isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                  <span className="flex items-center gap-1 font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {pro.rating}
                  </span>
                  <span>•</span>
                  <span>{pro.reviewCount} avaliações</span>
                  <span>•</span>
                  <span className={`flex items-center gap-1 ${proTheme.isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    <MapPin className="w-3 h-3" /> {pro.baseNeighborhood}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  {(() => {
                    const isBarber = pro.businessNiche === 'BARBERSHOP';
                    const rawStudio = (pro.studioName || '').trim();

                    // Formata "Atende no/na [local]" com gênero correto
                    let localText = '';
                    if (isBarber) {
                      if (rawStudio) {
                        localText = rawStudio.toLowerCase().startsWith('barbearia')
                          ? `Atende na ${rawStudio}`
                          : `Atende na Barbearia ${rawStudio}`;
                      } else {
                        localText = 'Atende na Barbearia';
                      }
                    } else {
                      if (rawStudio) {
                        const lower = rawStudio.toLowerCase();
                        if (lower.startsWith('studio') || lower.startsWith('espaço') || lower.startsWith('salão')) {
                          localText = `Atende no ${rawStudio}`;
                        } else if (lower.startsWith('clínica') || lower.startsWith('sala')) {
                          localText = `Atende na ${rawStudio}`;
                        } else {
                          localText = `Atende no Studio ${rawStudio}`;
                        }
                      } else {
                        localText = 'Atende no Studio';
                      }
                    }

                    let badgeIcon = isBarber ? '💈' : '🏢';
                    let badgeText = '';

                    if (pro.serviceMode === 'STUDIO') {
                      badgeText = localText;
                    } else if (pro.serviceMode === 'DOMICILIO') {
                      badgeIcon = '🏡';
                      badgeText = isBarber ? 'Atende VIP a Domicílio' : 'Atende a Domicílio';
                    } else {
                      // Híbrido: atende no local fixo E VIP a domicílio
                      badgeText = `${localText} & VIP a Domicílio`;
                    }

                    return (
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs ${proTheme.accentBadge}`}
                      >
                        <span>{badgeIcon}</span>
                        <span>{badgeText}</span>
                      </span>
                    );
                  })()}
                </div>
                {pro.bio && (
                  <p className={`text-xs mt-3 leading-relaxed p-3 rounded-xl border whitespace-pre-line ${proTheme.headerBioBg} ${proTheme.headerBioText} ${proTheme.headerBioBorder}`}>
                    {pro.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

            {/* 2. CARTÃO DE AGENDAMENTO & SERVIÇOS (DIREITA STICKY NO DESKTOP, LOGO ABAIXO DO PERFIL NO MOBILE) */}
            <div className={`col-span-1 lg:col-span-5 xl:col-span-4 lg:row-span-4 lg:sticky lg:top-20 rounded-3xl shadow-sm border p-6 transition-colors ${proTheme.contentBg} ${proTheme.contentBorder}`}>
              {isViewingOwnProVitrine ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h2 className={`font-bold text-base flex items-center gap-2 ${proTheme.headerTitleText}`}>
                      <Sparkles className={`w-4 h-4 ${proTheme.primaryText}`} />
                      Tabela de Serviços ({(pro.services || proServicesList).length})
                    </h2>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Somente Visualização
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsVitrineServicesCollapsed(!isVitrineServicesCollapsed)}
                        className="p-1 sm:px-2.5 sm:py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-stone-200 select-none"
                        title={isVitrineServicesCollapsed ? 'Expandir serviços' : 'Recolher serviços'}
                      >
                        <span className="hidden sm:inline">{isVitrineServicesCollapsed ? 'Expandir' : 'Recolher'}</span>
                        {isVitrineServicesCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {!isVitrineServicesCollapsed && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {(pro.services || proServicesList).length === 0 ? (
                        <div className="bg-white rounded-2xl p-6 text-center border border-stone-200 text-stone-500 space-y-1">
                          <p className="text-xs font-bold text-stone-800">
                            Nenhum serviço cadastrado ainda
                          </p>
                          <p className="text-[11px]">
                            Cadastre seus serviços na aba &ldquo;Serviços &amp; Taxas&rdquo; do seu painel para que apareçam aqui.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {(pro.services || proServicesList).map((service) => (
                            <div
                              key={service.id}
                              className={`p-4 rounded-2xl border select-none transition ${proTheme.serviceCardBg} ${proTheme.serviceCardBorder}`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className={`font-bold text-sm ${proTheme.serviceTitleText}`}>{service.name}</h3>
                                    {service.popular && (
                                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                        Mais pedido
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-xs mt-1 leading-relaxed ${proTheme.isDark ? 'text-stone-300' : 'text-stone-500'}`}>
                                    {service.description}
                                  </p>
                                  <span className={`inline-flex items-center gap-1 text-[11px] mt-2 font-medium ${proTheme.isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                    <Clock className="w-3 h-3 text-stone-400" /> {service.durationMinutes} minutos
                                  </span>
                                </div>
                                <div className="text-right pl-3 shrink-0">
                                  <span className={`text-base font-extrabold ${proTheme.servicePriceText}`}>
                                    R$ {service.price.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Regiões e Taxas de Deslocamento (Somente Visualização) */}
                      {(pro.neighborhoods || proNeighborhoodsList).length > 0 && (
                        <div className="pt-3 border-t border-stone-200/80">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-700 flex items-center gap-1.5 mb-2.5">
                            <Car className="w-3.5 h-3.5 text-rose-600" />
                            Bairros Atendidos &amp; Taxas de Deslocamento
                          </h3>
                          <div className="flex flex-wrap gap-1.5">
                            {(pro.neighborhoods || proNeighborhoodsList).map((n) => (
                              <span
                                key={n.name}
                                className="inline-flex items-center gap-1.5 text-[11px] bg-white border border-stone-200 text-stone-700 px-2.5 py-1 rounded-xl font-medium"
                              >
                                <span>{n.name}</span>
                                <strong className="text-rose-700">
                                  {n.travelFee === 0 ? 'Grátis' : `+ R$ ${n.travelFee.toFixed(2).replace('.', ',')}`}
                                </strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isVitrinePreviewOpen ? (
                    <div className="bg-stone-100 border border-stone-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        🔒 <strong>Modo de Prévia:</strong> O agendamento fica desativado nesta visualização para a própria profissional.
                      </p>
                      <button
                        type="button"
                        onClick={handleExitVitrinePreview}
                        className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition cursor-pointer shrink-0"
                      >
                        Voltar à Edição Pro
                      </button>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-2">
                      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-base">
                        🚫
                      </div>
                      <p className="text-xs font-black text-amber-950">
                        Autoagendamento Bloqueado
                      </p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Profissionais não podem agendar serviços para si mesmas. Para agendar com outros profissionais, volte à vitrine de busca. Para gerenciar sua própria agenda, acesse seu Painel Pro.
                      </p>
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPro(null);
                            resetBooking();
                          }}
                          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-stone-800 text-xs font-bold hover:bg-stone-50 transition cursor-pointer"
                        >
                          🔍 Explorar Outras Profissionais
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            resetBooking();
                            setActiveTab('pro');
                          }}
                          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                        >
                          Ir ao Painel Pro
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : isProfessionalAccountExpired(pro) ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-amber-200 shadow-xs space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      Agenda Pausada
                    </span>
                    <h3 className="text-base font-extrabold text-stone-900 pt-1">
                      Agenda Temporariamente Indisponível
                    </h3>
                    <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                      No momento, a agenda online de <strong>{pro.name}</strong> está temporariamente pausada para novos agendamentos na plataforma.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPro(null);
                        resetBooking();
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition shadow-sm cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      Ver Outros Profissionais Disponíveis
                    </button>
                  </div>
                </div>
              ) : !bookingConfirmed ? (
                <div>
                  {/* Cabeçalho dos Passos */}
                  <div className="flex items-center justify-between mb-5">
                    <h2 className={`font-bold text-base flex items-center gap-2 ${proTheme.headerTitleText}`}>
                      <Sparkles className={`w-4 h-4 ${proTheme.primaryText}`} />
                      Agende seu Atendimento
                    </h2>
                    <span className="text-xs text-stone-500 font-medium">Passo {step} de 3</span>
                  </div>

                  {/* PASSO 1: ESCOLHA DO SERVIÇO */}
                  {step === 1 && (
                    <div className="space-y-3">
                      <p className={`text-xs mb-2 ${proTheme.isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                        {pro.businessNiche === 'BARBERSHOP'
                          ? 'Selecione o serviço para o seu agendamento:'
                          : pro.serviceMode === 'STUDIO'
                          ? 'Selecione o serviço para atendimento presencial:'
                          : 'Selecione o serviço desejado:'}
                      </p>
                      {(pro.services || proServicesList).length === 0 ? (
                        <div className="bg-white rounded-2xl p-6 text-center border border-stone-200 text-stone-500 space-y-1">
                          <p className="text-xs font-bold text-stone-800">
                            Catálogo de serviços em atualização
                          </p>
                          <p className="text-[11px]">
                            {pro.businessNiche === 'BARBERSHOP'
                              ? 'O barbeiro ainda não cadastrou serviços disponíveis para agendamento.'
                              : 'A profissional ainda não cadastrou serviços disponíveis para agendamento.'}
                          </p>
                        </div>
                      ) : (
                        (pro.services || proServicesList).map((service) => {
                          const isSelected = selectedService?.id === service.id;
                          return (
                            <div
                              key={service.id}
                              onClick={() => {
                                setSelectedService(service);
                                setSelectedTime(null);
                              }}
                              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                isSelected
                                  ? proTheme.cardSelected
                                  : `${proTheme.serviceCardBg} ${proTheme.serviceCardBorder} hover:border-stone-400`
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className={`font-bold text-sm ${proTheme.serviceTitleText}`}>{service.name}</h3>
                                    {service.popular && (
                                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                        Mais pedido
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-xs mt-1 leading-relaxed ${proTheme.isDark ? 'text-stone-300' : 'text-stone-500'}`}>
                                    {service.description}
                                  </p>
                                  <span className={`inline-flex items-center gap-1 text-[11px] mt-2 font-medium ${proTheme.isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                    <Clock className="w-3 h-3 text-stone-400" /> {service.durationMinutes} minutos
                                  </span>
                                </div>
                                <div className="text-right pl-3">
                                  <span className={`text-base font-extrabold ${proTheme.servicePriceText}`}>
                                    R$ {service.price.toFixed(2).replace('.', ',')}
                                  </span>
                                  <div className={`w-5 h-5 mt-2 rounded-full border flex items-center justify-center ml-auto ${
                                    isSelected ? proTheme.serviceRadioSelected : proTheme.serviceRadioUnselected
                                  }`}>
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}

                      <button
                        disabled={!selectedService}
                        onClick={() => setStep(2)}
                        className={`w-full py-3.5 rounded-xl font-bold text-sm mt-4 flex items-center justify-center gap-2 transition ${
                          selectedService
                            ? proTheme.primaryBtn
                            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        }`}
                      >
                        Continuar para Endereço & Horário
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* PASSO 2: BUSCA POR CEP (ViaCEP) E HORÁRIOS */}
                  {step === 2 && (
                    <div className="space-y-4">
                      {/* Resumo do Serviço Escolhido */}
                      <div className={`p-3 rounded-xl border flex justify-between items-center text-xs ${proTheme.isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}>
                        <div>
                          <span className={proTheme.isDark ? 'text-stone-400' : 'text-stone-500'}>Serviço:</span>{' '}
                          <span className={`font-bold ${proTheme.isDark ? 'text-white' : 'text-stone-900'}`}>{selectedService?.name}</span>
                        </div>
                        <button
                          onClick={() => setStep(1)}
                          className={`font-semibold hover:underline ${proTheme.primaryText}`}
                        >
                          Alterar
                        </button>
                      </div>

                      {/* 1. SELETOR DE MODALIDADE DE ATENDIMENTO */}
                      {pro.serviceMode === 'HIBRIDO' || !pro.serviceMode ? (
                        <div className={`p-3.5 rounded-2xl border space-y-2 ${proTheme.isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}>
                          <label className={`block text-xs font-bold ${proTheme.isDark ? 'text-white' : 'text-stone-800'}`}>
                            {pro.businessNiche === 'BARBERSHOP' ? '1. Onde você prefere seu atendimento?' : '1. Onde você prefere ser atendida?'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLocationType('STUDIO');
                                setTravelFee(0);
                                setIsNeighborhoodCovered(true);
                                setSelectedTime(null);
                              }}
                              className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                                selectedLocationType === 'STUDIO'
                                  ? proTheme.cardSelected
                                  : (proTheme.isDark ? 'bg-stone-950 border-stone-800 hover:bg-stone-800' : 'bg-stone-50 border-stone-200 hover:bg-stone-100')
                              }`}
                            >
                              <span className={`font-extrabold text-xs flex items-center gap-1.5 ${proTheme.isDark ? 'text-white' : 'text-stone-900'}`}>
                                {pro.businessNiche === 'BARBERSHOP' ? '💈 Na Barbearia' : '🏢 No Studio / Espaço'}
                              </span>
                              <span className="text-[10px] text-emerald-500 font-bold">
                                Deslocamento Grátis
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLocationType('DOMICILIO');
                                setSelectedTime(null);
                              }}
                              className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                                selectedLocationType === 'DOMICILIO'
                                  ? proTheme.cardSelected
                                  : (proTheme.isDark ? 'bg-stone-950 border-stone-800 hover:bg-stone-800' : 'bg-stone-50 border-stone-200 hover:bg-stone-100')
                              }`}
                            >
                              <span className={`font-extrabold text-xs flex items-center gap-1.5 ${proTheme.isDark ? 'text-white' : 'text-stone-900'}`}>
                                {pro.businessNiche === 'BARBERSHOP' ? '🏡 Domicílio / VIP' : '🏡 Na Minha Casa'}
                              </span>
                              <span className={`text-[10px] font-medium ${proTheme.isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                A Domicílio (calcula taxa)
                              </span>
                            </button>
                          </div>
                        </div>
                      ) : pro.serviceMode === 'STUDIO' ? (
                        <div className={`p-3.5 rounded-2xl flex items-center gap-2.5 border ${
                          proTheme.isDark
                            ? 'bg-stone-900 border-stone-800 text-white'
                            : `${proTheme.primaryBgLight} ${proTheme.primaryBorderLight} text-stone-900`
                        }`}>
                          <span className="text-xl">{pro.businessNiche === 'BARBERSHOP' ? '💈' : '🏢'}</span>
                          <div>
                            <p className="text-xs font-extrabold">
                              {pro.businessNiche === 'BARBERSHOP'
                                ? `Atendimento na Barbearia ${pro.studioName ? `• ${pro.studioName}` : ''}`
                                : `Atendimento no Studio ${pro.studioName ? `• ${pro.studioName}` : ''}`}
                            </p>
                            <p className={`text-[11px] ${proTheme.isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                              {pro.businessNiche === 'BARBERSHOP'
                                ? 'Atendimento no espaço físico da barbearia (Taxa de deslocamento grátis).'
                                : 'Esta profissional atende em seu espaço físico (Taxa de deslocamento grátis).'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className={`p-3.5 rounded-2xl flex items-center gap-2.5 border ${
                          proTheme.isDark
                            ? 'bg-stone-900 border-stone-800 text-white'
                            : `${proTheme.primaryBgLight} ${proTheme.primaryBorderLight} text-stone-900`
                        }`}>
                          <span className="text-xl">🏡</span>
                          <div>
                            <p className="text-xs font-extrabold">
                              {pro.businessNiche === 'BARBERSHOP'
                                ? 'Atendimento VIP a Domicílio'
                                : 'Atendimento Exclusivo a Domicílio'}
                            </p>
                            <p className={`text-[11px] ${proTheme.isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                              {pro.businessNiche === 'BARBERSHOP'
                                ? 'Atendimento no conforto da sua residência ou trabalho.'
                                : 'A profissional atende você no conforto da sua residência.'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 2. LOCALIZAÇÃO / ENDEREÇO CONFORME MODALIDADE */}
                      {selectedLocationType === 'STUDIO' ? (
                        <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                              📍 Endereço do Studio para Atendimento:
                            </span>
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Deslocamento Grátis
                            </span>
                          </div>
                          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs space-y-1">
                            <p className="font-extrabold text-stone-900">
                              {pro.studioName || pro.name || 'Studio / Atelier da Profissional'}
                            </p>
                            <p className="text-stone-700">
                              {pro.baseAddress ? `${pro.baseAddress}, ` : ''}
                              {pro.baseNeighborhood || 'Região Central'}
                              {pro.baseCity ? ` - ${pro.baseCity}` : ''}
                            </p>
                            {pro.baseCep && (
                              <p className="text-[11px] text-stone-400">CEP: {pro.baseCep}</p>
                            )}
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${pro.studioName ? `${pro.studioName}, ` : ''}${pro.baseAddress || ''}, ${pro.baseNeighborhood || ''}, ${pro.baseCity || ''}`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-bold hover:underline pt-1"
                            >
                              <Navigation className="w-3 h-3" /> Ver localização no Google Maps
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                          <label className="block text-xs font-bold text-stone-800">
                            Digite seu CEP para calcular o deslocamento:
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              maxLength={9}
                              placeholder="04538-133 ou 01426-001"
                              value={cep}
                              onChange={(e) => handleCepLookup(e.target.value)}
                              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                            {isLoadingCep && (
                              <Loader2 className="w-4 h-4 text-rose-600 animate-spin absolute right-3 top-3" />
                            )}
                          </div>

                          {cepError && (
                            <p className="text-[11px] text-red-600 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> {cepError}
                            </p>
                          )}

                          {neighborhood && (
                            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-xs space-y-1">
                              <p className="font-semibold text-stone-800">
                                📍 {street ? `${street}, ` : ''}{neighborhood} - {city}
                              </p>
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[11px] text-stone-500">Taxa de deslocamento:</span>
                                <span className="font-bold text-emerald-600 text-xs">
                                  {travelFee === 0 ? 'Grátis (Região Base)' : `R$ ${travelFee.toFixed(2).replace('.', ',')}`}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. CALENDÁRIO VISUAL INTERATIVO MULTI-MÊS */}
                      <div className={`p-4 rounded-2xl border space-y-3 ${proTheme.headerCardBg} ${proTheme.headerCardBorder}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <label className={`block text-xs font-bold ${proTheme.headerTitleText}`}>
                              2. Escolha o dia do atendimento no calendário:
                            </label>
                            <p className={`text-[11px] ${proTheme.isDark ? 'text-stone-400' : 'text-stone-500'}`}>Navegue pelos meses e clique na data desejada</p>
                          </div>

                          {/* Seletor e Navegação de Mês */}
                          <div className={`flex items-center gap-1 p-1 rounded-xl border ${proTheme.isDark ? 'bg-stone-950 border-stone-800' : 'bg-stone-100 border-stone-200'}`}>
                            <button
                              type="button"
                              disabled={
                                calendarYear < currentRealYear ||
                                (calendarYear === currentRealYear && calendarMonth <= currentRealMonth)
                              }
                              onClick={handlePrevMonth}
                              className={`p-1 rounded-lg transition ${
                                calendarYear < currentRealYear ||
                                (calendarYear === currentRealYear && calendarMonth <= currentRealMonth)
                                  ? 'text-stone-500 cursor-not-allowed opacity-50'
                                  : proTheme.isDark
                                  ? 'text-stone-300 hover:bg-stone-800'
                                  : 'text-stone-700 hover:bg-white hover:shadow-xs'
                              }`}
                              title="Mês anterior"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className={`text-xs font-extrabold px-2 min-w-[125px] text-center ${proTheme.headerTitleText}`}>
                              {monthNames[calendarMonth]} {calendarYear}
                            </span>
                            <button
                              type="button"
                              onClick={handleNextMonth}
                              className={`p-1 rounded-lg transition ${
                                proTheme.isDark
                                  ? 'text-stone-300 hover:bg-stone-800'
                                  : 'text-stone-700 hover:bg-white hover:shadow-xs'
                              }`}
                              title="Próximo mês"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Cabeçalho dos Dias da Semana */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-stone-400 uppercase tracking-wider pb-1">
                          <span>Dom</span>
                          <span>Seg</span>
                          <span>Ter</span>
                          <span>Qua</span>
                          <span>Qui</span>
                          <span>Sex</span>
                          <span>Sáb</span>
                        </div>

                        {/* Grid dos Dias do Mês Calculado Dinamicamente */}
                        {(() => {
                          const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                          const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0=Dom, 1=Seg, ...
                          const monthPadded = (calendarMonth + 1).toString().padStart(2, '0');

                          return (
                            <div className="grid grid-cols-7 gap-1">
                              {/* Espaços vazios no início do mês */}
                              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                                <div key={`empty-${i}`} className="h-10" />
                              ))}

                              {/* Dias do mês */}
                              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                                const dateStr = `${calendarYear}-${monthPadded}-${day.toString().padStart(2, '0')}`;
                                const dayOfWeek = new Date(calendarYear, calendarMonth, day).getDay();
                                const isPast = dateStr < todayIsoDateStr;
                                const blockedPeriod = clientViewBlockedPeriods.find((bp) => bp.dates.includes(dateStr));
                                const isBlocked = !!blockedPeriod;
                                const isWorkingDay = clientViewWorkingDays.includes(dayOfWeek);
                                const isAvailable = !isPast && !isBlocked && isWorkingDay;
                                const isSelected = selectedDate === dateStr;
                                const isToday = dateStr === todayIsoDateStr;

                                const dayName = WEEKDAYS[dayOfWeek]?.full || '';
                                const tooltipText = isPast
                                  ? 'Data passada'
                                  : isBlocked
                                  ? `Agenda Fechada: ${blockedPeriod?.reason} (${blockedPeriod?.startDate.split('-').reverse().join('/')} a ${blockedPeriod?.endDate.split('-').reverse().join('/')})`
                                  : !isWorkingDay
                                  ? `Folga Semanal (${dayName} - Profissional não atende)`
                                  : isToday
                                  ? 'Hoje - Disponível para atendimento'
                                  : 'Disponível para agendamento';

                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    disabled={!isAvailable}
                                    onClick={() => {
                                      setSelectedDate(dateStr);
                                      setSelectedTime(null);
                                    }}
                                    className={`h-10 rounded-xl text-xs font-semibold flex flex-col items-center justify-center relative transition ${
                                      isPast
                                        ? 'text-stone-300 cursor-not-allowed bg-stone-50/50'
                                        : isBlocked
                                        ? 'bg-amber-50 text-amber-800 border border-amber-200 cursor-not-allowed'
                                        : !isWorkingDay
                                        ? 'bg-stone-100/80 text-stone-400 cursor-not-allowed border border-dashed border-stone-200'
                                        : isSelected
                                        ? proTheme.calendarSelected
                                        : isToday
                                        ? proTheme.calendarToday
                                        : proTheme.calendarHover
                                    }`}
                                    title={tooltipText}
                                  >
                                    <span className="leading-tight">{day}</span>
                                    {isBlocked && (
                                      <Lock className="w-2.5 h-2.5 text-amber-600 absolute bottom-0.5" />
                                    )}
                                    {!isWorkingDay && !isPast && !isBlocked && (
                                      <span className="text-[7px] font-medium text-stone-400 uppercase tracking-tighter leading-none mt-0.5">
                                        folga
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}

                        {/* Legenda do Calendário Atualizada */}
                        <div className="flex flex-wrap items-center justify-between gap-1 pt-2 border-t border-stone-100 text-[10px] text-stone-500">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-rose-600" />
                            <span>Selecionado</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Disponível</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            <span>Período Fechado 🔒</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-stone-300" />
                            <span>Folga Semanal</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-stone-100" />
                            <span>Passado</span>
                          </div>
                        </div>
                      </div>

                      {/* 3. ABERTURA DOS HORÁRIOS SOMENTE APÓS O CLIQUE NO DIA */}
                      {!selectedDate ? (
                        <div className="bg-stone-50 p-4 rounded-2xl border border-dashed border-stone-300 text-center text-xs text-stone-500">
                          <Calendar className="w-5 h-5 mx-auto mb-1 text-stone-400" />
                          <p className="font-semibold text-stone-700">Selecione um dia disponível no calendário acima</p>
                          <p className="text-[11px] text-stone-400">Os horários livres de atendimento abrirão aqui após o seu clique.</p>
                        </div>
                      ) : clientViewBlockedPeriods.some((b) => b.dates.includes(selectedDate)) ? (
                        (() => {
                          const period = clientViewBlockedPeriods.find((b) => b.dates.includes(selectedDate));
                          return (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs flex items-start gap-2.5">
                              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-amber-900">Período com Agenda Fechada</p>
                                <p className="text-amber-700 mt-0.5">
                                  A profissional {pro.name} fechou a agenda de{' '}
                                  <strong>{period?.startDate.split('-').reverse().join('/')}</strong> até{' '}
                                  <strong>{period?.endDate.split('-').reverse().join('/')}</strong> ({period?.reason || 'Folga / Indisponível'}). Por favor, clique em outra data disponível no calendário.
                                </p>
                              </div>
                            </div>
                          );
                        })()
                      ) : (() => {
                        const [y, m, d] = selectedDate.split('-').map(Number);
                        const selDayOfWeek = new Date(y, m - 1, d).getDay();
                        return !clientViewWorkingDays.includes(selDayOfWeek);
                      })() ? (
                        <div className="bg-stone-100 border border-stone-200 p-4 rounded-2xl text-xs flex items-start gap-2.5">
                          <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-stone-800">Dia de Folga Semanal da Profissional</p>
                            <p className="text-stone-600 mt-0.5">
                              A profissional {pro.name} não realiza atendimentos nesta data. Por favor, escolha um dos dias brancos/destacados no calendário.
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Horários Disponíveis Revelados */
                        <div className="space-y-2 animate-in fade-in duration-200">
                          <div className="flex justify-between items-center mb-1">
                            <label className={`text-xs font-bold flex items-center gap-1.5 ${proTheme.headerTitleText}`}>
                              <Clock className={`w-3.5 h-3.5 ${proTheme.primaryText}`} />
                              3. Horários livres para {selectedDate.split('-').reverse().slice(0, 2).join('/')}:
                            </label>
                            <span className={`text-[10px] flex items-center gap-1 ${proTheme.isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                              <Info className="w-3 h-3 text-stone-400" /> +{clientViewBufferTime}min trânsito
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {availableSlots.map((slot) => (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={!slot.available}
                                title={slot.reason}
                                onClick={() => setSelectedTime(slot.time)}
                                className={`py-2 px-1 rounded-xl text-xs font-semibold border transition ${
                                  !slot.available
                                    ? (proTheme.isDark ? 'bg-stone-900/50 text-stone-600 border-stone-800 cursor-not-allowed line-through' : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed line-through')
                                    : selectedTime === slot.time
                                    ? proTheme.slotSelected
                                    : (proTheme.isDark ? 'bg-stone-900 text-stone-200 border-stone-800 hover:border-amber-400/60' : 'bg-white text-stone-800 border-stone-200 hover:border-stone-400')
                                }`}
                              >
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Botões de Ação */}
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className={`px-4 py-3 rounded-xl text-xs font-bold transition ${
                            proTheme.isDark
                              ? 'bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800'
                              : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          Voltar
                        </button>
                        <button
                          type="button"
                          disabled={
                            (selectedLocationType === 'DOMICILIO' && !neighborhood) ||
                            !selectedTime ||
                            !selectedDate ||
                            clientViewBlockedPeriods.some((b) => b.dates.includes(selectedDate)) ||
                            !clientViewWorkingDays.includes(
                              new Date(
                                Number(selectedDate.split('-')[0]),
                                Number(selectedDate.split('-')[1]) - 1,
                                Number(selectedDate.split('-')[2])
                              ).getDay()
                            )
                          }
                          onClick={() => setStep(3)}
                          className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
                            (selectedLocationType === 'STUDIO' || neighborhood) &&
                            selectedTime &&
                            selectedDate &&
                            !clientViewBlockedPeriods.some((b) => b.dates.includes(selectedDate)) &&
                            clientViewWorkingDays.includes(
                              new Date(
                                Number(selectedDate.split('-')[0]),
                                Number(selectedDate.split('-')[1]) - 1,
                                Number(selectedDate.split('-')[2])
                              ).getDay()
                            )
                              ? proTheme.primaryBtn
                              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          }`}
                        >
                          Ir para Dados & Confirmação
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PASSO 3: NÚMERO DO LOCAL, DADOS PESSOAIS E CONFIRMAÇÃO */}
                  {step === 3 && (
                    <form onSubmit={handleConfirmBooking} className="space-y-4">
                      {/* Resumo com Valores */}
                      <div className={`p-3.5 rounded-xl border space-y-1 text-xs ${proTheme.summaryBoxBg} ${proTheme.summaryBoxBorder}`}>
                        <div className={`flex justify-between ${proTheme.isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                          <span>{selectedService?.name}</span>
                          <span className={`font-semibold ${proTheme.isDark ? 'text-white' : 'text-stone-900'}`}>R$ {selectedService?.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className={`flex justify-between ${proTheme.isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                          <span>
                            {selectedLocationType === 'STUDIO'
                              ? `Atendimento no Studio (${pro.studioName || pro.name})`
                              : `Taxa de Deslocamento (${neighborhood})`}
                          </span>
                          <span className={`font-semibold ${proTheme.isDark ? 'text-white' : 'text-stone-900'}`}>
                            {selectedLocationType === 'STUDIO'
                              ? 'Grátis (R$ 0,00)'
                              : travelFee === 0
                              ? 'Grátis'
                              : `R$ ${travelFee.toFixed(2).replace('.', ',')}`}
                          </span>
                        </div>
                        <div className={`border-t pt-1 mt-1 flex justify-between font-extrabold text-sm ${proTheme.summaryTotalText}`}>
                          <span>Total do Atendimento:</span>
                          <span>R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className={`text-[11px] pt-1 ${proTheme.isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                          📅 {selectedDate.split('-').reverse().join('/')} às {selectedTime}
                        </div>
                      </div>

                      {/* Informações de Local / Endereço Conforme a Modalidade */}
                      {selectedLocationType === 'STUDIO' ? (
                        <div className={`p-3.5 rounded-xl border space-y-1.5 text-xs ${
                          proTheme.isDark
                            ? 'bg-stone-900 border-stone-800'
                            : 'bg-purple-50/80 border-purple-200'
                        }`}>
                          <p className={`font-extrabold flex items-center gap-1.5 ${proTheme.isDark ? 'text-white' : 'text-purple-950'}`}>
                            <span>{pro.businessNiche === 'BARBERSHOP' ? '💈' : '🏢'}</span> {pro.businessNiche === 'BARBERSHOP' ? 'Endereço da Barbearia para o atendimento:' : 'Endereço onde você será atendida:'}
                          </p>
                          <p className={`font-bold ${proTheme.isDark ? 'text-amber-400' : 'text-stone-900'}`}>
                            {pro.studioName || pro.name || (pro.businessNiche === 'BARBERSHOP' ? 'Barbearia Oficial' : 'Studio / Atelier da Profissional')}
                          </p>
                          <p className={proTheme.isDark ? 'text-stone-300' : 'text-stone-700'}>
                            {pro.baseAddress ? `${pro.baseAddress}, ` : ''}
                            {pro.baseNeighborhood || 'Região Central'}
                            {pro.baseCity ? ` - ${pro.baseCity}` : ''}
                          </p>
                          {pro.baseCep && (
                            <p className={`text-[11px] ${proTheme.isDark ? 'text-stone-400' : 'text-stone-500'}`}>CEP: {pro.baseCep}</p>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Campos Complementares do Endereço a Domicílio */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                              <label className={`block text-xs font-bold mb-1 ${proTheme.isDark ? 'text-stone-200' : 'text-stone-700'}`}>Rua / Logradouro:*</label>
                              <input
                                required
                                type="text"
                                value={street}
                                onChange={(e) => setStreet(e.target.value)}
                                className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 ${proTheme.focusRing} ${
                                  proTheme.isDark
                                    ? 'bg-stone-900 border-stone-800 text-stone-100'
                                    : 'bg-white border-stone-300 text-stone-800'
                                }`}
                              />
                            </div>
                            <div>
                              <label className={`block text-xs font-bold mb-1 ${proTheme.isDark ? 'text-stone-200' : 'text-stone-700'}`}>Número:*</label>
                              <input
                                required
                                type="text"
                                placeholder="Ex: 450"
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                                className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 ${proTheme.focusRing} ${
                                  proTheme.isDark
                                    ? 'bg-stone-900 border-stone-800 text-stone-100'
                                    : 'bg-white border-stone-300 text-stone-800'
                                }`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={`block text-xs font-bold mb-1 ${proTheme.isDark ? 'text-stone-200' : 'text-stone-700'}`}>Complemento / Apto (Opcional):</label>
                            <input
                              type="text"
                              placeholder="Apto 42, Bloco B, Casa dos fundos..."
                              value={complement}
                              onChange={(e) => setComplement(e.target.value)}
                              className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 ${proTheme.focusRing} ${
                                proTheme.isDark
                                  ? 'bg-stone-900 border-stone-800 text-stone-100'
                                  : 'bg-white border-stone-300 text-stone-800'
                              }`}
                            />
                          </div>
                        </>
                      )}

                      {/* Dados da Cliente */}
                      <div>
                        <label className={`block text-xs font-bold mb-1 ${proTheme.isDark ? 'text-stone-200' : 'text-stone-700'}`}>Seu Nome Completo:*</label>
                        <input
                          required
                          type="text"
                          placeholder="Ex: Larissa Silva"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 ${proTheme.focusRing} ${
                            proTheme.isDark
                              ? 'bg-stone-900 border-stone-800 text-stone-100'
                              : 'bg-white border-stone-300 text-stone-800'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-xs font-bold mb-1 ${proTheme.isDark ? 'text-stone-200' : 'text-stone-700'}`}>Seu WhatsApp:*</label>
                        <input
                          required
                          type="tel"
                          placeholder="Ex: (11) 98765-4321"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 ${proTheme.focusRing} ${
                            proTheme.isDark
                              ? 'bg-stone-900 border-stone-800 text-stone-100'
                              : 'bg-white border-stone-300 text-stone-800'
                          }`}
                        />
                      </div>

                      <p className={`text-[11px] leading-tight ${proTheme.isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        * O pagamento é realizado diretamente com {pro.businessNiche === 'BARBERSHOP' ? 'o barbeiro' : 'a profissional'} no dia do atendimento.
                      </p>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className={`px-4 py-3 rounded-xl text-xs font-bold transition ${
                            proTheme.isDark
                              ? 'bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800'
                              : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          Voltar
                        </button>
                        <button
                          type="submit"
                          className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md ${proTheme.primaryBtn}`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirmar Agendamento
                        </button>
                      </div>
                      <p className="text-[10px] text-stone-500 text-center mt-2.5 leading-relaxed">
                        Ao confirmar, você concorda com os{' '}
                        <button
                          type="button"
                          onClick={() => setLgpdModalState({ open: true, tab: 'TERMS' })}
                          className="underline font-bold text-stone-700 hover:text-stone-900 cursor-pointer"
                        >
                          Termos de Uso
                        </button>{' '}
                        e com as regras e tolerâncias estabelecidas pela profissional.
                      </p>
                    </form>
                  )}
                </div>
              ) : (
                /* TELA DE SUCESSO COM SINAL DE 50%, CHAVE PIX, REGRAS E WHATSAPP */
                (() => {
                  const clientEffectiveRules = getEffectiveBookingRules(
                    pro.bookingRules || (isViewingOwnProVitrine ? bookingRules : null),
                    pro
                  );
                  const clientDepositCalc = calculateDeposit(
                    lastBooking?.totalPrice || 0,
                    clientEffectiveRules
                  );
                  const pixKeyLabel = PIX_KEY_LABELS[clientEffectiveRules.pixKeyType] || 'PIX';
                  const effectivePixKey =
                    clientEffectiveRules.pixKey ||
                    (pro.whatsapp ? pro.whatsapp.replace(/\D/g, '') : '');

                  return (
                    <div className="text-center py-6">
                      <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-stone-900">Agendamento Realizado!</h3>
                      <p className="text-xs text-stone-600 mt-1 max-w-xs mx-auto">
                        O horário foi pré-reservado na agenda de <strong>{pro.name}</strong>.
                      </p>

                      <div className="bg-white p-4 rounded-2xl border border-stone-200 text-left mt-4 text-xs space-y-1.5 shadow-2xs">
                        <p><strong>Serviço:</strong> {lastBooking?.serviceName}</p>
                        <p><strong>Data & Hora:</strong> {lastBooking?.date.split('-').reverse().join('/')} às {lastBooking?.time}</p>
                        <p><strong>Local:</strong> {lastBooking?.address} - {lastBooking?.neighborhood}</p>
                        <p><strong>Valor Total:</strong> R$ {lastBooking?.totalPrice.toFixed(2).replace('.', ',')}</p>
                      </div>

                      {/* BOX DE SINAL DE 50% & CHAVE PIX */}
                      {clientEffectiveRules.requireDeposit && clientDepositCalc.depositAmount > 0 ? (
                        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-amber-50/60 via-emerald-50/70 to-teal-50/60 border-2 border-emerald-400 text-left space-y-3 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              Sinal de {clientDepositCalc.depositPercentage}% para Garantir o Horário
                            </span>
                            <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0">
                              Segura sua Vaga
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
                              <p className="text-[10px] text-stone-500 font-bold">
                                Sinal a Pagar Agora ({clientDepositCalc.depositPercentage}%)
                              </p>
                              <p className="text-base font-black text-emerald-700">
                                R$ {clientDepositCalc.depositAmount.toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs">
                              <p className="text-[10px] text-stone-500 font-bold">Restante no Atendimento</p>
                              <p className="text-base font-black text-stone-700">
                                R$ {clientDepositCalc.remainingAmount.toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1.5 shadow-2xs">
                            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">
                              Chave PIX ({pixKeyLabel}):
                            </p>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-mono font-black text-stone-900 truncate">
                                {effectivePixKey || 'Chave a combinar no WhatsApp'}
                              </span>
                              {effectivePixKey && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(effectivePixKey);
                                    setCopiedClientPix(true);
                                    setTimeout(() => setCopiedClientPix(false), 2000);
                                  }}
                                  className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition shrink-0 flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedClientPix ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                  {copiedClientPix ? 'Copiado!' : 'Copiar Chave'}
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-stone-600">
                              Titular da Conta: <strong>{clientEffectiveRules.pixReceiverName || pro.name}</strong>
                            </p>
                          </div>

                          <div className="text-[11px] text-amber-900 bg-amber-100/80 p-2.5 rounded-xl flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>
                              Envie o comprovante em até <strong>{clientEffectiveRules.depositTimeLimitHours}h</strong> para confirmar sua vaga na agenda.
                            </span>
                          </div>
                        </div>
                      ) : null}

                      {/* REGRAS DO ATENDIMENTO */}
                      <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-left mt-3 space-y-1.5 shadow-2xs">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-700">
                          Regras e Orientações do Atendimento:
                        </p>
                        <ul className="text-[11px] text-stone-600 space-y-1">
                          <li>• Tolerância máxima de atraso: <strong>{clientEffectiveRules.delayToleranceMinutes} minutos</strong></li>
                          <li>• Remarcações com no mínimo <strong>{clientEffectiveRules.cancellationNoticeHours}h</strong> de antecedência</li>
                          {clientEffectiveRules.customRules && (
                            <li className="whitespace-pre-wrap">{clientEffectiveRules.customRules}</li>
                          )}
                        </ul>
                      </div>

                      {/* DISCLAIMER DE ISENÇÃO SOBRE SINAL E REGRAS */}
                      <div className="bg-stone-100/90 border border-stone-200 rounded-xl p-2.5 text-[10px] text-stone-600 leading-relaxed text-left flex items-start gap-2 mt-3">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Aviso Legal:</strong> O sinal, as tolerâncias e as regras de cancelamento são estabelecidos diretamente por <strong>{pro.name}</strong>. O BellaDoor é uma ferramenta tecnológica de agendamento e vitrine e não custodia nem intermedeia valores financeiros.
                        </span>
                      </div>

                      {/* BOTÃO DO WHATSAPP COM MENSAGEM PRÉ-FORMATADA */}
                      <a
                        href={getWhatsAppBookingLink()}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {clientEffectiveRules.requireDeposit
                          ? 'Enviar Comprovante e Confirmar no WhatsApp'
                          : `Confirmar no WhatsApp de ${pro.name}`}
                      </a>

                      <p className="text-[11px] text-stone-400 mt-2">
                        {clientEffectiveRules.requireDeposit
                          ? '💡 Clique acima para abrir a conversa no WhatsApp com os dados e enviar seu comprovante.'
                          : '💡 Clique acima para abrir a conversa no WhatsApp e confirmar seu horário diretamente com a profissional.'}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            resetBooking();
                            setClientSubView('MY_BOOKINGS');
                          }}
                          className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Ver em Meus Agendamentos
                        </button>
                        <button
                          type="button"
                          onClick={resetBooking}
                          className="w-full py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs hover:bg-stone-200 transition cursor-pointer"
                        >
                          Fazer Novo Agendamento
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* 3. PORTFÓLIO DE TRABALHOS REALIZADOS (SE HOUVER FOTOS CADASTRADAS) */}
            {pro.portfolio && pro.portfolio.length > 0 && (
              <div className={`col-span-1 lg:col-span-7 xl:col-span-8 rounded-3xl shadow-sm border p-6 transition-colors ${proTheme.headerCardBg} ${proTheme.headerCardBorder}`}>
                <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-rose-600" />
                      Portfólio de Trabalhos Realizados
                    </h3>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full">
                      {pro.portfolio.length} {pro.portfolio.length === 1 ? 'foto' : 'fotos'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsVitrinePortfolioCollapsed(!isVitrinePortfolioCollapsed)}
                    className="p-1.5 sm:px-2.5 sm:py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-stone-200 select-none"
                    title={isVitrinePortfolioCollapsed ? 'Expandir fotos' : 'Recolher fotos'}
                  >
                    <span className="hidden sm:inline">
                      {isVitrinePortfolioCollapsed ? 'Expandir' : 'Recolher'}
                    </span>
                    {isVitrinePortfolioCollapsed ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                {!isVitrinePortfolioCollapsed && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 animate-in fade-in duration-200">
                    {pro.portfolio.map((item, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-2xl overflow-hidden aspect-square bg-stone-100 border border-stone-200/80 shadow-xs"
                      >
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent opacity-95 p-2.5 flex items-end">
                          <span className="text-[11px] text-white font-bold leading-snug">
                            {item.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. SEÇÃO DE AVALIAÇÕES REAIS DAS CLIENTES */}
            <div className="col-span-1 lg:col-span-7 xl:col-span-8 rounded-3xl shadow-sm border border-stone-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    Avaliações de Clientes ({currentProReviews.length})
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Nota média <strong className="text-amber-600">{pro.rating} ★</strong> {pro.businessNiche === 'BARBERSHOP' ? 'de clientes atendidos na barbearia e a domicílio' : 'de clientes atendidas em casa'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {currentUser.role === 'CLIENT' && pendingCompletedAppointmentForClient ? (
                    <button
                      type="button"
                      onClick={() => handleOpenReviewForAppointment(pendingCompletedAppointmentForClient)}
                      className="text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5 text-amber-600" />
                      Avaliar Meu Atendimento Concluído
                    </button>
                  ) : (
                    <span
                      className="hidden sm:flex text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200 px-2.5 py-1.5 rounded-xl items-center gap-1.5"
                      title="Somente clientes que contrataram e tiveram o agendamento marcado como Concluído pela profissional podem avaliar"
                    >
                      <Lock className="w-3 h-3 text-stone-500 shrink-0" />
                      Avaliação após conclusão
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsVitrineReviewsCollapsed(!isVitrineReviewsCollapsed)}
                    className="p-1.5 sm:px-2.5 sm:py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-stone-200 select-none"
                    title={isVitrineReviewsCollapsed ? 'Expandir avaliações' : 'Recolher avaliações'}
                  >
                    <span className="hidden sm:inline">
                      {isVitrineReviewsCollapsed ? 'Expandir' : 'Recolher'}
                    </span>
                    {isVitrineReviewsCollapsed ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {!isVitrineReviewsCollapsed && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Formulário de Avaliação Verificada (apenas quando há atendimento Concluído da cliente) */}
                  {currentUser.role === 'CLIENT' && showReviewForm && pendingCompletedAppointmentForClient && (
                    <form
                      onSubmit={handleSubmitClientReview}
                      className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            Atendimento Concluído Verificado
                          </span>
                          <p className="text-xs font-extrabold text-stone-900 mt-1">
                            Deixe sua avaliação para {pro.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="p-0.5 cursor-pointer"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  star <= reviewRating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-stone-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={reviewClientName}
                          readOnly
                          className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 cursor-not-allowed"
                        />
                        <input
                          type="text"
                          value={reviewServiceName}
                          readOnly
                          className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 cursor-not-allowed"
                        />
                      </div>

                      <textarea
                        rows={2}
                        placeholder="Escreva como foi sua experiência..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowReviewForm(false)}
                          className="px-3 py-2 bg-white border border-stone-200 text-stone-600 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-xs cursor-pointer"
                        >
                          Publicar Avaliação
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Lista de Depoimentos das Clientes */}
                  <div className="space-y-2.5">
                    {currentProReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[11px] flex items-center justify-center">
                              {rev.clientName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-stone-900 leading-none">
                                {rev.clientName}
                              </p>
                              <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                                {rev.serviceName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-0.5 justify-end">
                              {Array.from({ length: rev.rating }).map((_, idx) => (
                                <Star
                                  key={idx}
                                  className="w-3 h-3 fill-amber-400 text-amber-400"
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-stone-400">{rev.date}</span>
                          </div>
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed pl-9">
                          "{rev.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'client' ? (
        /* ============================================================ */
        /* 1. VISÃO DA CLIENTE                                          */
        /* ============================================================ */
        clientSubView === 'MY_BOOKINGS' ? (
          /* ========================================================== */
          /* PASSO 4: ÁREA "MEUS AGENDAMENTOS" DA CLIENTE + AVALIAÇÕES  */
          /* ========================================================== */
          <ClientBookingsView
            proAppointments={clientOwnAppointments}
            professionals={allProfessionalsWithLivePro}
            proDisplayName={proDisplayName}
            proAvatarUrl={proAvatarUrl}
            proWhatsapp={pro.whatsapp}
            showReviewForm={showReviewForm}
            reviewRating={reviewRating}
            reviewClientName={reviewClientName}
            reviewServiceName={reviewServiceName}
            reviewComment={reviewComment}
            onBackToExplore={() => {
              setClientSubView('EXPLORE');
              setShowReviewForm(false);
            }}
            onCloseReviewForm={() => setShowReviewForm(false)}
            onChangeReviewRating={setReviewRating}
            onChangeReviewClientName={setReviewClientName}
            onChangeReviewServiceName={setReviewServiceName}
            onChangeReviewComment={setReviewComment}
            onSubmitReview={handleSubmitClientReview}
            onOpenReviewForAppointment={handleOpenReviewForAppointment}
            onCancelClientAppointment={handleCancelClientAppointment}
          />
        ) : (
          /* ========================================================== */
          /* A. VITRINE DE BUSCA / MARKETPLACE DE PROFISSIONAIS         */
          /* ========================================================== */
          <MarketplaceView
            filteredPros={filteredPros}
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            onChangeSearchQuery={setSearchQuery}
            onChangeCategoryFilter={setCategoryFilter}
            onClearFilters={() => {
              setCategoryFilter('TODAS');
              setSearchQuery('');
            }}
            onSelectProfessional={(p) => {
              setSelectedPro(p);
              resetBooking();
            }}
            currentProSlug={dynamicSlug}
            currentProId={myProId}
          />
        )
      ) : (
          /* ============================================================ */
          /* 2. VISÃO DA PROFISSIONAL: APP MOBILE COMPLETO (Android/iOS)  */
          /* ============================================================ */
          <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
            {/* Header Superior do App com Capa/Banner Personalizável (Opção Clara & Leve para Beleza) */}
            <div className={`relative overflow-hidden transition-colors ${
              panelTheme.isDark
                ? 'bg-stone-900 text-white'
                : 'bg-gradient-to-b from-stone-50 via-rose-50/20 to-white text-stone-900 border-b border-stone-200'
            }`}>
              {/* Imagem de Fundo do Banner */}
              <div className={`absolute inset-0 h-28 ${panelTheme.isDark ? 'opacity-35' : 'opacity-25'}`}>
                <img
                  src={pro.coverUrl}
                  alt="Banner da Vitrine"
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 ${
                  panelTheme.isDark
                    ? 'bg-gradient-to-b from-black/20 via-stone-900/70 to-stone-900'
                    : 'bg-gradient-to-b from-white/30 via-white/75 to-stone-50/95'
                }`} />
              </div>

              <div className="relative p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isProTrialExpired) {
                          showExpiredTrialLockDialog();
                          return;
                        }
                        setProSubTab('portfolio');
                        setPortfolioFormMode('LIST');
                      }}
                      title="Clique para trocar sua foto de perfil ou capa"
                      className="relative group cursor-pointer"
                    >
                      <img
                        src={pro.avatarUrl}
                        alt={pro.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-rose-500 shadow-md group-hover:opacity-90 transition"
                      />
                      <span className={`absolute -bottom-1 -right-1 bg-rose-600 text-white p-1 rounded-full border ${
                        panelTheme.isDark ? 'border-stone-900' : 'border-white'
                      } shadow-xs`}>
                        <Camera className="w-2.5 h-2.5" />
                      </span>
                    </button>
                    <div>
                      <h2 className={`text-base font-bold flex items-center gap-1.5 ${
                        panelTheme.isDark ? 'text-white' : 'text-stone-900'
                      }`}>
                        {pro.name}
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isProTrialExpired ? 'bg-red-500' : 'bg-emerald-400'
                          }`}
                          title={isProTrialExpired ? 'Acesso Bloqueado' : 'Online'}
                        />
                      </h2>
                      <p className={`text-[11px] font-medium ${
                        panelTheme.isDark ? 'text-rose-300' : 'text-rose-600'
                      }`}>{pro.title}</p>
                      <p className={`text-[10px] ${
                        panelTheme.isDark ? 'text-stone-400' : 'text-stone-500'
                      }`}>?pro={pro.slug}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {subscriptionStatus === 'TRIAL' ? (
                      isProTrialExpired ? (
                        <>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-red-600 text-white border border-red-400 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> 7 Dias Expirados
                          </span>
                          <p className={`text-[10px] font-extrabold mt-1 ${
                            panelTheme.isDark ? 'text-red-300' : 'text-red-600'
                          }`}>
                            0 dias • Conta Bloqueada
                          </p>
                        </>
                      ) : (
                        <>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            panelTheme.isDark
                              ? 'bg-rose-900/60 text-rose-300 border-rose-700/50'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {currentUser?.appliedCoupon
                              ? `🎟️ Cupom ${currentUser.appliedCoupon}`
                              : '🎁 7 Dias Grátis (Trial)'}
                          </span>
                          <p className={`text-[10px] font-bold mt-1 ${
                            panelTheme.isDark ? 'text-amber-300' : 'text-amber-700'
                          }`}>
                            {trialDaysLeft}{' '}
                            {trialDaysLeft === 1
                              ? 'dia disponível'
                              : 'dias disponíveis'}
                          </p>
                        </>
                      )
                    ) : (
                      <>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1 border ${
                          panelTheme.isDark
                            ? 'bg-emerald-900/80 text-emerald-300 border-emerald-600'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          <CheckCircle className={`w-3 h-3 ${panelTheme.isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />{' '}
                          {currentUser?.appliedCoupon && currentUser?.paymentMethod === 'COUPON'
                            ? `Acesso VIP • ${currentUser.appliedCoupon}`
                            : 'Assinante Ativa'}
                        </span>
                        <p className={`text-[10px] mt-1 font-semibold ${
                          panelTheme.isDark ? 'text-emerald-400' : 'text-emerald-700'
                        }`}>
                          {currentUser?.appliedCoupon && currentUser?.paymentMethod === 'COUPON'
                            ? `${trialDaysLeft} dias livres disponíveis`
                            : planInterval === 'ANNUAL'
                            ? 'Plano Anual (R$ 299/ano)'
                            : currentUser?.paymentMethod === 'PIX'
                            ? 'Plano Mensal PIX (R$ 44,90/mês)'
                            : 'Plano Mensal Cartão (R$ 39,90/mês)'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* AVISO DE BLOQUEIO QUANDO O PERÍODO DE TESTE/CUPOM EXPIRA */}
                {subscriptionStatus === 'TRIAL' && isProTrialExpired && (
                  <div className="mt-3 bg-red-600/25 border-2 border-red-400/60 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-lg shrink-0">🔒</span>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-red-200 leading-tight">
                          Período de {currentUser?.appliedCoupon ? 'Cupom' : '7 Dias Grátis'} Encerrado (0 de {trialTotalDays} dias disponíveis)
                        </p>
                        <p className="text-[11px] text-stone-200 mt-0.5 leading-snug">
                          Sua plataforma está bloqueada desde {trialEndDateFormatted}. Pague seu plano ou ative um cupom de desconto abaixo para liberar todas as funções.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProSubTab('billing')}
                      className="px-3 py-2 bg-red-500 hover:bg-red-400 text-white rounded-xl text-[11px] font-extrabold shrink-0 transition cursor-pointer shadow-xs"
                    >
                      Liberar Acesso Agora 💳
                    </button>
                  </div>
                )}

                {/* PASSO 2: BARRA DE COMPARTILHAMENTO DO LINK EXCLUSIVO DA VITRINE */}
                <div className={`mt-3.5 rounded-2xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  panelTheme.isDark
                    ? 'bg-stone-800/80 border border-stone-700/80'
                    : 'bg-white border border-stone-200/80 shadow-2xs'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 ${panelTheme.primaryBgLight} ${panelTheme.primaryText} rounded-lg shrink-0`}>
                      <Share2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${
                        panelTheme.isDark ? 'text-stone-300' : 'text-stone-600'
                      }`}>
                        Link Exclusivo da sua Vitrine (Instagram / WhatsApp):
                      </p>
                      <p className={`text-[11px] font-extrabold ${panelTheme.isDark ? 'text-amber-400' : 'text-rose-600'} truncate`}>
                        {isProTrialExpired
                          ? '🔒 Link pausado até ativação do plano ou cupom'
                          : getDirectVitrineUrl()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (isProTrialExpired) {
                          showExpiredTrialLockDialog();
                          return;
                        }
                        handleCopyVitrineLink();
                      }}
                      className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer shadow-xs ${
                        panelTheme.isDark
                          ? 'bg-white hover:bg-stone-100 text-stone-900'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200'
                      }`}
                    >
                      <Copy className={`w-3 h-3 ${panelTheme.primaryText}`} />
                      Copiar Link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isProTrialExpired) {
                          showExpiredTrialLockDialog();
                          return;
                        }
                        handleShareVitrineWhatsApp();
                      }}
                      className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                    >
                      <MessageCircle className="w-3 h-3" />
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isProTrialExpired) {
                          showExpiredTrialLockDialog();
                          return;
                        }
                        setShowPromoCardModal(true);
                      }}
                      className="w-full sm:w-auto px-2.5 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                    >
                      <QrCode className="w-3 h-3 text-amber-200" />
                      Arte Stories &amp; QR Code
                    </button>
                  </div>
                </div>

                {/* BANNER DO PROGRAMA BETA TESTER (10 PRIMEIRAS PROFISSIONAIS) */}
                <div className={`mt-3 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  panelTheme.isDark
                    ? 'bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-amber-500/30'
                    : 'bg-gradient-to-r from-amber-50/90 via-rose-50/60 to-purple-50/60 border border-amber-200/80 shadow-2xs'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🚀</span>
                    <div>
                      <p className={`text-xs font-black flex items-center gap-1.5 ${
                        panelTheme.isDark ? 'text-white' : 'text-stone-900'
                      }`}>
                        Você está no Programa Beta do Belladoor!
                        <span className="text-[9px] bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded-full font-extrabold uppercase">
                          Piloto Gratuito
                        </span>
                      </p>
                      <p className={`text-[11px] ${
                        panelTheme.isDark ? 'text-stone-300' : 'text-stone-600'
                      }`}>
                        Como uma das 10 primeiras profissionais, seu feedback sincero é fundamental para aperfeiçoar a ferramenta.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBetaFeedbackModal(true)}
                    className="py-1.5 px-3 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-stone-950 text-xs font-black rounded-xl transition shrink-0 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 text-stone-950 fill-stone-950" />
                    Avaliar Experiência ⭐
                  </button>
                </div>

                {/* Métricas Rápidas no Topo */}
                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t text-center ${
                  panelTheme.isDark ? 'border-stone-800' : 'border-stone-200/80'
                }`}>
                  <div className={`p-2 rounded-xl flex flex-col justify-between ${
                    panelTheme.isDark ? 'bg-stone-800/60' : 'bg-white border border-stone-200/80 shadow-2xs'
                  }`}>
                    <p className={`text-[10px] leading-tight ${
                      panelTheme.isDark ? 'text-stone-400' : 'text-stone-500 font-medium'
                    }`}>Receita (Concluídos)</p>
                    <p className={`text-sm font-extrabold mt-1 ${
                      panelTheme.isDark ? 'text-emerald-400' : 'text-emerald-600'
                    }`}>
                      R${' '}
                      {myProAppointments
                        .filter((a) => a.status === 'Concluído')
                        .reduce((acc, a) => acc + a.totalPrice, 0)
                        .toFixed(0)}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl flex flex-col justify-between ${
                    panelTheme.isDark ? 'bg-stone-800/60' : 'bg-white border border-stone-200/80 shadow-2xs'
                  }`}>
                    <p className={`text-[10px] leading-tight ${
                      panelTheme.isDark ? 'text-stone-400' : 'text-stone-500 font-medium'
                    }`}>Atendimentos Agendados</p>
                    <p className={`text-sm font-extrabold mt-1 ${
                      panelTheme.isDark ? 'text-sky-400' : 'text-sky-600'
                    }`}>
                      {myProAppointments.filter((a) => a.status === 'Confirmado').length}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl flex flex-col justify-between ${
                    panelTheme.isDark ? 'bg-stone-800/60' : 'bg-white border border-stone-200/80 shadow-2xs'
                  }`}>
                    <p className={`text-[10px] leading-tight ${
                      panelTheme.isDark ? 'text-stone-400' : 'text-stone-500 font-medium'
                    }`}>Atendimentos Concluídos</p>
                    <p className={`text-sm font-extrabold mt-1 ${
                      panelTheme.isDark ? 'text-rose-400' : 'text-rose-600'
                    }`}>
                      {myProAppointments.filter((a) => a.status === 'Concluído').length}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl flex flex-col justify-between ${
                    panelTheme.isDark ? 'bg-stone-800/60' : 'bg-white border border-stone-200/80 shadow-2xs'
                  }`}>
                    <p className={`text-[10px] leading-tight ${
                      panelTheme.isDark ? 'text-stone-400' : 'text-stone-500 font-medium'
                    }`}>Nota Vitrine</p>
                    <p className={`text-sm font-extrabold mt-1 ${
                      panelTheme.isDark ? 'text-amber-400' : 'text-amber-600'
                    }`}>⭐ {pro.rating}</p>
                  </div>
                </div>

                {/* Atalho para abrir a Janela do Assistente Passo a Passo e Regras & Sinal */}
                <div className={`mt-3 pt-2.5 border-t flex items-center justify-between flex-wrap gap-2 ${
                  panelTheme.isDark ? 'border-stone-800' : 'border-stone-200/80'
                }`}>
                  <p className={`text-[10px] ${panelTheme.isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Ajuste suas regras anti-furo ou revise sua conta passo a passo:
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowBookingRulesModal(true)}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer shrink-0 ${
                        panelTheme.isDark
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <ShieldCheck className={`w-3 h-3 ${panelTheme.isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      Regras & Sinal 50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBetaFeedbackModal(true)}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer shrink-0 ${
                        panelTheme.isDark
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      <Star className={`w-3 h-3 ${panelTheme.isDark ? 'text-amber-400 fill-amber-400' : 'text-amber-500 fill-amber-500'}`} />
                      Feedback do Beta ⭐
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isProTrialExpired) {
                          showExpiredTrialLockDialog();
                          return;
                        }
                        startProOnboardingWizard();
                      }}
                      className={`text-[10px] font-extrabold ${panelTheme.primaryBgLight} hover:opacity-90 ${panelTheme.primaryText} border ${panelTheme.primaryBorderLight} px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer shrink-0`}
                    >
                      <Sparkles className={`w-3 h-3 ${panelTheme.primaryText}`} />
                      {isProTrialExpired ? '🔒 Assistente Bloqueado' : 'Assistente'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* BARRA DE NAVEGAÇÃO DE ABAS DO APP (5 ABAS PRINCIPAIS VISÍVEIS SEM ROLAR NO CELULAR) */}
            <div className="grid grid-cols-5 border-b border-stone-200 bg-stone-50 text-[10px] sm:text-[11px] font-semibold text-stone-600">
              <button
                type="button"
                onClick={() => {
                  if (isProTrialExpired) {
                    showExpiredTrialLockDialog();
                    return;
                  }
                  setProSubTab('agenda');
                  setServiceFormMode('LIST');
                  setAreaFormMode('LIST');
                  setPortfolioFormMode('LIST');
                }}
                className={`py-2.5 sm:py-3 px-1 text-center border-b-2 transition cursor-pointer truncate ${
                  isProTrialExpired
                    ? 'border-transparent text-stone-400 bg-stone-100/80'
                    : proSubTab === 'agenda'
                    ? `${panelTheme.activeTabBorder} ${panelTheme.activeTabText} bg-white font-bold`
                    : 'border-transparent hover:text-stone-900'
                }`}
              >
                {isProTrialExpired ? '🔒 Agenda' : '📅 Agenda'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isProTrialExpired) {
                    showExpiredTrialLockDialog();
                    return;
                  }
                  setProSubTab('portfolio');
                  setServiceFormMode('LIST');
                  setAreaFormMode('LIST');
                  setPortfolioFormMode('LIST');
                }}
                className={`py-2.5 sm:py-3 px-1 text-center border-b-2 transition cursor-pointer truncate ${
                  isProTrialExpired
                    ? 'border-transparent text-stone-400 bg-stone-100/80'
                    : proSubTab === 'portfolio'
                    ? `${panelTheme.activeTabBorder} ${panelTheme.activeTabText} bg-white font-bold`
                    : 'border-transparent hover:text-stone-900'
                }`}
              >
                <span className="hidden sm:inline">{isProTrialExpired ? '🔒 Vitrine & Fotos' : '📸 Vitrine & Fotos'}</span>
                <span className="sm:hidden">{isProTrialExpired ? '🔒 Vitrine' : '📸 Vitrine'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isProTrialExpired) {
                    showExpiredTrialLockDialog();
                    return;
                  }
                  setProSubTab('services');
                  setServiceFormMode('LIST');
                  setAreaFormMode('LIST');
                  setPortfolioFormMode('LIST');
                }}
                className={`py-2.5 sm:py-3 px-1 text-center border-b-2 transition cursor-pointer truncate ${
                  isProTrialExpired
                    ? 'border-transparent text-stone-400 bg-stone-100/80'
                    : proSubTab === 'services'
                    ? `${panelTheme.activeTabBorder} ${panelTheme.activeTabText} bg-white font-bold`
                    : 'border-transparent hover:text-stone-900'
                }`}
              >
                {isProTrialExpired
                  ? '🔒 Serviços'
                  : proBusinessNiche === 'BARBERSHOP'
                  ? '💈 Serviços'
                  : '💅 Serviços'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isProTrialExpired) {
                    showExpiredTrialLockDialog();
                    return;
                  }
                  setProSubTab('areas');
                  setServiceFormMode('LIST');
                  setAreaFormMode('LIST');
                  setPortfolioFormMode('LIST');
                }}
                className={`py-2.5 sm:py-3 px-1 text-center border-b-2 transition cursor-pointer truncate ${
                  isProTrialExpired
                    ? 'border-transparent text-stone-400 bg-stone-100/80'
                    : proSubTab === 'areas'
                    ? `${panelTheme.activeTabBorder} ${panelTheme.activeTabText} bg-white font-bold`
                    : 'border-transparent hover:text-stone-900'
                }`}
              >
                {isProTrialExpired ? '🔒 Regiões' : '🚗 Regiões'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setProSubTab('billing');
                  setServiceFormMode('LIST');
                  setAreaFormMode('LIST');
                  setPortfolioFormMode('LIST');
                }}
                className={`py-2.5 sm:py-3 px-1 text-center border-b-2 transition cursor-pointer truncate ${
                  proSubTab === 'billing' || isProTrialExpired
                    ? `${panelTheme.activeTabBorder} ${panelTheme.activeTabText} bg-white font-bold`
                    : 'border-transparent hover:text-stone-900'
                }`}
              >
                💳 Plano {isProTrialExpired ? '🔒' : ''}
              </button>
            </div>

            {/* CONTEÚDO DAS ABAS DO APP */}
            <div className="p-5">
              {/* Banner de Confirmação Elegante (Sem pop-ups nativos) */}
              {proFeedback && (
                <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{proFeedback}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProFeedback(null)}
                    className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded-md cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* ABA 1: AGENDA, RESUMO FINANCEIRO E EXPEDIENTE PADRÃO (PASSO 3) */}
              {!isProTrialExpired && proSubTab === 'agenda' && (
                <div className="space-y-4">
                  {/* PASSO 3A: RESUMO FINANCEIRO DA PROFISSIONAL */}
                  {(() => {
                    const completedApps = myProAppointments.filter((a) => a.status === 'Concluído');
                    const scheduledApps = myProAppointments.filter((a) => a.status === 'Confirmado');

                    const completedRevenue = completedApps.reduce((acc, a) => acc + a.totalPrice, 0);
                    const completedTravelRevenue = completedApps.reduce((acc, a) => acc + a.travelFee, 0);
                    const completedServicesRevenue = completedRevenue - completedTravelRevenue;
                    const avgTicket = completedApps.length > 0 ? completedRevenue / completedApps.length : 0;

                    const scheduledTotalRevenue = scheduledApps.reduce((acc, a) => acc + a.totalPrice, 0);

                    return (
                      <>
                        <div className={`${panelTheme.modalHeaderBg} rounded-2xl shadow-xs overflow-hidden transition-all duration-200`}>
                          <div
                            onClick={() => setIsFinanceSummaryCollapsed(!isFinanceSummaryCollapsed)}
                            className="p-4 flex items-center justify-between flex-wrap gap-2 cursor-pointer hover:bg-white/5 transition select-none"
                          >
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                                <TrendingUp className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-200">
                                    Resumo Financeiro da Agenda
                                  </h3>
                                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                    100% Seu (0% Comissão)
                                  </span>
                                </div>
                                <p className="text-[10px] text-stone-400 mt-0.5">
                                  Métricas sobre atendimentos concluídos ({completedApps.length}) • Faturado: <strong className="text-emerald-400">R$ {completedRevenue.toFixed(2).replace('.', ',')}</strong>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-stone-400 hidden sm:inline">
                                {isFinanceSummaryCollapsed ? 'Expandir' : 'Recolher'}
                              </span>
                              <div className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-stone-300 text-xs transition">
                                {isFinanceSummaryCollapsed ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                )}
                              </div>
                            </div>
                          </div>

                          {!isFinanceSummaryCollapsed && (
                            <div className="p-4 pt-0 space-y-3 animate-in fade-in duration-200 border-t border-white/10">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
                                <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                                  <p className="text-[10px] text-stone-300">Receita Concluída</p>
                                  <p className="text-sm font-extrabold text-emerald-400 mt-0.5">
                                    R$ {completedRevenue.toFixed(2).replace('.', ',')}
                                  </p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                                  <p className="text-[10px] text-stone-300">Em Serviços (Concl.)</p>
                                  <p className="text-sm font-extrabold text-white mt-0.5">
                                    R$ {completedServicesRevenue.toFixed(2).replace('.', ',')}
                                  </p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                                  <p className="text-[10px] text-stone-300">Deslocamento (Concl.)</p>
                                  <p className="text-sm font-extrabold text-amber-300 mt-0.5">
                                    R$ {completedTravelRevenue.toFixed(2).replace('.', ',')}
                                  </p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                                  <p className="text-[10px] text-stone-300">Ticket Médio (Concl.)</p>
                                  <p className={`text-sm font-extrabold ${panelTheme.isDark ? 'text-amber-300' : 'text-rose-300'} mt-0.5`}>
                                    R$ {avgTicket.toFixed(0)}
                                  </p>
                                </div>
                              </div>

                              {/* Métrica de Valor Total de Atendimentos Agendados */}
                              <div className="bg-sky-500/15 border border-sky-400/30 rounded-xl p-3 flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-sky-300">
                                    Valor Total de Atendimentos Agendados
                                  </p>
                                  <p className="text-[10px] text-stone-300 mt-0.5">
                                    Previsão a receber dos {scheduledApps.length} atendimento(s) agendado(s)
                                  </p>
                                </div>
                                <p className="text-base sm:text-lg font-extrabold text-sky-300 shrink-0">
                                  R$ {scheduledTotalRevenue.toFixed(2).replace('.', ',')}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* CARD DE CONFIGURAÇÃO DE REGRAS & SINAL DE 50% (ANTI-FURO) */}
                        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5 sm:mt-0">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-extrabold text-sm text-stone-900">
                                  Regras de Agendamento & Sinal ({bookingRules.depositPercentage}%)
                                </h4>
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    bookingRules.requireDeposit
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-stone-200 text-stone-700'
                                  }`}
                                >
                                  {bookingRules.requireDeposit ? 'Sinal Ativo' : 'Sinal Desativado'}
                                </span>
                              </div>
                              <p className="text-xs text-stone-600 mt-0.5">
                                {bookingRules.requireDeposit
                                  ? `Sinal de ${bookingRules.depositPercentage}% para confirmar • PIX: ${bookingRules.pixKey || 'Não cadastrada'} • Tolerância: ${bookingRules.delayToleranceMinutes} min`
                                  : `Tolerância de atraso: ${bookingRules.delayToleranceMinutes} min • Remarcação: ${bookingRules.cancellationNoticeHours}h`}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowBookingRulesModal(true)}
                            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            Configurar Regras & Sinal
                          </button>
                        </div>

                        {/* 2. SESSÃO MASTER UNIFICADA: ATENDIMENTOS (AGENDADOS + CONCLUÍDOS) */}
                        <section className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden transition-all duration-200">
                          {/* CABEÇALHO DO MASTER CARD ATENDIMENTOS */}
                          <div className={`p-4 sm:p-5 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            panelTheme.isDark ? 'bg-stone-900/40' : 'bg-gradient-to-r from-rose-50/80 via-white to-stone-50'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-2xl ${panelTheme.accentBadgeDark} flex items-center justify-center text-xl shadow-xs shrink-0`}>
                                <Calendar className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-stone-900">
                                    Atendimentos
                                  </h3>
                                  <span className={`${panelTheme.accentBadgeDark} text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full`}>
                                    {scheduledApps.length} agendado(s)
                                  </span>
                                  <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                                    {completedApps.length} concluído(s)
                                  </span>
                                </div>
                                <p className="text-xs text-stone-500 font-medium mt-0.5">
                                  Gestão completa de agendamentos pendentes e histórico de atendimentos realizados
                                </p>
                              </div>
                            </div>

                            {/* Ações do Topo: Margem, Novo Agendamento e Botão Expandir/Recolher */}
                            <div className="flex items-center gap-1.5 sm:gap-2 self-start w-full sm:w-auto sm:self-auto justify-between sm:justify-end flex-wrap">
                              <span className={`text-xs font-bold ${panelTheme.primaryText} ${panelTheme.primaryBgLight} border ${panelTheme.primaryBorderLight} px-3 py-1.5 rounded-xl shadow-2xs`}>
                                ⏱️ {proBufferTime} min margem
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowManualAppointmentModal(true)}
                                className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer ${
                                  panelTheme.isDark
                                    ? 'bg-amber-500 hover:bg-amber-600 text-stone-900'
                                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                + Novo Agendamento
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsAtendimentosCollapsed(!isAtendimentosCollapsed)}
                                className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold border border-stone-200 select-none"
                                title={isAtendimentosCollapsed ? 'Expandir sessão' : 'Recolher sessão'}
                              >
                                <span className="hidden sm:inline">
                                  {isAtendimentosCollapsed ? 'Expandir' : 'Recolher'}
                                </span>
                                {isAtendimentosCollapsed ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* CORPO UNIFICADO DE ATENDIMENTOS */}
                          {!isAtendimentosCollapsed && (
                            <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
                              {/* SELETOR DE VISUALIZAÇÃO INTERNA (SUB-TABS) */}
                              <div className="flex items-center justify-between border-b border-stone-200 pb-3 flex-wrap gap-2">
                                <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs font-bold">
                                  <button
                                    type="button"
                                    onClick={() => setAppointmentsFilter('ALL')}
                                    className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                                      appointmentsFilter === 'ALL'
                                        ? 'bg-white text-stone-900 shadow-xs'
                                        : 'text-stone-600 hover:text-stone-900'
                                    }`}
                                  >
                                    Todos ({scheduledApps.length + completedApps.length})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAppointmentsFilter('SCHEDULED')}
                                    className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                                      appointmentsFilter === 'SCHEDULED'
                                        ? 'bg-white text-stone-900 shadow-xs'
                                        : 'text-stone-600 hover:text-stone-900'
                                    }`}
                                  >
                                    🔴 Agendados ({scheduledApps.length})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAppointmentsFilter('COMPLETED')}
                                    className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                                      appointmentsFilter === 'COMPLETED'
                                        ? 'bg-white text-stone-900 shadow-xs'
                                        : 'text-stone-600 hover:text-stone-900'
                                    }`}
                                  >
                                    🟢 Concluídos ({completedApps.length})
                                  </button>
                                </div>

                                <div className="text-xs text-stone-500 font-medium">
                                  Faturamento acumulado:{' '}
                                  <strong className="text-emerald-700 font-extrabold">
                                    R$ {completedRevenue.toFixed(2).replace('.', ',')}
                                  </strong>
                                </div>
                              </div>

                              {/* SUB-BLOCO A: AGENDADOS */}
                              {(appointmentsFilter === 'ALL' || appointmentsFilter === 'SCHEDULED') && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2.5 h-2.5 rounded-full ${panelTheme.isDark ? 'bg-amber-500' : 'bg-rose-600'}`}></span>
                                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-800">
                                        Agendados Pendentes ({scheduledApps.length})
                                      </h4>
                                    </div>
                                    <span className="text-xs text-stone-400 font-medium">
                                      Total a receber: R$ {scheduledTotalRevenue.toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>

                          {scheduledApps.length === 0 ? (
                            <div className="text-center py-7 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-stone-400 p-4 space-y-3">
                              <Calendar className="w-8 h-8 mx-auto text-stone-300" />
                              <div>
                                <p className="text-xs sm:text-sm font-bold text-stone-700">
                                  Nenhum atendimento agendado pendente no momento.
                                </p>
                                <p className="text-[11px] text-stone-500 mt-1 max-w-md mx-auto">
                                  Cadastre manualmente atendimentos recebidos via WhatsApp ou compartilhe o link da sua vitrine com seus clientes.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowManualAppointmentModal(true)}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                                  panelTheme.isDark
                                    ? 'bg-amber-500 hover:bg-amber-600 text-stone-900'
                                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Cadastrar Agendamento Manual
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {scheduledApps.map((item, index) => (
                                <div
                                  key={item.id}
                                  className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-2 relative overflow-hidden transition"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-sm text-stone-900 bg-white px-2.5 py-1 rounded-xl border border-stone-200 shadow-sm">
                                        {item.time}
                                      </span>
                                      <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <p className="font-bold text-xs text-stone-900">{item.clientName}</p>
                                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                            Agendado
                                          </span>
                                          {item.locationType === 'STUDIO' ? (
                                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800">
                                              🏢 No Studio
                                            </span>
                                          ) : (
                                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                                              🏡 A Domicílio
                                            </span>
                                          )}
                                        </div>
                                        <p className={`text-[11px] ${panelTheme.primaryText} font-semibold`}>
                                          {item.serviceName} • {item.date.split('-').reverse().join('/')}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                      {bookingRules.requireDeposit && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const nextPaid = !item.depositPaid;
                                            setProAppointments((prev) => {
                                              const updated = prev.map((a) => (a.id === item.id ? { ...a, depositPaid: nextPaid } : a));
                                              try {
                                                localStorage.setItem('belladoor_v2_appointments', JSON.stringify(updated));
                                              } catch {}
                                              syncDocumentToFirestore('appointments', { items: updated });
                                              return updated;
                                            });
                                          }}
                                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                                            item.depositPaid
                                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                              : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                          }`}
                                          title="Clique para alternar o status do sinal de 50%"
                                        >
                                          <ShieldCheck className="w-3 h-3" />
                                          {item.depositPaid
                                            ? 'Sinal Pago'
                                            : `Sinal R$ ${(item.depositAmount || item.totalPrice * 0.5).toFixed(2).replace('.', ',')} (Aguardando)`}
                                        </button>
                                      )}
                                      <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                        Total: R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                                      </span>
                                    </div>
                                  </div>

                                  <p className="text-xs text-stone-600 flex items-center gap-1.5 pt-1">
                                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                    <span className="truncate">
                                      {item.locationType === 'STUDIO'
                                        ? (proBusinessNiche === 'BARBERSHOP'
                                            ? `🏢 Na Barbearia: ${item.address}`
                                            : `🏢 No seu Studio: ${item.address}`)
                                        : (proBusinessNiche === 'BARBERSHOP'
                                            ? `🏡 Endereço do cliente: ${item.address} (${item.neighborhood})`
                                            : `🏡 Casa da cliente: ${item.address} (${item.neighborhood})`)}
                                    </span>
                                  </p>

                                  {/* Botões de Lembrete Anti-Furo (WhatsApp) e Ações Rápidas */}
                                  <div className="pt-2 space-y-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {(() => {
                                        const isDepositPending = Boolean(bookingRules.requireDeposit && !item.depositPaid);
                                        const actionTitle = isDepositPending
                                          ? 'Cobrar Sinal no WhatsApp'
                                          : bookingRules.requireDeposit
                                          ? '✅ Horário Confirmado'
                                          : (proBusinessNiche === 'BARBERSHOP' ? 'Lembrar / Confirmar Horário' : 'Confirmar & Regras WhatsApp');

                                        const actionBtnClasses = isDepositPending
                                          ? 'py-2 px-3 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition shadow-sm'
                                          : 'py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition shadow-sm';

                                        const actionTooltip = isDepositPending
                                          ? 'Enviar dados do PIX e prazo de pagamento do sinal para a cliente'
                                          : 'Enviar confirmação oficial de agendamento (sinal já recebido)';

                                        const commonActionBtn = (
                                          <a
                                            href={`https://wa.me/55${item.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                              formatConfirmationMessage({
                                                settings: bookingRules,
                                                booking: item,
                                                proName: proDisplayName || currentUser?.fullName || (proBusinessNiche === 'BARBERSHOP' ? 'seu barbeiro' : 'sua profissional'),
                                                proWhatsapp,
                                                isBarbershop: proBusinessNiche === 'BARBERSHOP',
                                              })
                                            )}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={actionBtnClasses}
                                            title={actionTooltip}
                                          >
                                            {isDepositPending ? (
                                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                            ) : (
                                              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                                            )}
                                            {actionTitle}
                                          </a>
                                        );

                                        return item.locationType === 'STUDIO' ? (
                                          <>
                                            {commonActionBtn}
                                            <a
                                              href={`https://wa.me/55${item.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                                proBusinessNiche === 'BARBERSHOP'
                                                  ? `Fala, ${item.clientName}! 💈 Aqui é o *${proDisplayName || currentUser?.fullName || 'seu barbeiro'}*. Passando pra avisar que já tô na barbearia pronto pra te atender no seu horário das *${item.time}* (${item.address})! Só encostar, irmão! ✂️👊`
                                                  : `Olá, ${item.clientName}! ✨ Aqui é *${proDisplayName || currentUser?.fullName || 'sua profissional'}* do *BellaDoor*. Seu atendimento das ${item.time} está confirmado e já estou pronta te aguardando no Studio (${item.address})! Até já!`
                                              )}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="py-2 px-3 bg-white hover:bg-purple-50 text-purple-800 border border-purple-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow-2xs"
                                              title="Avisar que já está aguardando o cliente"
                                            >
                                              <span>{proBusinessNiche === 'BARBERSHOP' ? '💈' : '🏢'}</span>
                                              {proBusinessNiche === 'BARBERSHOP' ? 'Avisar: Tô na Barbearia' : 'Avisar: Aguardo no Studio'}
                                            </a>
                                          </>
                                        ) : (
                                          <>
                                            {commonActionBtn}
                                            <a
                                              href={`https://wa.me/55${item.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                                proBusinessNiche === 'BARBERSHOP'
                                                  ? `Fala, ${item.clientName}! 🚗💈 Aqui é o *${proDisplayName || currentUser?.fullName || 'seu barbeiro'}*. Já peguei a rota e tô a caminho do seu endereço (${item.address}) com as ferramentas pro nosso horário das *${item.time}*! Chego em instantes, irmão! 👊`
                                                  : `Olá, ${item.clientName}! 🚗✨ Aqui é *${proDisplayName || currentUser?.fullName || 'sua profissional'}* do *BellaDoor*. Já estou a caminho do seu endereço (${item.address}) para o nosso atendimento das ${item.time}! Até já!`
                                              )}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="py-2 px-3 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow-2xs"
                                              title="Avisar no WhatsApp que você já está a caminho"
                                            >
                                              <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                              {proBusinessNiche === 'BARBERSHOP' ? 'Avisar: Tô a Caminho' : 'Avisar: Estou a Caminho'}
                                            </a>
                                          </>
                                        );
                                      })()}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.address}, ${item.neighborhood}, ${proBaseCity || 'Brasil'}`)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 py-2 px-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                                      >
                                        <Navigation className="w-3.5 h-3.5 shrink-0" />
                                        Abrir GPS (Waze/Maps)
                                      </a>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setProAppointments((prev) => {
                                            const updated = prev.map((a) =>
                                              a.id === item.id ? { ...a, status: 'Concluído' } : a
                                            );
                                            try {
                                              localStorage.setItem('belladoor_v2_appointments', JSON.stringify(updated));
                                            } catch {}
                                            syncDocumentToFirestore('appointments', { items: updated });
                                            return updated;
                                          });
                                          showProSuccess(
                                            proBusinessNiche === 'BARBERSHOP'
                                              ? `✅ Atendimento de ${item.clientName} concluído e contabilizado no financeiro! Avaliação liberada para o cliente.`
                                              : `✅ Atendimento de ${item.clientName} concluído e contabilizado no financeiro! Avaliação liberada para a cliente.`
                                          );
                                        }}
                                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1 shadow-xs"
                                        title={proBusinessNiche === 'BARBERSHOP' ? 'Marcar atendimento como concluído e liberar avaliação para o cliente' : 'Marcar atendimento como concluído e liberar avaliação para a cliente'}
                                      >
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        Concluir
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleCancelClientAppointment(item.id, item.serviceName)
                                        }
                                        className="px-2.5 py-2 bg-white hover:bg-red-50 text-stone-500 hover:text-red-600 border border-stone-200 hover:border-red-200 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                                        title="Cancelar agendamento e liberar horário na vitrine"
                                      >
                                        <X className="w-3.5 h-3.5 shrink-0" />
                                        Liberar Horário
                                      </button>
                                    </div>
                                  </div>

                                  {/* Indicador inteligente de tempo de deslocamento entre atendimentos agendados */}
                                  {index < scheduledApps.length - 1 && (() => {
                                    const nextApp = scheduledApps[index + 1];
                                    const isBothStudio = item.locationType === 'STUDIO' && nextApp.locationType === 'STUDIO';
                                    if (isBothStudio) {
                                      return (
                                        <div className="text-[10px] text-purple-700 bg-purple-50/70 py-1.5 px-3 rounded-xl border border-purple-200/80 flex items-center gap-1.5 justify-center mt-2.5 shadow-2xs">
                                          <span>🏢</span>
                                          <span className="font-semibold">Atendimentos consecutivos no Studio: sem necessidade de trânsito</span>
                                        </div>
                                      );
                                    }
                                    const transitionLabel =
                                      item.locationType === 'STUDIO' && nextApp.locationType !== 'STUDIO'
                                        ? `Deslocamento Studio ➔ Domicílio`
                                        : item.locationType !== 'STUDIO' && nextApp.locationType === 'STUDIO'
                                        ? `Retorno Domicílio ➔ Studio`
                                        : `Trânsito entre clientes a domicílio`;
                                    return (
                                      <div className="text-[10px] text-stone-600 bg-stone-100/80 py-1.5 px-3 rounded-xl border border-stone-200 flex items-center gap-1.5 justify-center mt-2.5 shadow-2xs">
                                        <Car className="w-3 h-3 text-rose-600 shrink-0" />
                                        <span>+{proBufferTime} min bloqueados na agenda ({transitionLabel})</span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              ))}
                            </div>
                          )}
                                </div>
                              )}

                              {/* SUB-BLOCO B: CONCLUÍDOS */}
                              {(appointmentsFilter === 'ALL' || appointmentsFilter === 'COMPLETED') && (
                                <div className="space-y-3 pt-2">
                                  <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-800">
                                        Atendimentos Concluídos ({completedApps.length})
                                      </h4>
                                    </div>
                                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                      Faturado: R$ {completedRevenue.toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>

                          {completedApps.length === 0 ? (
                            <div className="text-center py-6 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-stone-400">
                              <CheckCircle className="w-8 h-8 mx-auto mb-1.5 opacity-40" />
                              <p className="text-xs font-semibold text-stone-500">
                                Nenhum atendimento concluído ainda. Ao clicar em &ldquo;Concluir&rdquo;, ele aparecerá aqui e será somado ao seu Resumo Financeiro.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {completedApps.map((item) => (
                                <div
                                  key={item.id}
                                  className="p-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 space-y-2 relative overflow-hidden transition"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-xs text-emerald-900 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 shadow-2xs">
                                        {item.time}
                                      </span>
                                      <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <p className="font-bold text-xs text-stone-900">{item.clientName}</p>
                                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-600 text-white">
                                            Concluído
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-stone-600 font-semibold">
                                          {item.serviceName} • {item.date.split('-').reverse().join('/')}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-xs font-extrabold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                                      R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                                    <p className="text-[11px] text-stone-500 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                                      <span className="truncate">{item.address} ({item.neighborhood})</span>
                                    </p>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {!item.reviewed && item.clientPhone && (
                                        <a
                                          href={`https://wa.me/55${item.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                            proBusinessNiche === 'BARBERSHOP'
                                              ? `Fala, ${item.clientName}! 💈 Valeu demais pela moral e pela presença de hoje no atendimento de *${item.serviceName}*!\n\n` +
                                                `Se puder fortalecer com uma avaliação rápida de 5 estrelas lá na minha vitrine do *BellaDoor*, ajuda demais o trampo:\n👉 ${getDirectVitrineUrl()}\n\nTamo junto, até o próximo corte! 👊🔥`
                                              : `Olá, ${item.clientName}! 💖 Muito obrigada pela confiança no nosso atendimento de *${item.serviceName}*!\n\n` +
                                                `Se puder deixar sua avaliação com estrelinhas na minha vitrine do *BellaDoor*, me ajuda muito:\n👉 ${getDirectVitrineUrl()}`
                                          )}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-2xs transition"
                                          title="Pedir avaliação no WhatsApp"
                                        >
                                          <MessageCircle className="w-3.5 h-3.5" />
                                          Pedir Avaliação no WhatsApp
                                        </a>
                                      )}
                                      <span
                                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 border ${
                                          item.reviewed
                                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                                            : 'bg-white text-stone-600 border-stone-200'
                                        }`}
                                      >
                                        {item.reviewed
                                          ? (proBusinessNiche === 'BARBERSHOP' ? '⭐ Avaliado pelo cliente' : '⭐ Avaliado pela cliente')
                                          : (proBusinessNiche === 'BARBERSHOP' ? '🔓 Avaliação liberada p/ cliente' : '🔓 Avaliação liberada p/ cliente')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                                </div>
                              )}
                            </div>
                          )}
                        </section>
                      </>
                    );
                  })()}

                  {/* 3. SESSÃO MASTER UNIFICADA: EXPEDIENTES & AGENDA */}
                  <section className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden transition-all duration-200 mt-6">
                    {/* CABEÇALHO DO MASTER CARD EXPEDIENTES */}
                    <div className="bg-gradient-to-r from-emerald-50/80 via-white to-stone-50 p-4 sm:p-5 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-stone-900">
                              Expediente & Bloqueios de Agenda
                            </h3>
                            <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                              {workingDays.length} dias • {String(workStartHour).padStart(2, '0')}h às{' '}
                              {String(workEndHour).padStart(2, '0')}h
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 font-medium mt-0.5">
                            Configure dias de atendimento, horários de trabalho, intervalo de almoço e bloqueios de folga/férias
                          </p>
                        </div>
                      </div>

                      {/* Ações do Topo */}
                      <div className="flex items-center gap-1.5 sm:gap-2 self-start w-full sm:w-auto sm:self-auto justify-between sm:justify-end flex-wrap">
                        {isScheduleDirty ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0 animate-pulse">
                            ● Alterações pendentes
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl shrink-0">
                            ✓ Expediente Salvo
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsScheduleCollapsed(!isScheduleCollapsed)}
                          className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold border border-stone-200 select-none"
                          title={isScheduleCollapsed ? 'Expandir sessão' : 'Recolher sessão'}
                        >
                          <span className="hidden sm:inline">
                            {isScheduleCollapsed ? 'Expandir' : 'Recolher'}
                          </span>
                          {isScheduleCollapsed ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronUp className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CORPO UNIFICADO DE EXPEDIENTE */}
                    {!isScheduleCollapsed && (
                      <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
                        {/* 1. CONFIGURAÇÃO DE EXPEDIENTE PADRÃO (DIAS DA SEMANA + HORÁRIOS + ALMOÇO) */}
                        <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-stone-900">
                            Expediente Padrão (Dias & Horários)
                          </h4>
                          <p className="text-[11px] text-stone-500">
                            Defina seus dias fixos e horários. Clique em &ldquo;Confirmar&rdquo; para aplicar na vitrine.
                          </p>
                        </div>
                      </div>
                      {isScheduleDirty ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 animate-pulse">
                          ● Alterações pendentes
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          ✓ Expediente salvo
                        </span>
                      )}
                    </div>

                    {/* Botões dos Dias da Semana */}
                    <div className="grid grid-cols-7 gap-1.5 pt-1">
                      {WEEKDAYS.map((wd) => {
                        const isActive = draftWorkingDays.includes(wd.index);
                        return (
                          <button
                            key={wd.index}
                            type="button"
                            onClick={() => toggleWorkingDay(wd.index)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition border cursor-pointer ${
                              isActive
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300'
                            }`}
                            title={isActive ? `${wd.full}: Atendimento ativo` : `${wd.full}: Folga semanal`}
                          >
                            <span className="text-[11px]">{wd.short}</span>
                            <span className="text-[9px] mt-0.5 opacity-90">
                              {isActive ? '✓ Atende' : 'Folga'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Atalhos de Rotina Semanal */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="text-stone-400 font-medium">Atalhos rápidos:</span>
                      <button
                        type="button"
                        onClick={() => setDraftWorkingDays([1, 2, 3, 4, 5, 6])}
                        className="bg-white border border-stone-200 px-2 py-0.5 rounded-md hover:border-emerald-500 transition text-stone-700 cursor-pointer"
                      >
                        Seg a Sáb (Mais comum)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraftWorkingDays([2, 3, 4, 5, 6])}
                        className="bg-white border border-stone-200 px-2 py-0.5 rounded-md hover:border-emerald-500 transition text-stone-700 cursor-pointer"
                      >
                        Ter a Sáb (Salão)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraftWorkingDays([1, 2, 3, 4, 5])}
                        className="bg-white border border-stone-200 px-2 py-0.5 rounded-md hover:border-emerald-500 transition text-stone-700 cursor-pointer"
                      >
                        Seg a Sex
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraftWorkingDays([0, 1, 2, 3, 4, 5, 6])}
                        className="bg-white border border-stone-200 px-2 py-0.5 rounded-md hover:border-emerald-500 transition text-stone-700 cursor-pointer"
                      >
                        Todos os Dias
                      </button>
                    </div>

                    {/* Configuração de Horário de Início, Fim, Almoço e Margem de Trânsito */}
                    <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-3">
                      <p className="text-[11px] font-extrabold text-stone-800">
                        ⏰ Horários do Expediente Diário:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-600 mb-1">
                            Início dos Atendimentos:
                          </label>
                          <select
                            value={draftWorkStartHour}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setDraftWorkStartHour(val);
                              if (draftWorkEndHour <= val) setDraftWorkEndHour(val + 1);
                            }}
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          >
                            {[7, 8, 9, 10, 11].map((h) => (
                              <option key={h} value={h}>
                                {String(h).padStart(2, '0')}:00
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-stone-600 mb-1">
                            Término do Expediente:
                          </label>
                          <select
                            value={draftWorkEndHour}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setDraftWorkEndHour(val);
                            }}
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          >
                            {[16, 17, 18, 19, 20, 21].map((h) => (
                              <option key={h} value={h}>
                                {String(h).padStart(2, '0')}:00
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-stone-600 mb-1">
                            Margem de Trânsito:
                          </label>
                          <select
                            value={draftBufferTime}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setDraftBufferTime(val);
                            }}
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          >
                            {[15, 20, 30, 45, 60].map((m) => (
                              <option key={m} value={m}>
                                {m} min entre clientes
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Toggle de Pausa para Almoço */}
                      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                        <div className="flex items-center gap-2">
                          <Coffee className="w-4 h-4 text-amber-600" />
                          <div>
                            <p className="text-xs font-bold text-stone-800">
                              Bloquear Pausa de Almoço (12:00 às 13:00)
                            </p>
                            <p className="text-[10px] text-stone-500">
                              Oculta automaticamente o horário das 12h na vitrine da cliente
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDraftLunchBreakEnabled(!draftLunchBreakEnabled)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition cursor-pointer ${
                            draftLunchBreakEnabled
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-stone-100 text-stone-500 border border-stone-200'
                          }`}
                        >
                          {draftLunchBreakEnabled ? '✓ Almoço Bloqueado' : 'Liberado'}
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-500 bg-white p-2.5 rounded-xl border border-stone-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Sua agenda está configurada para <strong>{draftWorkingDays.length} dias por semana</strong>, das{' '}
                        <strong>{String(draftWorkStartHour).padStart(2, '0')}:00</strong> às{' '}
                        <strong>{String(draftWorkEndHour).padStart(2, '0')}:00</strong>.
                      </span>
                    </div>

                    {/* Botões de Ação: Descartar / Confirmar */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-200">
                      {isScheduleDirty && (
                        <button
                          type="button"
                          onClick={() => {
                            setDraftWorkingDays(workingDays);
                            setDraftWorkStartHour(workStartHour);
                            setDraftWorkEndHour(workEndHour);
                            setDraftLunchBreakEnabled(lunchBreakEnabled);
                            setDraftBufferTime(proBufferTime);
                          }}
                          className="text-xs text-stone-500 hover:text-stone-800 font-semibold px-3 py-2 rounded-xl transition cursor-pointer"
                        >
                          Descartar alterações
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleConfirmSchedule}
                        className={`text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                          isScheduleDirty
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md ring-2 ring-rose-500/20'
                            : 'bg-stone-900 hover:bg-stone-800 text-white shadow-2xs'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        Confirmar Horários do Expediente
                      </button>
                    </div>
                  </div>

                  {/* 2. GERENCIADOR DE FECHAMENTO DE AGENDA POR PERÍODO COM CALENDÁRIO INTERATIVO */}
                  <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-500 text-white rounded-lg">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-stone-900">Fechar Agenda / Bloquear Período</h4>
                          <p className="text-[11px] text-stone-500">
                            Bloqueie férias, cursos, feriados prolongados ou dias específicos com início e fim.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                        {blockedPeriods.length} período(s) fechado(s)
                      </span>
                    </div>

                    {/* CALENDÁRIO INTERATIVO DA PROFISSIONAL PARA SELEÇÃO DE PERÍODO */}
                    <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CalendarRange className="w-3.5 h-3.5 text-rose-600" />
                          <span className="text-xs font-bold text-stone-900">
                            Selecione o período clicando no calendário:
                          </span>
                        </div>

                        {/* Navegação de Mês da Profissional */}
                        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs">
                          <button
                            type="button"
                            disabled={
                              proCalendarYear < currentRealYear ||
                              (proCalendarYear === currentRealYear && proCalendarMonth <= currentRealMonth)
                            }
                            onClick={handleProPrevMonth}
                            className={`p-1 rounded transition ${
                              proCalendarYear < currentRealYear ||
                              (proCalendarYear === currentRealYear && proCalendarMonth <= currentRealMonth)
                                ? 'text-stone-300 cursor-not-allowed'
                                : 'text-stone-700 hover:bg-white'
                            }`}
                            title="Mês anterior"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <span className="font-extrabold text-stone-900 px-1.5 text-[11px]">
                            {monthNames[proCalendarMonth]} {proCalendarYear}
                          </span>
                          <button
                            type="button"
                            onClick={handleProNextMonth}
                            className="p-1 rounded text-stone-700 hover:bg-white transition"
                            title="Próximo mês"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Guia da Ação de Clique */}
                      <div className="flex items-center justify-between bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200 text-[10px]">
                        <span className="text-stone-600 font-medium">
                          {rangeSelectStep === 'START' ? (
                            <span className="text-rose-600 font-bold flex items-center gap-1">
                              👉 1º Passo: Clique na data de <strong>INÍCIO</strong> do bloqueio
                            </span>
                          ) : (
                            <span className="text-purple-600 font-bold flex items-center gap-1">
                              👉 2º Passo: Clique na data de <strong>TÉRMINO</strong> do bloqueio
                            </span>
                          )}
                        </span>
                        <span className="text-stone-400">
                          {getDatesInRange(newBlockStartDate, newBlockEndDate).length} dia(s) selecionado(s)
                        </span>
                      </div>

                      {/* Cabeçalho dos Dias da Semana */}
                      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                        <span>Dom</span>
                        <span>Seg</span>
                        <span>Ter</span>
                        <span>Qua</span>
                        <span>Qui</span>
                        <span>Sex</span>
                        <span>Sáb</span>
                      </div>

                      {/* Grid de Dias do Calendário da Profissional */}
                      {(() => {
                        const daysInMonth = new Date(proCalendarYear, proCalendarMonth + 1, 0).getDate();
                        const firstDayOfWeek = new Date(proCalendarYear, proCalendarMonth, 1).getDay();
                        const monthPadded = (proCalendarMonth + 1).toString().padStart(2, '0');

                        return (
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                              <div key={`pro-empty-${i}`} className="h-9" />
                            ))}

                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                              const dateStr = `${proCalendarYear}-${monthPadded}-${day.toString().padStart(2, '0')}`;
                              const dayOfWeek = new Date(proCalendarYear, proCalendarMonth, day).getDay();
                              const isPast = dateStr < todayIsoDateStr;
                              const isAlreadyBlocked = blockedPeriods.some((bp) => bp.dates.includes(dateStr));
                              const isWorkingDay = workingDays.includes(dayOfWeek);
                              const hasAppointment = myProAppointments.some(
                                (a) => a.date === dateStr && a.status !== 'Cancelado'
                              );

                              // Intervalo atual selecionado
                              const isStart = dateStr === newBlockStartDate;
                              const isEnd = dateStr === newBlockEndDate;
                              const isInSelectedRange =
                                newBlockStartDate &&
                                newBlockEndDate &&
                                dateStr >= newBlockStartDate &&
                                dateStr <= newBlockEndDate;

                              return (
                                <button
                                  key={day}
                                  type="button"
                                  disabled={isPast}
                                  onClick={() => handleProCalendarDateClick(dateStr)}
                                  className={`h-9 rounded-lg text-xs font-bold flex flex-col items-center justify-center relative transition ${
                                    isPast
                                      ? 'text-stone-300 cursor-not-allowed bg-stone-50/50'
                                      : isStart || isEnd
                                      ? 'bg-rose-600 text-white font-extrabold shadow-sm scale-105 z-10'
                                      : isInSelectedRange
                                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                      : isAlreadyBlocked
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                                      : !isWorkingDay
                                      ? 'bg-stone-100/70 text-stone-400 border border-dashed border-stone-200 hover:bg-rose-50'
                                      : 'bg-white border border-stone-200 text-stone-800 hover:bg-rose-50 hover:border-rose-400'
                                  }`}
                                  title={
                                    isAlreadyBlocked
                                      ? 'Data já bloqueada'
                                      : hasAppointment
                                      ? 'Contém atendimentos agendados'
                                      : !isWorkingDay
                                      ? 'Folga semanal padrão'
                                      : 'Clique para selecionar início/término do bloqueio'
                                  }
                                >
                                  <span>{day}</span>
                                  {isAlreadyBlocked && (
                                    <Lock className="w-2 h-2 text-amber-700 absolute bottom-0.5" />
                                  )}
                                  {hasAppointment && !isAlreadyBlocked && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1 right-1" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Formulário com Inputs de Início, Fim e Motivo */}
                    <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-700 mb-1">
                            Data de Início do Bloqueio:*
                          </label>
                          <input
                            type="date"
                            value={newBlockStartDate}
                            min={todayIsoDateStr}
                            onChange={(e) => {
                              setNewBlockStartDate(e.target.value);
                              if (newBlockEndDate < e.target.value) {
                                setNewBlockEndDate(e.target.value);
                              }
                            }}
                            className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-700 mb-1">
                            Data de Término do Bloqueio:*
                          </label>
                          <input
                            type="date"
                            value={newBlockEndDate}
                            min={newBlockStartDate || todayIsoDateStr}
                            onChange={(e) => setNewBlockEndDate(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-700 mb-1">
                          Motivo do Fechamento / Folga:
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Férias, Viagem, Curso Masterclass, Folga de Feriado"
                          value={newBlockReason}
                          onChange={(e) => setNewBlockReason(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      {/* Resumo do Período Selecionado */}
                      {(() => {
                        const count = getDatesInRange(newBlockStartDate, newBlockEndDate).length;
                        return (
                          <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-amber-900">
                              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>
                                Período de <strong>{count} dia(s)</strong>: de{' '}
                                <strong>{newBlockStartDate.split('-').reverse().join('/')}</strong> até{' '}
                                <strong>{newBlockEndDate.split('-').reverse().join('/')}</strong>
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      <button
                        type="button"
                        onClick={() => {
                          if (!newBlockStartDate) {
                            setUiDialog({
                              emoji: '📅',
                              badge: 'Atenção',
                              title: 'Selecione a Data de Início',
                              message:
                                'Escolha ao menos a data de início no calendário ou no campo de data para bloquear o período na sua agenda.',
                              buttonText: 'Entendi',
                              variant: 'warning',
                            });
                            return;
                          }
                          const dates = getDatesInRange(newBlockStartDate, newBlockEndDate);
                          const newPeriod = {
                            id: `blk-${Date.now()}`,
                            startDate: newBlockStartDate,
                            endDate: newBlockEndDate || newBlockStartDate,
                            reason: newBlockReason.trim() || 'Folga / Indisponível',
                            dates,
                          };

                          setBlockedPeriods([...blockedPeriods, newPeriod]);
                          setNewBlockReason('');
                          setUiDialog({
                            emoji: '🔒',
                            badge: 'Agenda Atualizada',
                            title: 'Período Bloqueado com Sucesso!',
                            message: `Foram fechados ${dates.length} dia(s) na sua agenda. Os clientes não conseguirão agendar atendimentos nessas datas.`,
                            highlight: `De ${newBlockStartDate.split('-').reverse().join('/')} até ${(newBlockEndDate || newBlockStartDate).split('-').reverse().join('/')} • ${newPeriod.reason}`,
                            buttonText: 'Perfeito!',
                            variant: 'warning',
                          });
                        }}
                        className="w-full py-2.5 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        Confirmar Bloqueio do Período ({getDatesInRange(newBlockStartDate, newBlockEndDate).length} dias)
                      </button>
                    </div>

                    {/* Atalhos Rápidos de Período */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-stone-600">
                      <span className="text-stone-400 pt-0.5">Atalhos rápidos:</span>
                      {[
                        { label: 'Fechar Amanhã (1 dia)', start: '2026-10-07', end: '2026-10-07', reason: 'Folga Rápida' },
                        { label: 'Fim de Semana (10 a 11/10)', start: '2026-10-10', end: '2026-10-11', reason: 'Descanso Fim de Semana' },
                        { label: 'Feriado Prolongado (3 dias)', start: '2026-10-12', end: '2026-10-14', reason: 'Feriado' },
                        { label: '1 Semana de Férias (7 dias)', start: '2026-11-02', end: '2026-11-08', reason: 'Férias' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setNewBlockStartDate(item.start);
                            setNewBlockEndDate(item.end);
                            setNewBlockReason(item.reason);
                          }}
                          className="bg-white border border-stone-200 px-2 py-0.5 rounded-md hover:border-amber-400 transition"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Lista dos Períodos Bloqueados */}
                    {blockedPeriods.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                          Períodos Fechados na Agenda:
                        </p>
                        {blockedPeriods.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between text-xs hover:border-stone-300 transition"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                                <Lock className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-stone-900">
                                    {item.startDate.split('-').reverse().join('/')} até{' '}
                                    {item.endDate.split('-').reverse().join('/')}
                                  </p>
                                  <span className="text-[10px] font-extrabold bg-stone-100 text-stone-600 px-2 py-0.2 rounded-md">
                                    {item.dates.length} dia(s)
                                  </span>
                                </div>
                                <p className="text-[11px] text-stone-500 mt-0.5">{item.reason}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setBlockedPeriods(blockedPeriods.filter((b) => b.id !== item.id));
                              }}
                              className="text-[11px] text-rose-600 hover:text-rose-800 font-bold px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition border border-rose-200"
                            >
                              Reabrir Período
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {/* ABA 2: GESTÃO DE SERVIÇOS, PREÇOS E SIMULAÇÃO DE DESLOCAMENTO */}
              {!isProTrialExpired && proSubTab === 'services' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {serviceFormMode === 'LIST' ? (
                    /* ======================================================== */
                    /* VISÃO 1: CATÁLOGO DE SERVIÇOS DA PROFISSIONAL            */
                    /* ======================================================== */
                    <>
                      {/* Banner Superior de Catálogo */}
                      <div className={`${panelTheme.modalHeaderBg} p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3`}>
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${panelTheme.isDark ? 'text-amber-300 bg-stone-900 border-amber-500/30' : 'text-rose-300 bg-rose-900/60 border-rose-700/50'} px-2 py-0.5 rounded-full border`}>
                            <Sparkles className={`w-3 h-3 ${panelTheme.isDark ? 'text-amber-300' : 'text-rose-300'}`} /> Catálogo Oficial
                          </span>
                          <h3 className="font-extrabold text-sm sm:text-base text-white">
                            Meus Serviços & Preços
                          </h3>
                          <p className="text-[11px] text-white/80">
                            Gerencie valores, tempo de duração e destaque seus serviços mais pedidos.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={openCreateServicePage}
                          className={`shrink-0 px-3.5 py-2.5 ${panelTheme.primaryBtn} rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer`}
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          Novo Serviço
                        </button>
                      </div>

                      {/* Resumo Rápido do Catálogo + Atalho de Deslocamento */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-2xl">
                          <p className="text-[10px] text-stone-500 font-medium">Serviços Ativos</p>
                          <p className="text-sm font-extrabold text-stone-900 mt-0.5">{proServicesList.length}</p>
                        </div>
                        <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-2xl">
                          <p className="text-[10px] text-stone-500 font-medium">Ticket Médio</p>
                          <p className={`text-sm font-extrabold ${panelTheme.primaryText} mt-0.5`}>
                            R${' '}
                            {proServicesList.length > 0
                              ? (
                                  proServicesList.reduce((acc, s) => acc + s.price, 0) /
                                  proServicesList.length
                                ).toFixed(0)
                              : '0'}
                          </p>
                        </div>
                        <div
                          onClick={() => {
                            setProSubTab('areas');
                            setAreaFormMode('LIST');
                          }}
                          className={`${panelTheme.primaryBgLight} hover:opacity-90 border ${panelTheme.primaryBorderLight} p-2.5 rounded-2xl cursor-pointer transition`}
                          title="Ir para taxas de deslocamento"
                        >
                          <p className={`text-[10px] ${panelTheme.primaryText} font-bold flex items-center justify-center gap-1`}>
                            <Car className="w-3 h-3" /> Deslocamento
                          </p>
                          <p className={`text-[11px] font-extrabold ${panelTheme.primaryText} mt-0.5 underline`}>
                            {proNeighborhoodsList.length} bairros ➔
                          </p>
                        </div>
                      </div>

                      {/* Lista de Cards de Serviços */}
                      <div className="space-y-3">
                        {proServicesList.length === 0 ? (
                          <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-2">
                            <Sparkles className={`w-7 h-7 ${panelTheme.primaryText} mx-auto`} />
                            <p className="text-xs font-bold text-stone-800">Nenhum serviço cadastrado ainda</p>
                            <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                              Adicione seus serviços para que seus clientes possam agendar pelo seu link exclusivo.
                            </p>
                            <button
                              type="button"
                              onClick={openCreateServicePage}
                              className={`mt-2 px-4 py-2 ${panelTheme.primaryBtn} rounded-xl text-xs font-bold shadow-sm cursor-pointer`}
                            >
                              + Cadastrar Primeiro Serviço
                            </button>
                          </div>
                        ) : (
                          proServicesList.map((service) => (
                            <div
                              key={service.id}
                              className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-stone-400 transition shadow-xs space-y-2.5"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-extrabold text-xs sm:text-sm text-stone-900">
                                      {service.name}
                                    </h4>
                                    {service.popular && (
                                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                        ⭐ Mais pedido
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-stone-500 leading-relaxed">
                                    {service.description}
                                  </p>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-xs text-stone-400 block font-medium">Valor</span>
                                  <span className={`font-extrabold text-sm sm:text-base ${panelTheme.primaryText}`}>
                                    R$ {service.price.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                              </div>

                              <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3 text-[11px] text-stone-500 font-medium">
                                  <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 px-2 py-0.5 rounded-lg">
                                    <Clock className={`w-3 h-3 ${panelTheme.primaryText}`} /> {service.durationMinutes} min
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-stone-400">
                                    <Car className="w-3 h-3" /> +{proBufferTime}m trânsito
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditServicePage(service)}
                                    className={`px-3 py-1.5 ${panelTheme.primaryBtnSecondary} rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer`}
                                  >
                                    <Pencil className="w-3 h-3" />
                                    Editar Serviço & Preço
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteService(service.id, service.name)}
                                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                                    title="Remover serviço"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    /* ======================================================== */
                    /* VISÃO 2: PÁGINA DEDICADA DE NOVO / EDITAR SERVIÇO        */
                    /* ======================================================== */
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Barra Superior de Navegação da Página */}
                      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                        <button
                          type="button"
                          onClick={() => setServiceFormMode('LIST')}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          <ArrowLeft className={`w-3.5 h-3.5 ${panelTheme.primaryText}`} />
                          Voltar ao Catálogo
                        </button>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${panelTheme.primaryBgLight} ${panelTheme.primaryText} border ${panelTheme.primaryBorderLight}`}>
                          {serviceFormMode === 'CREATE' ? '✨ Novo Serviço' : '✏️ Editando Serviço'}
                        </span>
                      </div>

                      {/* Cabeçalho da Página */}
                      <div className={`${panelTheme.modalHeaderBg} p-4 rounded-2xl shadow-sm space-y-1`}>
                        <h3 className="font-extrabold text-base flex items-center gap-2">
                          <Sparkles className={`w-4 h-4 ${panelTheme.isDark ? 'text-amber-300' : 'text-rose-300'}`} />
                          {serviceFormMode === 'CREATE'
                            ? proBusinessNiche === 'BARBERSHOP'
                              ? 'Cadastrar Novo Serviço de Barbearia'
                              : 'Cadastrar Novo Serviço'
                            : `Editar: ${srvName || 'Serviço'}`}
                        </h3>
                        <p className="text-xs text-white/80">
                          Configure nome, descrição, valor e duração média do seu atendimento.
                        </p>
                      </div>

                      {/* Atalhos Rápidos de Modelos (Apenas ao criar novo serviço) */}
                      {serviceFormMode === 'CREATE' && (
                        <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-500" />
                              Modelos rápidos para preencher em 1 clique:
                            </p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-600">
                              {proBusinessNiche === 'BARBERSHOP' ? '💈 Barbearia' : '🌸 Beleza & Estética'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(proBusinessNiche === 'BARBERSHOP'
                              ? [
                                  {
                                    label: '💈 Corte Fade / Degradê',
                                    name: 'Corte Degradê Navalhado / Fade Moderno',
                                    price: '45',
                                    duration: 40,
                                    desc: 'Corte degradê disfarçado com máquina e tesoura, alinhamento milimétrico do contorno e finalização com pomada matte.',
                                  },
                                  {
                                    label: '🪒 Barboterapia Completa',
                                    name: 'Barboterapia com Toalha Quente',
                                    price: '40',
                                    duration: 35,
                                    desc: 'Design e alinhamento de barba com toalha quente, navalhete descartável, óleo hidratante e pós-barba refrescante.',
                                  },
                                  {
                                    label: '🔥 Combo VIP: Corte + Barba',
                                    name: 'Combo VIP: Corte Degradê + Barba + Sobrancelha',
                                    price: '80',
                                    duration: 65,
                                    desc: 'Experiência completa com corte na régua, barboterapia relaxante, alinhamento de sobrancelha e finalização premium.',
                                  },
                                  {
                                    label: '🎨 Pigmentação de Barba',
                                    name: 'Pigmentação de Barba & Contorno',
                                    price: '35',
                                    duration: 25,
                                    desc: 'Preenchimento milimétrico de falhas com pigmentação natural de alta durabilidade e acabamento moderno.',
                                  },
                                  {
                                    label: '✂️ Corte Infantil / Kids',
                                    name: 'Corte Kids Especializado',
                                    price: '40',
                                    duration: 30,
                                    desc: 'Corte paciente e personalizado para crianças e jovens, com todo cuidado, estilo e atenção.',
                                  },
                                  {
                                    label: '👑 Barbeiro VIP a Domicílio',
                                    name: 'Atendimento Barbeiro VIP a Domicílio',
                                    price: '140',
                                    duration: 75,
                                    desc: 'Atendimento exclusivo no conforto da sua residência, escritório ou Dia do Noivo com bancada e esterilização completa.',
                                  },
                                ]
                              : [
                                  {
                                    label: '💄 Maquiagem Social',
                                    name: 'Maquiagem Social Glam',
                                    price: '180',
                                    duration: 60,
                                    desc: 'Pele blindada resistente a lágrimas e suor, cílios postiços inclusos e acabamento iluminado no conforto da sua casa.',
                                  },
                                  {
                                    label: '👰 Produção Noiva / Madrinha',
                                    name: 'Combo Madrinha VIP (Make + Penteado)',
                                    price: '290',
                                    duration: 110,
                                    desc: 'Produção completa de maquiagem e penteado com fixação profissional e camarim portátil iluminado.',
                                  },
                                  {
                                    label: '💇‍♀️ Escova & Babyliss',
                                    name: 'Escova Modelada & Ondas',
                                    price: '130',
                                    duration: 50,
                                    desc: 'Finalização impecável com protetor térmico profissional e ondas duradouras.',
                                  },
                                  {
                                    label: '💅 Alongamento em Gel',
                                    name: 'Alongamento em Fibra de Vidro',
                                    price: '210',
                                    duration: 120,
                                    desc: 'Aplicação com acabamento natural, cutilagem russa e materiais 100% esterilizados em autoclave.',
                                  },
                                  {
                                    label: '👁️ Extensão de Cílios',
                                    name: 'Extensão de Cílios Volume Brasileiro',
                                    price: '190',
                                    duration: 90,
                                    desc: 'Atendimento em maca portátil ergonômica com fios tecnológicos de alta retenção.',
                                  },
                                ]
                            ).map((tpl) => (
                              <button
                                key={tpl.label}
                                type="button"
                                onClick={() => {
                                  setSrvName(tpl.name);
                                  setSrvPrice(tpl.price);
                                  setSrvDuration(tpl.duration);
                                  setSrvDescription(tpl.desc);
                                  setSrvPopular(true);
                                }}
                                className={`text-[11px] bg-white border px-2.5 py-1.5 rounded-xl font-semibold transition cursor-pointer shadow-2xs ${
                                  proBusinessNiche === 'BARBERSHOP'
                                    ? 'hover:bg-amber-50 text-stone-800 hover:text-amber-900 border-stone-200 hover:border-amber-300'
                                    : 'hover:bg-rose-50 text-stone-700 hover:text-rose-700 border-stone-200 hover:border-rose-300'
                                }`}
                              >
                                {tpl.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Formulário Principal */}
                      <form onSubmit={handleSaveServiceForm} className="space-y-4">
                        {srvFormError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{srvFormError}</span>
                          </div>
                        )}

                        {/* 1. Identificação e Descrição do Serviço */}
                        <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-3 shadow-xs">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" /> 1. Dados do Serviço
                          </h4>

                          <div>
                            <label className="block text-xs font-bold text-stone-800 mb-1">
                              Nome do Serviço:*
                            </label>
                            <input
                              type="text"
                              required
                              placeholder={
                                proBusinessNiche === 'BARBERSHOP'
                                  ? 'Ex: Corte Degradê / Fade, Barboterapia, Combo VIP...'
                                  : 'Ex: Maquiagem Social Glam, Alongamento em Gel...'
                              }
                              value={srvName}
                              onChange={(e) => {
                                setSrvName(e.target.value);
                                setSrvFormError(null);
                              }}
                              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-stone-800 mb-1">
                              Descrição e Diferenciais (O que está incluso):
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Descreva os produtos usados, técnicas e o que você leva até a casa da cliente..."
                              value={srvDescription}
                              onChange={(e) => setSrvDescription(e.target.value)}
                              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed"
                            />
                          </div>

                          {/* Toggle Destaque "Mais Pedido" */}
                          <div
                            onClick={() => setSrvPopular(!srvPopular)}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                              srvPopular
                                ? 'bg-amber-50/80 border-amber-300'
                                : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">⭐</span>
                              <div>
                                <p className="text-xs font-bold text-stone-900">
                                  Destacar com selo "Mais Pedido"
                                </p>
                                <p className="text-[10px] text-stone-500">
                                  Exibe uma etiqueta dourada na sua vitrine para atrair mais agendamentos.
                                </p>
                              </div>
                            </div>
                            <div
                              className={`w-10 h-5 rounded-full p-0.5 transition flex items-center ${
                                srvPopular ? 'bg-amber-500 justify-end' : 'bg-stone-300 justify-start'
                              }`}
                            >
                              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                            </div>
                          </div>
                        </div>

                        {/* 2. Preço do Serviço & Duração do Atendimento */}
                        <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-4 shadow-xs">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5" /> 2. Preço & Tempo de Atendimento
                          </h4>

                          {/* Campo de Preço + Atalhos */}
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-stone-800">
                              Valor do Serviço (R$):*
                            </label>
                            <div className="relative flex items-center">
                              <span className="absolute left-3.5 text-xs font-extrabold text-rose-600">
                                R$
                              </span>
                              <input
                                type="number"
                                step="0.50"
                                min="1"
                                required
                                value={srvPrice}
                                onChange={(e) => {
                                  setSrvPrice(e.target.value);
                                  setSrvFormError(null);
                                }}
                                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-extrabold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                              />
                            </div>

                            {/* Botões Rápidos de Preço */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="text-[10px] text-stone-400 font-semibold">Valores rápidos:</span>
                              {['70', '90', '120', '150', '180', '220', '290'].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setSrvPrice(val)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                    srvPrice === val
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-rose-300'
                                  }`}
                                >
                                  R$ {val}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Seletor Visual de Duração */}
                          <div className="space-y-2 pt-2 border-t border-stone-100">
                            <div className="flex items-center justify-between">
                              <label className={`text-xs font-bold text-stone-800 flex items-center gap-1.5`}>
                                <Clock className={`w-3.5 h-3.5 ${panelTheme.primaryText}`} />
                                Duração Média do Atendimento:
                              </label>
                              <span className={`text-xs font-extrabold ${panelTheme.primaryText} ${panelTheme.primaryBgLight} px-2.5 py-0.5 rounded-full border ${panelTheme.primaryBorderLight}`}>
                                {srvDuration} minutos
                              </span>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                              {[30, 45, 60, 75, 90, 120].map((mins) => (
                                <button
                                  key={mins}
                                  type="button"
                                  onClick={() => setSrvDuration(mins)}
                                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                    srvDuration === mins
                                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-rose-300'
                                  }`}
                                >
                                  {mins} min
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-[11px] text-stone-500">Ou digite o tempo exato (min):</span>
                              <input
                                type="number"
                                min={10}
                                max={480}
                                value={srvDuration}
                                onChange={(e) => setSrvDuration(Number(e.target.value))}
                                className="w-20 bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-bold text-stone-900 text-center focus:outline-none focus:ring-2 focus:ring-rose-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 3. Prévia em Tempo Real na Vitrine da Cliente */}
                        <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                            <Eye className="w-3 h-3 text-rose-600" /> Prévia em Tempo Real na Sua Vitrine:
                          </span>
                          <div className="p-4 rounded-2xl border border-rose-400 bg-white shadow-xs">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-sm text-stone-900">
                                    {srvName.trim() || 'Nome do Seu Serviço'}
                                  </h3>
                                  {srvPopular && (
                                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                      Mais pedido
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                                  {srvDescription.trim() || 'Descrição do atendimento a domicílio...'}
                                </p>
                                <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 mt-2 font-medium">
                                  <Clock className="w-3 h-3 text-stone-400" /> {srvDuration || 60} minutos
                                </span>
                              </div>
                              <div className="text-right pl-3">
                                <span className="text-base font-extrabold text-stone-900">
                                  R${' '}
                                  {(Number(String(srvPrice).replace(',', '.')) || 0)
                                    .toFixed(2)
                                    .replace('.', ',')}
                                </span>
                                <div className="w-5 h-5 mt-2 rounded-full bg-rose-600 text-white flex items-center justify-center ml-auto">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Botões de Ação Final */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setServiceFormMode('LIST')}
                            className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Cancelar
                          </button>

                          {serviceFormMode === 'EDIT' && editingServiceId && (
                            <button
                              type="button"
                              onClick={() => handleDeleteService(editingServiceId, srvName)}
                              className="px-3.5 py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </button>
                          )}

                          <button
                            type="submit"
                            className={`flex-1 py-3 ${panelTheme.primaryBtn} rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            {serviceFormMode === 'CREATE'
                              ? 'Publicar Serviço na Vitrine'
                              : 'Salvar Alterações'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* ABA 3: REGIÕES ATENDIDAS E CUSTO DE DESLOCAMENTO */}
              {!isProTrialExpired && proSubTab === 'areas' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {proServiceMode === 'STUDIO' ? (
                    /* ======================================================== */
                    /* CASO 1: APENAS NO STUDIO (SEM TAXAS OU DESLOCAMENTO)     */
                    /* ======================================================== */
                    <div className="bg-white border border-purple-200 p-6 sm:p-8 rounded-3xl shadow-xs text-center space-y-4">
                      <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto text-3xl border border-purple-200 shadow-2xs">
                        🏢
                      </div>
                      <div className="space-y-1.5 max-w-md mx-auto">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                          Modalidade: Apenas no Studio
                        </span>
                        <h3 className="text-base sm:text-lg font-extrabold text-stone-900">
                          Rotas e Taxas de Deslocamento Desativadas
                        </h3>
                        <p className="text-xs text-stone-500 leading-relaxed">
                          Como você configurou seu perfil para atender <strong>exclusivamente no espaço físico (Studio / Barbearia)</strong>, seus clientes sempre comparecem ao seu endereço. Por isso, não é necessário informar onde você mora nem cadastrar taxas de entrega por bairro.
                        </p>
                      </div>

                      {/* Cartão Informativo do Studio */}
                      <div className="max-w-md mx-auto bg-stone-50 p-4 rounded-2xl border border-stone-200 text-left space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                            Local Fixo de Atendimento:
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Deslocamento Grátis
                          </span>
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-stone-900 flex items-center gap-1.5">
                            <span>🏢</span> {proStudioName || 'Seu Studio / Atelier'}
                          </p>
                          <p className="text-xs text-stone-600 mt-0.5">
                            📍 {proBaseAddress ? `${proBaseAddress}, ` : ''}{proBaseNeighborhood ? `${proBaseNeighborhood} - ` : ''}{proBaseCity || 'Cidade não informada'} {proBaseCep ? `• CEP ${proBaseCep}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setProSubTab('portfolio')}
                          className="w-full sm:w-auto px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          ✏️ Editar Endereço do Studio na Vitrine
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProServiceMode('HIBRIDO');
                            showProSuccess('✨ Modalidade alterada para Híbrido! Agora você pode cadastrar taxas por bairro.');
                          }}
                          className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Car className="w-3.5 h-3.5" /> Quero atender a Domicílio também (Ativar Híbrido)
                        </button>
                      </div>
                    </div>
                  ) : areaFormMode === 'LIST' ? (
                    /* ======================================================== */
                    /* VISÃO 1: LISTA DE REGIÕES, TAXAS E TEMPO DE TRÂNSITO     */
                    /* ======================================================== */
                    <>
                      {/* Banner Superior de Deslocamento */}
                      <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded-full border border-rose-700/50">
                            <Car className="w-3 h-3 text-rose-300" /> Logística Domiciliar
                          </span>
                          <h3 className="font-extrabold text-sm sm:text-base text-white">
                            Regiões & Custo de Deslocamento
                          </h3>
                          <p className="text-[11px] text-rose-100/80">
                            Configure suas taxas por bairro e o tempo de trânsito entre atendimentos.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={openCreateAreaPage}
                          className="shrink-0 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold transition shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          Nova Região / Taxa
                        </button>
                      </div>

                      {/* 1. BASE DE PARTIDA: HÍBRIDO (STUDIO) OU DOMICÍLIO (ONDE VOCÊ MORA) */}
                      {proServiceMode === 'HIBRIDO' ? (
                        /* QUANDO HIBRIDO: PONTO DE PARTIDA É O STUDIO (NÃO MOSTRA 'ONDE VOCÊ MORA') */
                        <div className="bg-white border-2 border-purple-200 p-4 rounded-2xl space-y-3 shadow-xs">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                              <Navigation className="w-3.5 h-3.5 text-purple-600" /> 1. Ponto de Partida para Deslocamento
                            </h4>
                            <span className="text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              🏢 Studio / Atelier Base
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500">
                            Como você atende de forma <strong>Híbrida</strong>, os trajetos e custos de deslocamento para a residência da cliente partem diretamente do seu <strong>Studio ({proStudioName || 'Seu Espaço'})</strong>.
                          </p>

                          <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <p className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                                <span>🏢</span> {proStudioName || 'Studio Bella'}
                              </p>
                              <p className="text-[11px] text-stone-600">
                                📍 {proBaseAddress ? `${proBaseAddress}, ` : ''}{proBaseNeighborhood ? `${proBaseNeighborhood} - ` : ''}{proBaseCity || 'Cidade não cadastrada'} {proBaseCep ? `• CEP: ${proBaseCep}` : ''}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProSubTab('portfolio')}
                              className="px-3 py-1.5 bg-white hover:bg-stone-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                            >
                              ✏️ Editar Studio na Vitrine
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* QUANDO DOMICILIO: EXIBE CADASTRO DA BASE ONDE VOCÊ MORA */
                        <div className="bg-white border-2 border-rose-200 p-4 rounded-2xl space-y-3.5 shadow-xs">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                              <Navigation className="w-3.5 h-3.5" /> 1. Cadastro da Sua Base (Onde Você Mora)
                            </h4>
                            {isHomeBaseDirty ? (
                              <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                ● Alterações pendentes
                              </span>
                            ) : proBaseCity ? (
                              <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                📍 Base: {proBaseCity}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-stone-500">
                            Digite o CEP de onde você mora para reconhecer sua Cidade e Bairro base automaticamente, e complete seu endereço de partida.
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {/* CEP onde mora */}
                            <div>
                              <label className="block text-[11px] font-bold text-stone-800 mb-1">
                                CEP onde você mora:*
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  maxLength={9}
                                  placeholder="Ex: 72010-010"
                                  value={draftHomeCep}
                                  onChange={(e) => handleHomeCepLookup(e.target.value)}
                                  className="w-full bg-rose-50/50 border border-rose-300 rounded-xl px-3 py-2 text-xs font-extrabold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                                {baseCepLoading && (
                                  <Loader2 className="w-3.5 h-3.5 text-rose-600 animate-spin absolute right-3 top-2.5" />
                                )}
                              </div>
                            </div>

                            {/* Cidade - UF Base */}
                            <div>
                              <label className="block text-[11px] font-bold text-stone-800 mb-1">
                                Cidade - UF da Base:*
                              </label>
                              <input
                                type="text"
                                list="brazil-cities-datalist-base"
                                placeholder="Ex: Brasília-DF"
                                value={draftHomeCity}
                                onChange={(e) => setDraftHomeCity(e.target.value)}
                                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                              />
                              <datalist id="brazil-cities-datalist-base">
                                {POPULAR_BRAZIL_CITIES.map((c) => (
                                  <option key={c} value={c} />
                                ))}
                              </datalist>
                            </div>

                            {/* Bairro onde mora */}
                            <div>
                              <label className="block text-[11px] font-bold text-stone-800 mb-1">
                                Bairro / Região Base:
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Taguatinga, Ceilândia..."
                                value={draftHomeNeighborhood}
                                onChange={(e) => setDraftHomeNeighborhood(e.target.value)}
                                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                              />
                            </div>
                          </div>

                          {baseCepError && (
                            <p className="text-[11px] text-amber-700 font-semibold">
                              ⚠️ {baseCepError}
                            </p>
                          )}

                          {/* Endereço Completo onde mora */}
                          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                            <div className="flex-1">
                              <label className="block text-[11px] font-bold text-stone-800 mb-1">
                                Endereço Completo onde você mora (Rua/Quadra, Número e Complemento):
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Quadra C 1, Lote 10, Apto 202"
                                value={draftHomeAddress}
                                onChange={(e) => setDraftHomeAddress(e.target.value)}
                                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                              />
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {isHomeBaseDirty && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDraftHomeCep(proBaseCep);
                                    setDraftHomeCity(proBaseCity);
                                    setDraftHomeNeighborhood(proBaseNeighborhood);
                                    setDraftHomeAddress(proBaseAddress);
                                  }}
                                  className="px-3 py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 transition cursor-pointer"
                                >
                                  Descartar
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={handleSaveBaseLocation}
                                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                                  isHomeBaseDirty
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md ring-2 ring-rose-500/20'
                                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                                }`}
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                Confirmar e Salvar Base
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. Configuração do Buffer Time */}
                      <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                            <Car className="w-4 h-4 text-rose-600" />
                            Tempo de Trânsito entre Clientes (Buffer Time):
                          </label>
                          <span className="text-xs font-extrabold bg-rose-600 text-white px-2.5 py-0.5 rounded-full">
                            {draftBufferTime} min
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-700">
                          O BellaDoor bloqueará automaticamente esse intervalo antes e depois de cada atendimento para você nunca se atrasar.
                        </p>
                        <div className="flex gap-2 pt-1">
                          {[20, 30, 35, 45, 60].map((mins) => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => setDraftBufferTime(mins)}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                draftBufferTime === mins
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                  : 'bg-white text-stone-700 border-stone-200 hover:border-rose-300'
                              }`}
                            >
                              {mins}m
                            </button>
                          ))}
                        </div>
                        {draftBufferTime !== proBufferTime && (
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200/60 mt-2">
                            <button
                              type="button"
                              onClick={() => setDraftBufferTime(proBufferTime)}
                              className="text-xs text-stone-500 hover:text-stone-800 font-semibold px-2.5 py-1.5 transition cursor-pointer"
                            >
                              Descartar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setProBufferTime(draftBufferTime);
                                showProSuccess(`⏱️ Margem de deslocamento de ${draftBufferTime} min confirmada e salva!`);
                              }}
                              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs cursor-pointer transition"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Confirmar Tempo de Trânsito
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 3. Lista de Bairros e Taxas Atendidos */}
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-xs font-extrabold text-stone-800 uppercase tracking-wider">
                            Bairros / Regiões Atendidas ({proNeighborhoodsList.length})
                          </span>
                          <button
                            type="button"
                            onClick={openCreateAreaPage}
                            className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar Bairro / Região
                          </button>
                        </div>

                        {proNeighborhoodsList.length === 0 ? (
                          <div className="p-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50/70 text-center space-y-2">
                            <MapPin className="w-6 h-6 text-rose-500 mx-auto" />
                            <p className="text-xs font-extrabold text-stone-800">
                              Nenhuma região ou bairro de atendimento adicionado ainda
                            </p>
                            <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                              Após preencher sua base acima, clique abaixo para escolher os bairros onde você atende e definir a taxa de deslocamento de cada um.
                            </p>
                            <button
                              type="button"
                              onClick={openCreateAreaPage}
                              className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition shadow-xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Adicionar Região Atendida
                            </button>
                          </div>
                        ) : (
                          proNeighborhoodsList.map((n) => {
                            const displayCity = n.city || proBaseCity;
                            return (
                              <div
                                key={n.id}
                                className="p-3.5 rounded-2xl border border-stone-200 bg-white hover:border-rose-300 transition flex items-center justify-between text-xs shadow-2xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`p-2 rounded-xl ${
                                      n.travelFee === 0
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-600 border border-rose-200'
                                    }`}
                                  >
                                    <MapPin className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="font-extrabold text-stone-900 text-xs">
                                      {n.name}
                                      {displayCity ? (
                                        <span className="font-semibold text-stone-500">
                                          {' '}
                                          • {displayCity}
                                        </span>
                                      ) : null}
                                    </p>
                                    <p className="text-[10px] text-stone-500">
                                      {n.travelFee === 0
                                        ? 'Isento de taxa (Sua região base)'
                                        : 'Custo de deslocamento adicionado no checkout'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-extrabold text-xs px-2.5 py-1 rounded-xl border ${
                                      n.travelFee === 0
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-stone-50 text-stone-900 border-stone-200'
                                    }`}
                                  >
                                    {n.travelFee === 0
                                      ? '✨ Grátis'
                                      : `+ R$ ${n.travelFee.toFixed(2).replace('.', ',')}`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openEditAreaPage(n)}
                                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteArea(n.id, n.name)}
                                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                                    title="Excluir região"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  ) : (
                    /* ======================================================== */
                    /* VISÃO 2: CADASTRAMENTO DE REGIÃO (SOMENTE CIDADE + BAIRRO) */
                    /* ======================================================== */
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Topo com botão Voltar */}
                      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                        <button
                          type="button"
                          onClick={() => setAreaFormMode('LIST')}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5 text-rose-600" />
                          Voltar às Regiões
                        </button>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          {areaFormMode === 'CREATE' ? '🚗 Nova Região & Taxa' : '✏️ Editando Taxa'}
                        </span>
                      </div>

                      {/* Header Visual */}
                      <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white p-4 rounded-2xl shadow-sm space-y-1">
                        <h3 className="font-extrabold text-base flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-rose-400" />
                          {areaFormMode === 'CREATE'
                            ? 'Cadastrar Região / Bairro Atendido'
                            : `Editar Região: ${areaName || 'Bairro'}`}
                        </h3>
                        <p className="text-xs text-rose-100/80">
                          Selecione a Cidade e escolha o Bairro/Região com 1 clique nas sugestões da cidade.
                        </p>
                      </div>

                      <form onSubmit={handleSaveAreaForm} className="space-y-4">
                        {areaFormError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{areaFormError}</span>
                          </div>
                        )}

                        {/* 1. SOMENTE CIDADE + BAIRRO/REGIÃO SUGERIDO DE ACORDO COM A CIDADE */}
                        <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-3.5 shadow-xs">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> 1. Cidade & Região / Bairro Atendido
                          </h4>

                          {/* CAMPO 1: CIDADE / UF */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-stone-800">
                              Cidade - UF:*
                            </label>
                            <input
                              type="text"
                              list="brazil-cities-datalist"
                              placeholder="Ex: Brasília-DF, Goiânia-GO, Belo Horizonte-MG..."
                              value={areaCity}
                              onChange={(e) => setAreaCity(e.target.value)}
                              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                            <datalist id="brazil-cities-datalist">
                              {POPULAR_BRAZIL_CITIES.map((c) => (
                                <option key={c} value={c} />
                              ))}
                            </datalist>

                            {/* Atalhos rápidos de Cidades */}
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              <span className="text-[10px] text-stone-400 font-semibold mr-0.5">
                                Cidades rápidas:
                              </span>
                              {[
                                'Brasília-DF',
                                'Goiânia-GO',
                                'São Paulo-SP',
                                'Rio de Janeiro-RJ',
                                'Belo Horizonte-MG',
                                'Curitiba-PR',
                                'Salvador-BA',
                                'Fortaleza-CE',
                                'Recife-PE',
                              ].map((cityOption) => (
                                <button
                                  key={cityOption}
                                  type="button"
                                  onClick={() => setAreaCity(cityOption)}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                    areaCity.toLowerCase() === cityOption.toLowerCase()
                                      ? 'bg-stone-900 text-white border-stone-900'
                                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-rose-300'
                                  }`}
                                >
                                  {cityOption}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* CAMPO 2: NOME DO BAIRRO / REGIÃO + SUGESTÕES RÁPIDAS DINÂMICAS POR CIDADE */}
                          <div className="pt-1 border-t border-stone-100 space-y-2.5">
                            <div>
                              <label className="block text-xs font-bold text-stone-800 mb-1">
                                Nome do Bairro / Região:*
                              </label>
                              <input
                                type="text"
                                required
                                placeholder={
                                  (areaCity || proBaseCity).toLowerCase().includes('brasilia') ||
                                  (areaCity || proBaseCity).toLowerCase().includes('df')
                                    ? 'Ex: Ceilândia, Taguatinga, Guará, Águas Claras, Asa Sul...'
                                    : 'Ex: Nome do bairro ou região onde você atende...'
                                }
                                value={areaName}
                                onChange={(e) => {
                                  setAreaName(e.target.value);
                                  setAreaFormError(null);
                                }}
                                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                              />
                            </div>

                            {/* Sugestões Rápidas Dinâmicas de acordo com a Cidade escolhida */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-stone-500 uppercase flex items-center gap-1">
                                ✨ Sugestões rápidas para{' '}
                                <span className="text-rose-600 underline">
                                  {areaCity.trim() || proBaseCity.trim() || 'sua Cidade'}
                                </span>{' '}
                                (1 clique):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {getSuggestedNeighborhoodsForCity(
                                  areaCity || proBaseCity,
                                  dynamicCitySuggestions
                                ).map((bName) => (
                                  <button
                                    key={bName}
                                    type="button"
                                    onClick={() => {
                                      setAreaName(bName);
                                      setAreaFormError(null);
                                    }}
                                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                                      areaName === bName
                                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-rose-300'
                                    }`}
                                  >
                                    {bName}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. Custo de Deslocamento (Grátis vs Taxa Fixa) */}
                        <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-3 shadow-xs">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5" /> 2. Custo de Deslocamento (Locomoção)
                          </h4>

                          {/* Seletor de Modalidade: Grátis vs Com Taxa */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <div
                              onClick={() => {
                                setAreaIsFree(true);
                                setAreaFee('0');
                              }}
                              className={`p-3 rounded-2xl border-2 cursor-pointer transition text-center ${
                                areaIsFree
                                  ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs'
                                  : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                              }`}
                            >
                              <span className="text-lg block">✨</span>
                              <p className="font-extrabold text-xs text-stone-900 mt-0.5">
                                Deslocamento Grátis
                              </p>
                              <p className="text-[10px] text-stone-500">
                                Ideal para seu bairro base (R$ 0,00)
                              </p>
                            </div>

                            <div
                              onClick={() => {
                                setAreaIsFree(false);
                                if (areaFee === '0') setAreaFee('15');
                              }}
                              className={`p-3 rounded-2xl border-2 cursor-pointer transition text-center ${
                                !areaIsFree
                                  ? 'border-rose-600 bg-rose-50/70 shadow-2xs'
                                  : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                              }`}
                            >
                              <span className="text-lg block">🚗</span>
                              <p className="font-extrabold text-xs text-stone-900 mt-0.5">
                                Cobrar Taxa de Locomoção
                              </p>
                              <p className="text-[10px] text-stone-500">
                                Cobre combustível, Uber ou pedágio
                              </p>
                            </div>
                          </div>

                          {/* Input de Valor da Taxa (Quando não for grátis) */}
                          {!areaIsFree && (
                            <div className="space-y-2.5 pt-2 animate-in fade-in duration-150">
                              <label className="block text-xs font-bold text-stone-800">
                                Valor da Taxa de Deslocamento (R$):
                              </label>
                              <div className="relative flex items-center">
                                <span className="absolute left-3.5 text-xs font-extrabold text-rose-600">
                                  R$
                                </span>
                                <input
                                  type="number"
                                  step="1"
                                  min="1"
                                  required={!areaIsFree}
                                  value={areaFee}
                                  onChange={(e) => setAreaFee(e.target.value)}
                                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-extrabold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] text-stone-400 font-semibold">
                                  Taxas comuns:
                                </span>
                                {['10', '15', '20', '25', '30', '40', '50'].map((val) => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => setAreaFee(val)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                      areaFee === val
                                        ? 'bg-rose-600 text-white border-rose-600'
                                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-rose-300'
                                    }`}
                                  >
                                    + R$ {val}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Prévia de como a cliente verá no agendamento */}
                        <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl space-y-1.5 text-xs">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                            <Eye className="w-3 h-3 text-rose-600" /> Como aparece para sua cliente ao digitar o CEP:
                          </span>
                          <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between gap-2">
                            <span className="font-bold text-stone-800">
                              📍 {areaName.trim() || 'Nome do Bairro / Região'}
                              {areaCity.trim() || proBaseCity.trim()
                                ? ` - ${areaCity.trim() || proBaseCity.trim()}`
                                : ''}
                            </span>
                            <span className="font-extrabold text-emerald-600 shrink-0">
                              {areaIsFree || Number(areaFee) === 0
                                ? 'Deslocamento Grátis'
                                : `+ R$ ${(Number(String(areaFee).replace(',', '.')) || 0).toFixed(2).replace('.', ',')}`}
                            </span>
                          </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setAreaFormMode('LIST')}
                            className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Cancelar
                          </button>

                          {areaFormMode === 'EDIT' && editingAreaId && (
                            <button
                              type="button"
                              onClick={() => handleDeleteArea(editingAreaId, areaName)}
                              className="px-3.5 py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </button>
                          )}

                          <button
                            type="submit"
                            className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {areaFormMode === 'CREATE'
                              ? 'Salvar Região e Taxa'
                              : 'Atualizar Região e Taxa'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* ABA 4: VITRINE PÚBLICA, FOTO DE PERFIL, BANNER E PORTFÓLIO DE TRABALHOS */}
              {!isProTrialExpired && proSubTab === 'portfolio' && (
                <div className="space-y-5">
                  {portfolioFormMode === 'LIST' ? (
                    <>
                      {/* Cabeçalho da Aba */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-rose-600" />
                            Identidade Visual & Portfólio
                          </h3>
                          <p className="text-xs text-stone-500">
                            Personalize sua foto de perfil, capa e fotos de trabalhos da sua vitrine
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleOpenVitrinePreview}
                          className="text-[11px] bg-stone-900 hover:bg-stone-800 text-white font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5 text-rose-400" />
                          Ver Vitrine ao Vivo
                        </button>
                      </div>

                      {onboardingWizardStep !== 2 && (
                        <>
                          {/* ============================================================ */}
                          {/* BLOCO 0: SELO DE IDENTIDADE VERIFICADA (DOCUMENTO & WHATSAPP)*/}
                          {/* ============================================================ */}
                          <div
                            className={`rounded-3xl p-4 sm:p-5 border shadow-xs transition space-y-3.5 ${
                              proIsVerified
                                ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300'
                                : proVerificationStatus === 'PENDING'
                                ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-amber-300'
                                : 'bg-gradient-to-br from-rose-50/40 via-white to-amber-50/40 border-stone-200'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-stone-200/60 pb-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                                    proIsVerified
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : proVerificationStatus === 'PENDING'
                                      ? 'bg-amber-600 text-white shadow-xs'
                                      : 'bg-rose-100 text-rose-700'
                                  }`}
                                >
                                  <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-extrabold text-stone-900">
                                      Selo de Identidade Verificada 🛡️
                                    </h4>
                                    {proIsVerified ? (
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                                        Ativo na Vitrine
                                      </span>
                                    ) : proVerificationStatus === 'PENDING' ? (
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-600 text-white animate-pulse">
                                        Em Análise
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700">
                                        Opcional
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-stone-600 mt-0.5">
                                    {proIsVerified
                                      ? 'Sua identidade e WhatsApp foram conferidos! O selo oficial de confiança está ativo na sua vitrine.'
                                      : proVerificationStatus === 'PENDING'
                                      ? 'Seu documento foi enviado e está sendo analisado pela nossa equipe. Em breve o selo estará ativo!'
                                      : 'Passe mais segurança para clientes em atendimentos domiciliares conquistando o selo oficial.'}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsProVerificationCollapsed(!isProVerificationCollapsed)}
                                className="p-1 sm:px-2.5 sm:py-1 bg-white/80 hover:bg-white text-stone-700 rounded-xl transition cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-stone-200 select-none ml-auto"
                                title={isProVerificationCollapsed ? 'Expandir' : 'Recolher'}
                              >
                                <span className="hidden sm:inline">{isProVerificationCollapsed ? 'Expandir' : 'Recolher'}</span>
                                {isProVerificationCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {/* Conteúdo dinâmico de acordo com o status */}
                            {!isProVerificationCollapsed && (
                              <>
                                {proIsVerified ? (
                                  <div className="bg-white/80 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span className="text-emerald-950 font-bold">
                                        Todas as clientes que acessam sua vitrine visualizam seu selo de segurança.
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleOpenVitrinePreview}
                                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline shrink-0 cursor-pointer"
                                    >
                                      Ver na Vitrine
                                    </button>
                                  </div>
                                ) : proVerificationStatus === 'PENDING' ? (
                                  <div className="space-y-3">
                                    <div className="bg-white/90 border border-amber-200 rounded-2xl p-3.5 space-y-1 text-xs">
                                      <p className="font-extrabold text-amber-950 flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-amber-600" />
                                        Documento ({proVerificationDocType || 'RG/CNH'}) em análise
                                      </p>
                                      <p className="text-[11px] text-amber-900">
                                        Nossa equipe analisa os envios em até 24 horas. Se quiser acelerar a liberação do seu selo, você pode falar diretamente com o suporte no WhatsApp:
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <a
                                        href={`https://wa.me/5562996222851?text=${encodeURIComponent(
                                          `Olá equipe BellaDoor! Sou ${proDisplayName || 'uma profissional'}, enviei meu documento para o Selo de Identidade Verificada e gostaria de confirmar.`
                                        )}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        Avisar Suporte no WhatsApp
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                          Tipo de Documento:
                                        </label>
                                        <select
                                          value={proVerificationDocType}
                                          onChange={(e) =>
                                            setProVerificationDocType(e.target.value as 'RG' | 'CNH' | 'OUTRO')
                                          }
                                          className="w-full text-xs font-bold p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                                        >
                                          <option value="RG">RG (Documento de Identidade)</option>
                                          <option value="CNH">CNH (Carteira de Motorista)</option>
                                          <option value="OUTRO">Outro Documento Oficial com Foto</option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                          Foto do Documento (Frente ou Aberto):
                                        </label>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            if (file.size > 5 * 1024 * 1024) {
                                              alert('Por favor, selecione uma imagem de até 5MB.');
                                              return;
                                            }
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                              const base64 = event.target?.result as string;
                                              if (base64) {
                                                setProVerificationDocUrl(base64);
                                              }
                                            };
                                            reader.readAsDataURL(file);
                                          }}
                                          className="w-full text-xs p-1.5 bg-white border border-stone-300 rounded-xl file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer"
                                        />
                                      </div>
                                    </div>

                                    {proVerificationDocUrl && (
                                      <div className="flex items-center gap-3 p-2.5 bg-white border border-emerald-200 rounded-xl">
                                        <img
                                          src={proVerificationDocUrl}
                                          alt="Prévia do Documento"
                                          className="w-14 h-10 object-cover rounded-lg border border-stone-200"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[11px] font-bold text-emerald-900 truncate">
                                            Foto anexada com sucesso!
                                          </p>
                                          <p className="text-[10px] text-stone-500">
                                            Clique no botão abaixo para enviar para a equipe BellaDoor.
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setProVerificationDocUrl('')}
                                          className="text-[10px] text-red-600 font-bold hover:underline"
                                        >
                                          Remover
                                        </button>
                                      </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                      <button
                                        type="button"
                                        disabled={!proVerificationDocUrl}
                                        onClick={() => {
                                          if (!proVerificationDocUrl) {
                                            alert('Por favor, selecione uma foto do documento.');
                                            return;
                                          }
                                          setProVerificationStatus('PENDING');
                                          setUiDialog({
                                            emoji: '🛡️',
                                            badge: 'Documento Enviado',
                                            title: 'Solicitação Enviada com Sucesso!',
                                            message:
                                              'Seu documento foi enviado para nossa equipe de análise. Assim que conferido, o Selo de Identidade Verificada será ativado na sua vitrine.',
                                            buttonText: 'Maravilha!',
                                            variant: 'success',
                                          });
                                        }}
                                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                      >
                                        <ShieldCheck className="w-4 h-4" />
                                        Enviar Documento e Solicitar Selo
                                      </button>

                                      <a
                                        href={`https://wa.me/5562996222851?text=${encodeURIComponent(
                                          `Olá Everton! Sou a profissional ${proDisplayName || ''} e gostaria de solicitar meu Selo de Identidade Verificada no BellaDoor.`
                                        )}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="py-2.5 px-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                        Solicitar via WhatsApp
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* ============================================================ */}
                          {/* BLOCO 1: APRESENTAÇÃO DA VITRINE (BIO, NOME, INSTA E WHATS)  */}
                          {/* ============================================================ */}
                          <div className="bg-white rounded-3xl border border-stone-200 p-4 space-y-3.5 shadow-xs">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                          <h4 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                            <Pencil className="w-3.5 h-3.5 text-rose-600" />
                            1. Informações de Apresentação & Nicho do Negócio
                          </h4>
                          <div className="flex items-center gap-1.5">
                            {isPresentationDirty ? (
                              <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                ● Alterações pendentes
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                ✓ Informações salvas
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setIsProPresentationCollapsed(!isProPresentationCollapsed)}
                              className="p-1 sm:px-2.5 sm:py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-stone-200 select-none"
                              title={isProPresentationCollapsed ? 'Expandir' : 'Recolher'}
                            >
                              <span className="hidden sm:inline">{isProPresentationCollapsed ? 'Expandir' : 'Recolher'}</span>
                              {isProPresentationCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {!isProPresentationCollapsed && (
                          <>
                        {/* SELETOR DE NICHO & TOM DE COMUNICAÇÃO NO WHATSAPP */}
                        <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-extrabold text-stone-900 flex items-center gap-1.5">
                              <span>🎯</span>
                              Segmento do Negócio & Tom das Mensagens no WhatsApp:
                            </label>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-stone-200 text-stone-800">
                              {draftBusinessNiche === 'BARBERSHOP'
                                ? '💈 Barbearia & Masculino'
                                : draftBusinessNiche === 'NEUTRAL'
                                ? '⚖️ Clássico / Neutro'
                                : '🌸 Beleza Feminina'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setDraftBusinessNiche('BARBERSHOP');
                                setProBusinessNiche('BARBERSHOP');
                                if (draftVisualTheme === 'ROSE' || proVisualTheme === 'ROSE') {
                                  setDraftVisualTheme('DARK_BARBER');
                                  setProVisualTheme('DARK_BARBER');
                                }
                                showProSuccess('💈 Modo Barbearia & Masculino ativado!');
                              }}
                              className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                                draftBusinessNiche === 'BARBERSHOP'
                                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm ring-2 ring-amber-500/40'
                                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                              }`}
                            >
                              <div>
                                <span className="text-xs font-extrabold flex items-center gap-1">
                                  💈 Barbearia & Masculino
                                </span>
                                <p
                                  className={`text-[10px] mt-1 leading-snug ${
                                    draftBusinessNiche === 'BARBERSHOP' ? 'text-stone-300' : 'text-stone-500'
                                  }`}
                                >
                                  Corte degradê, barba e estética masculina. WhatsApp no tom direto (&ldquo;Fala, irmão! 👊 Beleza?&rdquo;).
                                </p>
                              </div>
                              <span
                                className={`text-[9px] font-bold mt-2 px-1.5 py-0.5 rounded w-fit ${
                                  draftBusinessNiche === 'BARBERSHOP'
                                    ? 'bg-amber-500 text-stone-950 font-black'
                                    : 'bg-stone-100 text-stone-500'
                                }`}
                              >
                                {draftBusinessNiche === 'BARBERSHOP' ? '✓ Selecionado' : 'Selecionar'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDraftBusinessNiche('BEAUTY');
                                setProBusinessNiche('BEAUTY');
                                if (draftVisualTheme === 'DARK_BARBER' || proVisualTheme === 'DARK_BARBER') {
                                  setDraftVisualTheme('ROSE');
                                  setProVisualTheme('ROSE');
                                }
                                showProSuccess('🌸 Modo Beleza Feminina ativado!');
                              }}
                              className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                                draftBusinessNiche === 'BEAUTY'
                                  ? 'bg-rose-50 text-rose-950 border-rose-400 shadow-sm ring-2 ring-rose-500/20'
                                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                              }`}
                            >
                              <div>
                                <span className="text-xs font-extrabold flex items-center gap-1">
                                  🌸 Beleza Feminina
                                </span>
                                <p
                                  className={`text-[10px] mt-1 leading-snug ${
                                    draftBusinessNiche === 'BEAUTY' ? 'text-rose-800' : 'text-stone-500'
                                  }`}
                                >
                                  Nails, maquiagem, cílios, cabelo e depilação. WhatsApp carinhoso (&ldquo;Olá! ✨ Te espero com carinho 💕&rdquo;).
                                </p>
                              </div>
                              <span
                                className={`text-[9px] font-bold mt-2 px-1.5 py-0.5 rounded w-fit ${
                                  draftBusinessNiche === 'BEAUTY'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-stone-100 text-stone-500'
                                }`}
                              >
                                {draftBusinessNiche === 'BEAUTY' ? '✓ Selecionado' : 'Selecionar'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDraftBusinessNiche('NEUTRAL');
                                setProBusinessNiche('NEUTRAL');
                                showProSuccess('⚖️ Modo Clássico / Neutro ativado!');
                              }}
                              className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                                draftBusinessNiche === 'NEUTRAL'
                                  ? 'bg-stone-100 text-stone-900 border-stone-400 shadow-sm ring-2 ring-stone-400/20'
                                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                              }`}
                            >
                              <div>
                                <span className="text-xs font-extrabold flex items-center gap-1">
                                  ⚖️ Clássico / Neutro
                                </span>
                                <p
                                  className={`text-[10px] mt-1 leading-snug ${
                                    draftBusinessNiche === 'NEUTRAL' ? 'text-stone-700' : 'text-stone-500'
                                  }`}
                                >
                                  Massoterapia, estúdio unissex ou terapias. Tom formal, claro e profissional no WhatsApp.
                                </p>
                              </div>
                              <span
                                className={`text-[9px] font-bold mt-2 px-1.5 py-0.5 rounded w-fit ${
                                  draftBusinessNiche === 'NEUTRAL'
                                    ? 'bg-stone-800 text-white'
                                    : 'bg-stone-100 text-stone-500'
                                }`}
                              >
                                {draftBusinessNiche === 'NEUTRAL' ? '✓ Selecionado' : 'Selecionar'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* SELETOR DE TEMA & ESTILO VISUAL DA VITRINE */}
                        <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl space-y-2">
                          <label className="block text-[11px] font-extrabold text-stone-900 flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5 text-stone-700" />
                            Tema & Cores da Vitrine Pública da sua Cliente / Cliente:
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              {
                                id: 'DARK_BARBER',
                                name: 'Barber Dark & Gold',
                                badge: 'Preto & Ouro (Barbearia)',
                                cardClass: 'bg-stone-900 text-white border-amber-500/60',
                              },
                              {
                                id: 'ROSE',
                                name: 'Bella Rose',
                                badge: 'Rosa & Champagne',
                                cardClass: 'bg-rose-50 text-rose-950 border-rose-300',
                              },
                              {
                                id: 'EMERALD',
                                name: 'Emerald Zen',
                                badge: 'Verde Esmeralda',
                                cardClass: 'bg-emerald-50 text-emerald-950 border-emerald-300',
                              },
                              {
                                id: 'MINIMAL',
                                name: 'Clean Minimalist',
                                badge: 'Preto & Branco',
                                cardClass: 'bg-white text-stone-900 border-stone-300',
                              },
                            ].map((thm) => {
                              const isCurrentActive = (proVisualTheme || draftVisualTheme) === thm.id;
                              return (
                                <button
                                  key={thm.id}
                                  type="button"
                                  onClick={() => {
                                    const newTheme = thm.id as VisualTheme;
                                    setDraftVisualTheme(newTheme);
                                    setProVisualTheme(newTheme);
                                    showProSuccess(`🎨 Tema "${thm.name}" ativado com sucesso!`);
                                  }}
                                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                                    isCurrentActive
                                      ? `${thm.cardClass} ring-2 ring-stone-900 shadow-sm`
                                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                                  }`}
                                >
                                  <div>
                                    <span className="text-[11px] font-extrabold block truncate">{thm.name}</span>
                                    <span className="text-[9px] opacity-75">{thm.badge}</span>
                                  </div>
                                  <span className="text-[8px] font-bold uppercase mt-2">
                                    {isCurrentActive ? '✓ Ativo' : 'Escolher'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 mb-1">
                              Seu Nome Profissional
                            </label>
                            <input
                              type="text"
                              value={draftDisplayName}
                              onChange={(e) => setDraftDisplayName(e.target.value)}
                              placeholder={
                                draftBusinessNiche === 'BARBERSHOP'
                                  ? 'Ex: Rodrigo Oliveira Barbeiro'
                                  : 'Ex: Camila Martins'
                              }
                              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 mb-1">
                              Especialidade em Destaque
                            </label>
                            <input
                              type="text"
                              value={draftDisplayTitle}
                              onChange={(e) => setDraftDisplayTitle(e.target.value)}
                              placeholder={
                                draftBusinessNiche === 'BARBERSHOP'
                                  ? 'Ex: Especialista em Fade & Barboterapia'
                                  : 'Ex: Nail Designer & Spa dos Pés'
                              }
                              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
                            />
                          </div>
                        </div>

                        {/* Campos de Arroba do Instagram e Número de WhatsApp */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                              <Instagram className="w-3.5 h-3.5 text-pink-600" />
                              Arroba do Instagram (@)
                            </label>
                            <div className="relative flex items-center">
                              <span className="absolute left-3 text-xs font-extrabold text-pink-600 select-none">
                                @
                              </span>
                              <input
                                type="text"
                                value={draftInstagram.replace(/^@+/, '')}
                                onChange={(e) => setDraftInstagram(e.target.value.replace(/^@+/, ''))}
                                placeholder="seu.instagram"
                                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-7 pr-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
                              />
                            </div>
                            <p className="text-[10px] text-stone-400 mt-1">
                              Aparece como botão <strong>@{draftInstagram.replace(/^@+/, '') || 'seu.instagram'}</strong> na sua vitrine
                            </p>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Seu WhatsApp de Atendimento
                            </label>
                            <div className="relative flex items-center">
                              <Phone className="w-3.5 h-3.5 text-emerald-600 absolute left-3" />
                              <input
                                type="tel"
                                value={draftWhatsapp}
                                onChange={(e) => setDraftWhatsapp(e.target.value)}
                                placeholder="(11) 99999-8888"
                                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
                              />
                            </div>
                            <p className="text-[10px] text-stone-400 mt-1">
                              Número que receberá as mensagens e agendamentos dos clientes
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 mb-1">
                            Bio / Descrição do seu Trabalho
                          </label>
                          <textarea
                            rows={3}
                            value={draftDisplayBio}
                            onChange={(e) => setDraftDisplayBio(e.target.value)}
                            placeholder={
                              draftBusinessNiche === 'BARBERSHOP'
                                ? 'Apresente sua barbearia, anos de experiência com tesoura e navalha, produtos e estrutura de atendimento...'
                                : 'Apresente seu trabalho, anos de experiência, cuidados de biossegurança e marcas que utiliza...'
                            }
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          {isPresentationDirty && (
                            <button
                              type="button"
                              onClick={() => {
                                setDraftDisplayName(proDisplayName);
                                setDraftDisplayTitle(proDisplayTitle);
                                setDraftInstagram(proInstagram);
                                setDraftWhatsapp(proWhatsapp);
                                setDraftDisplayBio(proDisplayBio);
                                setDraftBusinessNiche(proBusinessNiche);
                                setDraftVisualTheme(proVisualTheme);
                              }}
                              className="text-xs text-stone-500 hover:text-stone-800 font-semibold px-3 py-2 rounded-xl transition cursor-pointer"
                            >
                              Descartar alterações
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleConfirmPresentationData}
                            className={`text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                              isPresentationDirty
                                ? panelTheme.primaryBtn
                                : 'bg-stone-900 hover:bg-stone-800 text-white shadow-2xs'
                            }`}
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            Confirmar Dados de Apresentação
                          </button>
                        </div>
                          </>
                        )}
                      </div>

                      {/* ============================================================ */}
                      {/* BLOCO 1B: MODALIDADE DE ATENDIMENTO & ESPAÇO FÍSICO / STUDIO */}
                      {/* ============================================================ */}
                      <div className="bg-white rounded-3xl border border-stone-200 p-4 space-y-3.5 shadow-xs">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                          <h4 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                            <span className="text-base">🏢</span>
                            2. Modalidade de Atendimento & Espaço Físico
                          </h4>
                          <div className="flex items-center gap-1.5">
                            {isServiceModeDirty ? (
                              <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                ● Alterações pendentes
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                ✓ Informações salvas
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setIsProServiceModeCollapsed(!isProServiceModeCollapsed)}
                              className="p-1 sm:px-2.5 sm:py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-stone-200 select-none"
                              title={isProServiceModeCollapsed ? 'Expandir' : 'Recolher'}
                            >
                              <span className="hidden sm:inline">{isProServiceModeCollapsed ? 'Expandir' : 'Recolher'}</span>
                              {isProServiceModeCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {!isProServiceModeCollapsed && (
                          <>
                        <p className="text-xs text-stone-500">
                          Escolha como você atende seus clientes: no seu próprio espaço físico (Studio / Barbearia / Sala), a domicílio, ou em ambas modalidades.
                        </p>

                        {/* Cards com as 3 Opções */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setDraftServiceMode('HIBRIDO')}
                            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                              draftServiceMode === 'HIBRIDO'
                                ? 'bg-rose-50/70 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                                : 'bg-stone-50/70 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="text-base block">{proBusinessNiche === 'BARBERSHOP' ? '💈' : '✨'}</span>
                              <p className="font-extrabold text-xs text-stone-900">
                                Híbrido (Ambos)
                              </p>
                              <p className="text-[11px] text-stone-500 leading-tight">
                                Atende tanto no espaço fixo quanto a domicílio / VIP. A agenda bloqueia o tempo de deslocamento automaticamente!
                              </p>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                                draftServiceMode === 'HIBRIDO'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {draftServiceMode === 'HIBRIDO' ? '✓ Selecionado' : 'Selecionar'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDraftServiceMode('STUDIO')}
                            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                              draftServiceMode === 'STUDIO'
                                ? 'bg-purple-50/70 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                                : 'bg-stone-50/70 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="text-base block">{proBusinessNiche === 'BARBERSHOP' ? '💈' : '🏢'}</span>
                              <p className="font-extrabold text-xs text-stone-900">
                                {proBusinessNiche === 'BARBERSHOP' ? 'Apenas na Barbearia' : 'Apenas no Studio'}
                              </p>
                              <p className="text-[11px] text-stone-500 leading-tight">
                                Clientes vão até seu espaço físico. Sem taxa de deslocamento e sem trânsito entre clientes.
                              </p>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                                draftServiceMode === 'STUDIO'
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {draftServiceMode === 'STUDIO' ? '✓ Selecionado' : 'Selecionar'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDraftServiceMode('DOMICILIO')}
                            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                              draftServiceMode === 'DOMICILIO'
                                ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                                : 'bg-stone-50/70 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="text-base block">🏡</span>
                              <p className="font-extrabold text-xs text-stone-900">
                                {proBusinessNiche === 'BARBERSHOP' ? 'Apenas Domicílio / VIP' : 'Apenas a Domicílio'}
                              </p>
                              <p className="text-[11px] text-stone-500 leading-tight">
                                Você vai até a residência ou local do cliente. Calcula taxa de deslocamento e trânsito entre atendimentos.
                              </p>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                                draftServiceMode === 'DOMICILIO'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {draftServiceMode === 'DOMICILIO' ? '✓ Selecionado' : 'Selecionar'}
                            </span>
                          </button>
                        </div>

                        {/* Dados do Studio / Atelier (quando STUDIO ou HIBRIDO) */}
                        {(draftServiceMode === 'STUDIO' || draftServiceMode === 'HIBRIDO') && (
                          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-3 animate-in fade-in duration-200">
                            <div>
                              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                {proBusinessNiche === 'BARBERSHOP'
                                  ? 'Nome da Barbearia / Espaço Físico:'
                                  : 'Nome do seu Studio / Atelier / Espaço:'}
                              </label>
                              <input
                                type="text"
                                value={draftStudioName}
                                onChange={(e) => setDraftStudioName(e.target.value)}
                                placeholder={
                                  proBusinessNiche === 'BARBERSHOP'
                                    ? 'Ex: Barbearia Viking / Barber Club Clássico'
                                    : 'Ex: Studio Bella / Atelier Camila Martins'
                                }
                                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                              />
                            </div>

                            {/* 1º PASSO: CEP DO STUDIO (COM BUSCA AUTOMÁTICA VIACEP) */}
                            <div className="bg-white p-3 rounded-xl border border-rose-200/80 shadow-2xs">
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[11px] font-extrabold text-stone-900">
                                  {proBusinessNiche === 'BARBERSHOP'
                                    ? '1. Digite o CEP da Barbearia:*'
                                    : '1. Digite o CEP do Studio:*'}
                                </label>
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  ⚡ Busca Automática ViaCEP
                                </span>
                              </div>
                              <div className="relative">
                                <input
                                  type="text"
                                  maxLength={9}
                                  value={draftStudioCep}
                                  onChange={(e) => handleStudioCepLookup(e.target.value)}
                                  placeholder="Ex: 01310-100"
                                  className="w-full bg-rose-50/40 border border-rose-300 rounded-xl px-3 py-2 text-xs font-extrabold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                                />
                                {baseCepLoading && (
                                  <Loader2 className="w-4 h-4 text-rose-600 animate-spin absolute right-3 top-2.5" />
                                )}
                              </div>
                              {baseCepError ? (
                                <p className="text-[11px] text-rose-600 font-semibold mt-1">
                                  {baseCepError}
                                </p>
                              ) : (
                                <p className="text-[10px] text-stone-500 mt-1">
                                  💡 Ao digitar seu CEP (8 dígitos), a Rua, Bairro e Cidade são preenchidos automaticamente.
                                </p>
                              )}
                            </div>

                            {/* 2º PASSO: ENDEREÇO / NÚMERO / COMPLEMENTO */}
                            <div>
                              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                {proBusinessNiche === 'BARBERSHOP'
                                  ? '2. Endereço da Barbearia (Rua, Número, Sala/Ponto):*'
                                  : '2. Endereço do Studio (Rua, Número, Sala/Apto):*'}
                              </label>
                              <input
                                type="text"
                                value={draftStudioAddress}
                                onChange={(e) => setDraftStudioAddress(e.target.value)}
                                placeholder="Ex: Av. Paulista, 1000, Loja 4"
                                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                              />
                              <p className="text-[10px] text-stone-400 mt-0.5">
                                Rua identificada pelo CEP. Basta adicionar o número e ponto/sala.
                              </p>
                            </div>

                            {/* 3º PASSO: BAIRRO E CIDADE-UF */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                  {proBusinessNiche === 'BARBERSHOP' ? 'Bairro da Barbearia:' : 'Bairro do Studio:'}
                                </label>
                                <input
                                  type="text"
                                  value={draftStudioNeighborhood}
                                  onChange={(e) => setDraftStudioNeighborhood(e.target.value)}
                                  placeholder="Ex: Bela Vista / Centro"
                                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                  {proBusinessNiche === 'BARBERSHOP' ? 'Cidade - UF da Barbearia:' : 'Cidade - UF do Studio:'}
                                </label>
                                <input
                                  type="text"
                                  value={draftStudioCity}
                                  onChange={(e) => setDraftStudioCity(e.target.value)}
                                  placeholder="Ex: São Paulo-SP / Brasília-DF"
                                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                                />
                              </div>
                            </div>

                            <p className="text-[11px] text-stone-500">
                              📍 Este endereço será apresentado para seus clientes que agendarem atendimento presencial, com botão direto para navegação no Google Maps e Waze.
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1">
                          {isServiceModeDirty && (
                            <button
                              type="button"
                              onClick={() => {
                                setDraftServiceMode(proServiceMode);
                                setDraftStudioName(proStudioName);
                                setDraftStudioCep(proBaseCep);
                                setDraftStudioAddress(proBaseAddress);
                                setDraftStudioNeighborhood(proBaseNeighborhood);
                                setDraftStudioCity(proBaseCity);
                              }}
                              className="text-xs text-stone-500 hover:text-stone-800 font-semibold px-3 py-2 rounded-xl transition cursor-pointer"
                            >
                              Descartar alterações
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleConfirmServiceMode}
                            className={`text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                              isServiceModeDirty
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md ring-2 ring-rose-500/20'
                                : 'bg-stone-900 hover:bg-stone-800 text-white shadow-2xs'
                            }`}
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            Confirmar Modalidade de Atendimento
                          </button>
                        </div>
                          </>
                        )}
                      </div>

                      {/* ============================================================ */}
                      {/* BLOCO 3: UPLOAD DE FOTO DO PERFIL E IMAGEM DO BANNER / CAPA  */}
                      {/* ============================================================ */}
                      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
                        <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                          <span className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                            <Image className="w-4 h-4 text-rose-600" />
                            3. Foto de Perfil & Imagem do Banner (Capa)
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="hidden sm:inline text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Sincronizado com a Vitrine
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsProVisualIdentityCollapsed(!isProVisualIdentityCollapsed)}
                              className="p-1 sm:px-2.5 sm:py-1 bg-white hover:bg-stone-200 text-stone-700 rounded-xl transition cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-stone-200 select-none"
                              title={isProVisualIdentityCollapsed ? 'Expandir' : 'Recolher'}
                            >
                              <span className="hidden sm:inline">{isProVisualIdentityCollapsed ? 'Expandir' : 'Recolher'}</span>
                              {isProVisualIdentityCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {!isProVisualIdentityCollapsed && (
                          <>
                        {/* Simulação Interativa do Topo da Vitrine com Botões de Upload */}
                        <div className="relative h-36 bg-rose-950 group">
                          <img
                            src={proCoverUrl}
                            alt="Banner da Vitrine"
                            className="w-full h-full object-cover opacity-85 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/30" />

                          {/* Botão de Upload do Banner / Capa */}
                          <div className="absolute top-3 right-3 flex items-center gap-2">
                            <label className="bg-white/95 hover:bg-white text-stone-900 font-extrabold text-[11px] px-3 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition border border-stone-200">
                              <Upload className="w-3.5 h-3.5 text-rose-600" />
                              Enviar Imagem do Banner
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverFileUpload}
                                className="hidden"
                              />
                            </label>
                          </div>

                          <div className="absolute bottom-2 right-3">
                            <span className="text-[10px] text-white/80 font-medium bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
                              Capa da Vitrine (Recomendado: Horizontal)
                            </span>
                          </div>
                        </div>

                        {/* Área da Foto de Perfil + Controles Diretos */}
                        <div className="px-4 pb-4 pt-3 relative bg-white">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3.5 min-w-0">
                              {/* Avatar com botão de câmera (apenas o avatar sobrepõe a capa) */}
                              <div className="relative group shrink-0 -mt-11">
                                <img
                                  src={proAvatarUrl}
                                  alt={proDisplayName}
                                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-stone-100"
                                />
                                <label
                                  title="Enviar nova foto de perfil"
                                  className="absolute -bottom-1 -right-1 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-xl border-2 border-white shadow-md cursor-pointer transition flex items-center justify-center"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarFileUpload}
                                    className="hidden"
                                  />
                                </label>
                              </div>

                              <div className="min-w-0">
                                <h4 className="font-extrabold text-sm text-stone-900 leading-snug break-words">
                                  {proDisplayName}
                                </h4>
                                <p className="text-xs text-rose-600 font-semibold mt-0.5">
                                  {proDisplayTitle}
                                </p>
                              </div>
                            </div>

                            {/* Botão explícito para Upload da Foto de Perfil */}
                            <label className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-[11px] px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition shrink-0">
                              <Camera className="w-3.5 h-3.5 text-rose-600" />
                              Trocar Foto do Perfil
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarFileUpload}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* Opções Rápidas de Temas de Banner (Caso queira testar com 1 clique) */}
                          <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-stone-500">
                              Sugestões rápidas de capa:
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {[
                                {
                                  label: '💅 Estúdio Rose',
                                  url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
                                },
                                {
                                  label: '✨ Spa Clean',
                                  url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1000&q=80',
                                },
                                {
                                  label: '💄 Make & Glow',
                                  url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1000&q=80',
                                },
                              ].map((preset, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setProCoverUrl(preset.url);
                                    showProSuccess(`🖼️ Capa "${preset.label}" aplicada na sua vitrine!`);
                                  }}
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                                    proCoverUrl === preset.url
                                      ? 'bg-rose-600 text-white border-rose-600'
                                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                          </>
                        )}
                      </div>
                        </>
                      )}

                      {onboardingWizardStep !== 1 && (
                        /* ============================================================ */
                        /* BLOCO 4: GERENCIAR FOTOS DOS TRABALHOS REALIZADOS (PORTFÓLIO)*/
                        /* ============================================================ */
                        <div className="bg-white rounded-3xl border border-stone-200 p-4 space-y-4 shadow-xs">
                          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-stone-100 pb-2.5">
                            <div>
                              <h4 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-rose-600" />
                                {onboardingWizardStep === 2
                                  ? `Passo 2: Fotos dos Trabalhos Realizados (${proPortfolioList.length})`
                                  : `4. Fotos dos Trabalhos Realizados (${proPortfolioList.length})`}
                              </h4>
                              <p className="text-[11px] text-stone-500">
                                Adicione fotos reais dos seus atendimentos para encantar novas clientes
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <button
                                type="button"
                                onClick={openCreatePortfolioPage}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Adicionar Foto</span>
                                <span className="sm:hidden">Foto</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsProPortfolioPhotosCollapsed(!isProPortfolioPhotosCollapsed)}
                                className="p-1 sm:px-2.5 sm:py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-stone-200 select-none"
                                title={isProPortfolioPhotosCollapsed ? 'Expandir' : 'Recolher'}
                              >
                                <span className="hidden sm:inline">{isProPortfolioPhotosCollapsed ? 'Expandir' : 'Recolher'}</span>
                                {isProPortfolioPhotosCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {!isProPortfolioPhotosCollapsed && (
                            <>
                          {proPortfolioList.length === 0 ? (
                            <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-2">
                              <Camera className="w-8 h-8 text-stone-400 mx-auto" />
                              <p className="text-xs font-bold text-stone-700">
                                Nenhuma foto de trabalho publicada ainda
                              </p>
                              <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                                Profissionais com fotos de trabalhos realizados recebem até 3x mais agendamentos!
                              </p>
                              <button
                                type="button"
                                onClick={openCreatePortfolioPage}
                                className="mt-2 inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                Enviar Primeira Foto de Trabalho
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              {proPortfolioList.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="group relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 aspect-square shadow-xs"
                                >
                                  <img
                                    src={item.url}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-between">
                                    {/* Botões de Ação no Topo do Card */}
                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => openEditPortfolioPage(item, idx)}
                                        title="Editar foto ou legenda"
                                        className="p-1.5 bg-white/95 hover:bg-white text-stone-800 rounded-lg shadow-md transition cursor-pointer"
                                      >
                                        <Pencil className="w-3.5 h-3.5 text-rose-600" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePortfolioItem(idx, item.title)}
                                        title="Remover foto da vitrine"
                                        className="p-1.5 bg-white/95 hover:bg-red-50 text-red-600 rounded-lg shadow-md transition cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Legenda na Base do Card */}
                                    <div>
                                      <span className="inline-block text-[9px] font-extrabold uppercase tracking-wider bg-rose-600/90 text-white px-2 py-0.5 rounded-md mb-1">
                                        Trabalho #{idx + 1}
                                      </span>
                                      <p className="text-xs text-white font-bold leading-snug line-clamp-2">
                                        {item.title}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {/* Card de Atalho para Adicionar Mais Fotos */}
                              <button
                                type="button"
                                onClick={openCreatePortfolioPage}
                                className="rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/40 hover:bg-rose-50/80 aspect-square flex flex-col items-center justify-center p-4 text-center transition cursor-pointer group"
                              >
                                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                                  <Plus className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-extrabold text-rose-700">
                                  + Nova Foto de Trabalho
                                </span>
                                <span className="text-[10px] text-stone-500 mt-1">
                                  Upload do celular ou computador
                                </span>
                              </button>
                            </div>
                          )}
                            </>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    /* ============================================================ */
                    /* PÁGINA INTERNA DEDICADA: ADICIONAR OU EDITAR FOTO DE TRABALHO */
                    /* ============================================================ */
                    <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs animate-in fade-in duration-200">
                      {/* Header da Página de Upload de Trabalho */}
                      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-rose-950 text-white p-5">
                        <button
                          type="button"
                          onClick={() => setPortfolioFormMode('LIST')}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-300 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl transition mb-3 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5 text-rose-400" />
                          Voltar para Vitrine & Fotos
                        </button>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30 px-2.5 py-0.5 rounded-full">
                              {portfolioFormMode === 'CREATE' ? 'Novo Trabalho no Portfólio' : 'Editando Foto do Portfólio'}
                            </span>
                            <h3 className="text-base font-extrabold text-white mt-1.5">
                              {portfolioFormMode === 'CREATE'
                                ? 'Publicar Foto de Trabalho Realizado'
                                : 'Editar Foto ou Legenda do Trabalho'}
                            </h3>
                            <p className="text-xs text-stone-300 mt-0.5">
                              Envie uma foto do seu celular ou computador para exibir na sua vitrine pública.
                            </p>
                          </div>
                          <div className="w-11 h-11 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                            <Camera className="w-5 h-5 text-rose-400" />
                          </div>
                        </div>
                      </div>

                      {/* Formulário da Foto do Portfólio */}
                      <form onSubmit={handleSavePortfolioForm} className="p-5 space-y-4">
                        {portfolioFormError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>{portfolioFormError}</span>
                          </div>
                        )}

                        {/* 1. Área de Upload de Imagem do Dispositivo */}
                        <div>
                          <label className="block text-xs font-extrabold text-stone-800 mb-1.5">
                            1. Foto do Trabalho Realizado *
                          </label>

                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-rose-300 hover:border-rose-500 bg-rose-50/40 hover:bg-rose-50/80 rounded-2xl p-5 text-center cursor-pointer transition group">
                            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md mb-2.5 group-hover:scale-105 transition">
                              <Upload className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-extrabold text-stone-900">
                              Clique para enviar uma foto do seu aparelho
                            </span>
                            <span className="text-[11px] text-stone-500 mt-0.5">
                              Suporta fotos da galeria do celular ou computador (JPG, PNG, WEBP)
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePortfolioFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* 2. Legenda / Nome do Procedimento na Foto */}
                        <div>
                          <label className="block text-xs font-extrabold text-stone-800 mb-1">
                            2. Legenda / Serviço Realizado na Foto *
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Alongamento Fibra de Vidro Natural"
                            value={portfolioPhotoTitle}
                            onChange={(e) => setPortfolioPhotoTitle(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
                          />

                          {/* Chips de Sugestão Rápida de Legenda */}
                          <div className="flex items-center gap-1.5 flex-wrap mt-2">
                            <span className="text-[10px] font-bold text-stone-400">Sugestões:</span>
                            {[
                              'Alongamento em Gel Natural',
                              'Blindagem + Francesinha',
                              'Spa dos Pés Completo',
                              'Nail Art Delicada',
                              'Esmaltação em Gel Vermelho',
                            ].map((sug) => (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => setPortfolioPhotoTitle(sug)}
                                className="text-[10px] font-semibold bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 px-2 py-0.5 rounded-lg border border-stone-200 transition cursor-pointer"
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 3. Pré-visualização em Tempo Real */}
                        <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                            <Eye className="w-3 h-3 text-rose-600" /> Pré-visualização na sua Vitrine:
                          </span>

                          {portfolioPhotoUrl ? (
                            <div className="w-44 mx-auto relative rounded-2xl overflow-hidden aspect-square bg-stone-200 shadow-sm border border-stone-300">
                              <img
                                src={portfolioPhotoUrl}
                                alt="Preview do Trabalho"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent p-2.5 flex items-end">
                                <span className="text-[11px] text-white font-bold">
                                  {portfolioPhotoTitle.trim() || 'Legenda do seu trabalho...'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="py-6 text-center text-xs text-stone-400">
                              Selecione uma foto acima para visualizar como ela ficará na vitrine.
                            </div>
                          )}
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setPortfolioFormMode('LIST')}
                            className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Cancelar
                          </button>

                          {portfolioFormMode === 'EDIT' && editingPortfolioIndex !== null && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeletePortfolioItem(
                                  editingPortfolioIndex,
                                  portfolioPhotoTitle || 'Foto'
                                )
                              }
                              className="px-3.5 py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </button>
                          )}

                          <button
                            type="submit"
                            className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {portfolioFormMode === 'CREATE'
                              ? 'Publicar Foto na Vitrine'
                              : 'Salvar Alterações'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* ABA 5: ASSINATURA SAAS, MERCADO PAGO & CUPONS (COMPONENTE MODULAR) */}
              {(proSubTab === 'billing' || isProTrialExpired) && (
                <ProBillingTab
                  subscriptionStatus={subscriptionStatus}
                  planInterval={planInterval}
                  trialDaysLeft={trialDaysLeft}
                  trialTotalDays={trialTotalDays}
                  trialEndDateFormatted={trialEndDateFormatted}
                  userEmail={currentUser?.email}
                  userFullName={currentUser?.fullName}
                  appliedCoupon={currentUser?.appliedCoupon}
                  paymentMethod={currentUser?.paymentMethod}
                  autoRenewCanceled={currentUser?.autoRenewCanceled}
                  showCheckoutModal={showCheckoutModal}
                  checkoutMethod={checkoutMethod}
                  isPaymentProcessing={isPaymentProcessing}
                  coupons={couponsList}
                  mpConfig={mpConfig}
                  onSelectPlanInterval={setPlanInterval}
                  onOpenCheckoutModal={() => setShowCheckoutModal(true)}
                  onCloseCheckoutModal={() => setShowCheckoutModal(false)}
                  onSelectCheckoutMethod={setCheckoutMethod}
                  onToggleSimulationStatus={() => {
                    const nextStatus = subscriptionStatus === 'ACTIVE' ? 'TRIAL' : 'ACTIVE';
                    setSubscriptionStatus(nextStatus);
                    try {
                      localStorage.setItem(
                        'belladoor_v2_subscription',
                        JSON.stringify({ status: nextStatus, interval: planInterval })
                      );
                    } catch {}
                    if (currentUser) {
                      setCurrentUser({ ...currentUser, subscriptionStatus: nextStatus });
                      if (currentUser.email) {
                        updateUserAccountInFirestore(currentUser.email, {
                          subscriptionStatus: nextStatus,
                        });
                      }
                    }
                  }}
                  onConfirmPaymentSimulation={() => {
                    setIsPaymentProcessing(true);
                    setTimeout(() => {
                      setIsPaymentProcessing(false);
                      setSubscriptionStatus('ACTIVE');
                      const daysGranted = planInterval === 'ANNUAL' ? 365 : 30;
                      const newEndMs = Date.now() + daysGranted * 24 * 60 * 60 * 1000;
                      const newEndIso = new Date(newEndMs).toISOString();
                      const chosenPayMethod: 'PIX' | 'CARD_RECURRING' =
                        checkoutMethod === 'PIX' ? 'PIX' : 'CARD_RECURRING';
                      const shouldOpenFirstAccessWizard =
                        pendingWizardAfterPayment && !hasCompletedInitialOnboarding;

                      try {
                        localStorage.setItem(
                          'belladoor_v2_subscription',
                          JSON.stringify({ status: 'ACTIVE', interval: planInterval })
                        );
                      } catch {}

                      if (currentUser) {
                        const updatedUser: AuthUser = {
                          ...currentUser,
                          subscriptionStatus: 'ACTIVE',
                          subscriptionPlan: planInterval,
                          isTrialActive: false,
                          trialDaysLeft: daysGranted,
                          trialEndsAt: newEndIso,
                          paymentMethod: chosenPayMethod,
                          autoRenewCanceled: false,
                          onboardingCompleted: true,
                        };
                        setCurrentUser(updatedUser);
                        if (currentUser.email) {
                          updateUserAccountInFirestore(currentUser.email, {
                            subscriptionStatus: 'ACTIVE',
                            subscriptionPlan: planInterval,
                            isTrialActive: false,
                            trialDaysLeft: daysGranted,
                            trialEndsAt: newEndIso,
                            paymentMethod: chosenPayMethod,
                            autoRenewCanceled: false,
                            onboardingCompleted: true,
                          });
                        }
                      }
                      setShowCheckoutModal(false);

                      const paidAmountStr =
                        planInterval === 'ANNUAL'
                          ? 'R$ 299,00/ano'
                          : checkoutMethod === 'PIX'
                          ? 'R$ 44,90/mês (PIX)'
                          : 'R$ 39,90/mês (Crédito Recorrente)';

                      if (shouldOpenFirstAccessWizard) {
                        startProOnboardingWizard(`💳 Pagamento Confirmado • ${paidAmountStr}`);
                      } else {
                        markOnboardingAsDone();
                        setPendingWizardAfterPayment(false);
                        setActiveTab('pro');
                        setProSubTab('agenda');
                        const formattedEnd = new Date(newEndMs).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        });
                        setUiDialog({
                          emoji: '✅',
                          badge: 'Pagamento Confirmado!',
                          title: 'Assinatura Ativa e Plataforma Desbloqueada!',
                          message: `Seu pagamento (${paidAmountStr}) foi confirmado com sucesso! Sua Agenda, Vitrine, Serviços e Regiões estão 100% liberados.`,
                          highlight: `Acesso liberado até ${formattedEnd} (${daysGranted} dias ativos)`,
                          buttonText: 'Ir para Minha Agenda 📅',
                          variant: 'success',
                        });
                      }
                    }, 1200);
                  }}
                  onVerifyMercadoPagoNow={() => handleVerifyMercadoPagoSubscription(false)}
                  onCancelRecurringSubscription={() => {
                    const canceledAtIso = new Date().toISOString();
                    if (currentUser) {
                      const updatedUser: AuthUser = {
                        ...currentUser,
                        autoRenewCanceled: true,
                        autoRenewCanceledAt: canceledAtIso,
                      };
                      setCurrentUser(updatedUser);
                      if (currentUser.email) {
                        updateUserAccountInFirestore(currentUser.email, {
                          autoRenewCanceled: true,
                          autoRenewCanceledAt: canceledAtIso,
                        });
                      }
                    }
                    setUiDialog({
                      emoji: '🛡️',
                      badge: 'Renovação Automática Cancelada',
                      title: 'Crédito Recorrente Cancelado com Sucesso',
                      message: `A renovação automática para os próximos meses foi desativada. Você NÃO perde nenhum dia já pago: sua Vitrine e sua Agenda continuam 100% liberadas até ${trialEndDateFormatted}.`,
                      highlight: `Acesso garantido até ${trialEndDateFormatted} (${trialDaysLeft} dias restantes)`,
                      buttonText: 'Entendi',
                      variant: 'warning',
                    });
                  }}
                  onReactivateRecurringSubscription={() => {
                    if (currentUser) {
                      const updatedUser: AuthUser = {
                        ...currentUser,
                        autoRenewCanceled: false,
                      };
                      setCurrentUser(updatedUser);
                      if (currentUser.email) {
                        updateUserAccountInFirestore(currentUser.email, {
                          autoRenewCanceled: false,
                        });
                      }
                    }
                    showProSuccess('✅ Renovação automática reativada com sucesso!');
                  }}
                  onApplyCoupon={handleApplyCoupon}
                  onCreateCoupon={handleCreateCoupon}
                  onDeleteCoupon={handleDeleteCoupon}
                  onUpdateMpConfig={handleUpdateMpConfig}
                  onShowUiDialog={setUiDialog}
                  onOpenAdminUsers={() => setShowAdminPanel(true)}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* JANELA DEDICADA DO ASSISTENTE PASSO A PASSO DE CONFIGURAÇÃO DA CONTA PROFISSIONAL */}
      <ProOnboardingWizardModal
        isOpen={onboardingWizardStep !== null}
        step={onboardingWizardStep || 1}
        activationBadge={wizardActivationBadge}
        onSelectStep={goToWizardStep}
        onSkip={skipProOnboardingWizard}
        onFinish={finishProOnboardingWizard}
        isBarbershop={proBusinessNiche === 'BARBERSHOP'}
        bookingRules={bookingRules}
        setBookingRules={setBookingRules}
        proDisplayName={proDisplayName}
        setProDisplayName={setProDisplayName}
        proDisplayTitle={proDisplayTitle}
        setProDisplayTitle={setProDisplayTitle}
        proInstagram={proInstagram}
        setProInstagram={setProInstagram}
        proWhatsapp={proWhatsapp}
        setProWhatsapp={setProWhatsapp}
        proDisplayBio={proDisplayBio}
        setProDisplayBio={setProDisplayBio}
        proAvatarUrl={proAvatarUrl}
        proCoverUrl={proCoverUrl}
        setProCoverUrl={setProCoverUrl}
        onAvatarFileUpload={handleAvatarFileUpload}
        onCoverFileUpload={handleCoverFileUpload}
        proPortfolioList={proPortfolioList}
        setProPortfolioList={setProPortfolioList}
        compressImageFile={compressImageFile}
        proServicesList={proServicesList}
        setProServicesList={setProServicesList}
        proBaseCep={proBaseCep}
        onBaseCepLookup={handleBaseCepLookup}
        baseCepLoading={baseCepLoading}
        baseCepError={baseCepError}
        proBaseCity={proBaseCity}
        setProBaseCity={setProBaseCity}
        proBaseNeighborhood={proBaseNeighborhood}
        setProBaseNeighborhood={setProBaseNeighborhood}
        proBaseAddress={proBaseAddress}
        setProBaseAddress={setProBaseAddress}
        bufferMinutes={proBufferTime}
        setBufferMinutes={setProBufferTime}
        proNeighborhoodsList={proNeighborhoodsList}
        setProNeighborhoodsList={setProNeighborhoodsList}
        dynamicCitySuggestions={dynamicCitySuggestions}
        proCpf={currentUser?.cpf || authCpf}
        currentUserEmail={currentUser?.email || authEmail}
      />

      {/* JANELA GERADORA DE ARTE PARA STORIES & QR CODE DA VITRINE */}
      <ProPromoCardModal
        isOpen={showPromoCardModal}
        onClose={() => setShowPromoCardModal(false)}
        proName={proDisplayName || currentUser?.fullName || ''}
        proTitle={proDisplayTitle}
        proAvatarUrl={proAvatarUrl}
        proInstagram={proInstagram}
        proBaseCity={proBaseCity}
        proBaseNeighborhood={proBaseNeighborhood}
        proServices={proServicesList}
        vitrineUrl={getDirectVitrineUrl()}
        proSlug={myCustomProProfile.slug}
        businessNiche={proBusinessNiche}
        serviceMode={proServiceMode}
        studioName={proStudioName}
      />

      {/* JANELA DE CADASTRO MANUAL DE AGENDAMENTO (WHATSAPP / TELEFONE / PRESENCIAL) */}
      <ManualAppointmentModal
        isOpen={showManualAppointmentModal}
        onClose={() => setShowManualAppointmentModal(false)}
        onSave={handleSaveManualAppointment}
        proServices={proServicesList}
        businessNiche={proBusinessNiche}
        serviceMode={proServiceMode}
        studioName={proStudioName}
        studioAddress={draftStudioAddress || proBaseAddress}
        baseNeighborhood={proBaseNeighborhood}
        proId={myCustomProProfile.id || myProId || (activeProKey ? `pro-${activeProKey}` : undefined)}
        proEmail={currentUser?.email || undefined}
        proName={proDisplayName || currentUser?.fullName || ''}
        proSlug={myCustomProProfile.slug || dynamicSlug}
        proAvatarUrl={proAvatarUrl}
        proWhatsapp={proWhatsapp}
      />

      {/* MODAL DE CONFIGURAÇÃO DE REGRAS DE AGENDAMENTO & SINAL DE 50% */}
      <BookingRulesModal
        isOpen={showBookingRulesModal}
        onClose={() => setShowBookingRulesModal(false)}
        currentSettings={bookingRules}
        onSave={(newRules) => {
          setBookingRules(newRules);
          try {
            if (activeProKey) {
              localStorage.setItem(`belladoor_v2_booking_rules_${activeProKey}`, JSON.stringify(newRules));
            }
          } catch {}
          if (activeProKey && isFirebaseConfigured()) {
            syncDocumentToFirestore(`pro_booking_rules_${activeProKey}`, newRules);
          }
          setUiDialog({
            emoji: '🛡️',
            badge: 'Regras Atualizadas',
            title: 'Regras de Agendamento Salvas!',
            message: newRules.requireDeposit
              ? `O sinal de ${newRules.depositPercentage}% e as regras de confirmação no WhatsApp foram atualizados com sucesso.`
              : 'As regras de atendimento e a mensagem de confirmação foram atualizadas.',
            buttonText: 'Continuar',
            variant: 'success',
          });
        }}
        proName={proDisplayName || currentUser?.fullName || ''}
        proWhatsapp={proWhatsapp}
        proEmail={currentUser?.email}
        proCpf={currentUser?.cpf || authCpf}
        isBarbershop={proBusinessNiche === 'BARBERSHOP'}
      />

      {/* MODAL DE FEEDBACK DO PROGRAMA BETA (10 PRIMEIRAS PROFISSIONAIS) */}
      <BetaFeedbackModal
        isOpen={showBetaFeedbackModal}
        onClose={() => setShowBetaFeedbackModal(false)}
        proEmail={currentUser?.email || 'profissional@belladoor.com.br'}
        proName={proDisplayName || currentUser?.fullName || 'Profissional'}
        proWhatsapp={proWhatsapp}
        existingFeedback={
          betaFeedbacks.find(
            (f) => f.proEmail?.toLowerCase() === (currentUser?.email || '').toLowerCase()
          ) || null
        }
        onSubmitFeedback={async (feedback) => {
          await appendFeedbackToFirestore(feedback);
          setBetaFeedbacks((prev) => [
            feedback,
            ...prev.filter(
              (f) =>
                f.id !== feedback.id &&
                f.proEmail?.toLowerCase() !== feedback.proEmail?.toLowerCase()
            ),
          ]);
          try {
            localStorage.setItem('belladoor_v2_feedback_submitted', 'true');
          } catch {}
        }}
      />

      {/* MODAL OBRIGATÓRIO DE CPF PARA PROFISSIONAIS LOGADAS VIA GOOGLE OU SEM CPF */}
      <ProCpfPromptModal
        isOpen={Boolean(
          currentUser &&
          currentUser.role === 'PROFESSIONAL' &&
          !currentUser.cpf &&
          !currentUser.id.includes('visitor') &&
          !currentUser.id.includes('guest')
        )}
        userFullName={currentUser?.fullName}
        userEmail={currentUser?.email}
        onSaveCpf={handleSaveMissingProCpf}
      />

      {/* MODAIS GLOBAIS: ONBOARDING 7 DIAS GRÁTIS & JANELINHA PADRÃO BELLADOOR */}
      <GlobalModals
        showTrialModal={showTrialModal}
        userFullName={currentUser?.fullName}
        selectedTrialPlan={selectedTrialPlan}
        uiDialog={uiDialog}
        onCloseTrialModal={() => {
          setShowTrialModal(false);
          if (!hasCompletedInitialOnboarding) {
            startProOnboardingWizard('🎉 7 Dias Grátis Liberados');
          }
        }}
        onSelectTrialPlan={setSelectedTrialPlan}
        onActivateFreeTrial={() => {
          setPlanInterval(selectedTrialPlan);
          setShowTrialModal(false);
          if (!hasCompletedInitialOnboarding) {
            startProOnboardingWizard('🎉 7 Dias Grátis Liberados');
          }
        }}
        onPayNowFromModal={() => {
          setPlanInterval(selectedTrialPlan);
          setShowTrialModal(false);
          setPendingWizardAfterPayment(!hasCompletedInitialOnboarding);
          setProSubTab('billing');
          setCheckoutMethod(selectedTrialPlan === 'ANNUAL' ? 'PIX' : 'CARD');
          setShowCheckoutModal(true);
        }}
        onApplyCouponFromModal={handleApplyCoupon}
        onCloseUiDialog={() => setUiDialog(null)}
      />

      {/* MODAL LGPD: POLÍTICA DE PRIVACIDADE, TERMOS DE USO E EXCLUSÃO DE CONTA */}
      <LgpdTermsModal
        isOpen={lgpdModalState.open}
        initialTab={lgpdModalState.tab}
        currentUser={currentUser}
        isAccepted={
          Boolean(
            (currentUser?.email && currentUser?.id !== 'usr-visitor-link') ||
            (termsAccepted && privacyAccepted) ||
            currentUser?.termsAcceptedAt ||
            currentUser?.privacyAcceptedAt ||
            currentUser?.lgpdConsentAt
          )
        }
        onClose={() => setLgpdModalState((prev) => ({ ...prev, open: false }))}
        onAcceptTerms={() => {
          setTermsAccepted(true);
          setPrivacyAccepted(true);
          setLgpdAccepted(true);
          if (currentUser?.email) {
            currentUser.termsAcceptedAt = currentUser.termsAcceptedAt || new Date().toISOString();
            currentUser.privacyAcceptedAt = currentUser.privacyAcceptedAt || new Date().toISOString();
            currentUser.termsVersion = currentUser.termsVersion || '2026.2';
            currentUser.privacyVersion = currentUser.privacyVersion || '2026.2';
            currentUser.lgpdConsentAt = currentUser.lgpdConsentAt || new Date().toISOString();
            try {
              localStorage.setItem('belladoor_v2_user', JSON.stringify(currentUser));
            } catch {}
          }
        }}
        onDeleteOwnAccount={currentUser ? handleDeleteOwnAccount : undefined}
      />

      {/* RODAPÉ OFICIAL COM LINKS LGPD */}
      <footer className="w-full text-center py-6 px-4 text-xs text-stone-500 border-t border-stone-200 bg-white space-y-2">
        <p className="font-medium text-stone-600">
          BellaDoor © 2026 — Plataforma de Gestão e Agendamento para Profissionais da Beleza a Domicílio
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-stone-500">
          <button
            type="button"
            onClick={() => setLgpdModalState({ open: true, tab: 'TERMS' })}
            className="hover:text-rose-700 underline underline-offset-2 font-semibold transition"
          >
            Termos de Uso
          </button>
          <span className="text-stone-300">•</span>
          <button
            type="button"
            onClick={() => setLgpdModalState({ open: true, tab: 'PRIVACY' })}
            className="hover:text-rose-700 underline underline-offset-2 font-semibold transition"
          >
            Política de Privacidade (LGPD)
          </button>
          <span className="text-stone-300">•</span>
          <button
            type="button"
            onClick={() => setLgpdModalState({ open: true, tab: 'RIGHTS' })}
            className="hover:text-rose-700 underline underline-offset-2 font-semibold transition cursor-pointer"
          >
            {currentUser ? 'Privacidade / Excluir Minha Conta' : 'Direitos do Titular (LGPD)'}
          </button>
        </div>
      </footer>
    </div>
  );
}
