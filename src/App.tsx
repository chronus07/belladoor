import React, { useState, useEffect } from 'react';
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
  RotateCcw
} from 'lucide-react';
import { mockProfessional, MockService, MockNeighborhood, mockProfessionalsList, MockProfessional } from './data/mockData';
import { BELLADOOR_PLANS } from '../lib/subscriptionService';
import {
  AuthUser,
  signInWithGoogleOAuth,
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  isSupabaseConfigured
} from '../lib/supabaseClient';
import {
  ClientAppointment,
  ClientReview,
  UiDialogPayload,
  DEFAULT_REVIEWS,
  WEEKDAYS,
  MONTH_NAMES,
} from './types/belladoor';
import { loadFromStorage, formatWhatsappForLink, getDatesInRange } from './utils/storage';
import { HeaderBar } from './components/HeaderBar';
import { AuthView } from './components/AuthView';
import { ClientBookingsView } from './components/ClientBookingsView';
import { MarketplaceView } from './components/MarketplaceView';
import { ProBillingTab } from './components/ProBillingTab';
import { GlobalModals } from './components/GlobalModals';

export default function App() {
  const savedVitrine = loadFromStorage('belladoor_pro_vitrine', {
    name: mockProfessional.name,
    title: mockProfessional.title,
    bio: mockProfessional.bio,
    instagram: mockProfessional.instagram,
    whatsapp: mockProfessional.whatsapp,
    avatarUrl: mockProfessional.avatarUrl,
    coverUrl: mockProfessional.coverUrl,
    portfolio: mockProfessional.portfolio,
    bufferTimeMinutes: mockProfessional.bufferTimeMinutes,
  });

  const [activeTab, setActiveTab] = useState<'client' | 'pro'>(() =>
    loadFromStorage<'client' | 'pro'>('belladoor_active_tab', 'client')
  );
  const [clientSubView, setClientSubView] = useState<'EXPLORE' | 'MY_BOOKINGS'>('EXPLORE');
  const [selectedPro, setSelectedPro] = useState<MockProfessional | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Estados de Personalização da Vitrine da Profissional (Persistidos no localStorage)
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
    loadFromStorage<MockService[]>('belladoor_pro_services', mockProfessional.services)
  );
  const [proNeighborhoodsList, setProNeighborhoodsList] = useState<MockNeighborhood[]>(() =>
    loadFromStorage<MockNeighborhood[]>('belladoor_pro_areas', mockProfessional.neighborhoods)
  );
  const [proBufferTime, setProBufferTime] = useState<number>(savedVitrine.bufferTimeMinutes);

  // Avaliações reais das clientes (Passo 4)
  const [proReviews, setProReviews] = useState<ClientReview[]>(() =>
    loadFromStorage<ClientReview[]>('belladoor_reviews', DEFAULT_REVIEWS)
  );
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewClientName, setReviewClientName] = useState<string>('');
  const [reviewServiceName, setReviewServiceName] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewAppointmentId, setReviewAppointmentId] = useState<string | null>(null);

  // Cálculo dinâmico da nota média com base nas avaliações
  const calculatedRating =
    proReviews.length > 0
      ? Number((proReviews.reduce((acc, r) => acc + r.rating, 0) / proReviews.length).toFixed(1))
      : mockProfessional.rating;

  // Normaliza o número de WhatsApp para links wa.me (garantindo DDI 55 se digitado apenas DDD + número)
  const formattedWhatsappForLink = formatWhatsappForLink(proWhatsapp, mockProfessional.whatsapp);


  // Perfil dinâmico da profissional sincronizado em tempo real com a Vitrine
  const myCustomProProfile: MockProfessional = {
    ...mockProfessional,
    name: proDisplayName,
    title: proDisplayTitle,
    bio: proDisplayBio,
    instagram: proInstagram.replace(/^@+/, '').trim(),
    whatsapp: formattedWhatsappForLink,
    avatarUrl: proAvatarUrl,
    coverUrl: proCoverUrl,
    portfolio: proPortfolioList,
    services: proServicesList,
    neighborhoods: proNeighborhoodsList,
    bufferTimeMinutes: proBufferTime,
    rating: calculatedRating,
    reviewCount: mockProfessional.reviewCount + Math.max(0, proReviews.length - DEFAULT_REVIEWS.length),
  };

  const pro =
    selectedPro && selectedPro.id !== mockProfessional.id ? selectedPro : myCustomProProfile;

  // Estados de Autenticação & Teste Grátis de 7 Dias (Persistido no localStorage)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() =>
    loadFromStorage<AuthUser | null>('belladoor_user', null)
  );
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authRole, setAuthRole] = useState<'CLIENT' | 'PROFESSIONAL'>('CLIENT');
  const [authName, setAuthName] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showTrialModal, setShowTrialModal] = useState<boolean>(false);
  const [selectedTrialPlan, setSelectedTrialPlan] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');

  // Login Social com Google
  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await signInWithGoogleOAuth(authRole);
      if (res.error) {
        setAuthError(res.error);
      } else {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);
        const simUser: AuthUser = {
          id: `usr-google-${Date.now()}`,
          email: authRole === 'PROFESSIONAL' ? 'pro.beleza@gmail.com' : 'cliente.vip@gmail.com',
          fullName: authRole === 'PROFESSIONAL' ? 'Camila Martins (Google)' : 'Fernanda Lima (Google)',
          role: authRole,
          avatarUrl: authRole === 'PROFESSIONAL' ? proAvatarUrl : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          isTrialActive: authRole === 'PROFESSIONAL',
          trialDaysLeft: 7,
          trialEndsAt: authRole === 'PROFESSIONAL' ? trialEnd.toISOString() : undefined,
          subscriptionPlan: 'ANNUAL',
        };
        setCurrentUser(simUser);
        if (authRole === 'PROFESSIONAL') {
          setActiveTab('pro');
          setShowTrialModal(true);
        } else {
          setActiveTab('client');
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Cadastro ou Login com E-mail
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('Preencha e-mail e senha.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'REGISTER') {
        const res = await signUpWithEmail(authEmail, authPassword, authName, authRole);
        if (res.error) {
          setAuthError(res.error);
        } else if (res.user) {
          setCurrentUser(res.user);
          if (authRole === 'PROFESSIONAL') {
            setActiveTab('pro');
            setShowTrialModal(true);
          } else {
            setActiveTab('client');
          }
        }
      } else {
        const res = await signInWithEmail(authEmail, authPassword);
        if (res.error) {
          setAuthError(res.error);
        } else if (res.user) {
          setCurrentUser(res.user);
          if (res.user.role === 'PROFESSIONAL') {
            setActiveTab('pro');
          } else {
            setActiveTab('client');
          }
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
    setSelectedPro(null);
    resetBooking();
  };

  // Acesso rápido de demonstração (1 clique)
  const handleQuickDemoLogin = (role: 'CLIENT' | 'PROFESSIONAL') => {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);
    if (role === 'PROFESSIONAL') {
      const proUser: AuthUser = {
        id: 'usr-pro-demo',
        email: 'camila.martins@belladoor.app',
        fullName: proDisplayName,
        role: 'PROFESSIONAL',
        avatarUrl: proAvatarUrl,
        isTrialActive: true,
        trialDaysLeft: 7,
        trialEndsAt: trialEnd.toISOString(),
        subscriptionPlan: 'ANNUAL',
      };
      setCurrentUser(proUser);
      setActiveTab('pro');
      setShowTrialModal(true);
    } else {
      const clientUser: AuthUser = {
        id: 'usr-client-demo',
        email: 'fernanda.lima@gmail.com',
        fullName: 'Fernanda Lima',
        role: 'CLIENT',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      };
      setCurrentUser(clientUser);
      setActiveTab('client');
    }
  };

  // Lista completa de profissionais da vitrine (com o perfil da profissional logada sincronizado ao vivo)
  const allProfessionalsWithLivePro = mockProfessionalsList.map((p) =>
    p.id === mockProfessional.id ? myCustomProProfile : p
  );

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

  // Lista dinâmica de agendamentos (persistida no localStorage)
  const [proAppointments, setProAppointments] = useState<ClientAppointment[]>(() =>
    loadFromStorage<ClientAppointment[]>('belladoor_appointments', [
      {
        id: 'app-1',
        clientName: 'Fernanda Lima',
        clientPhone: '11988881111',
        serviceName: 'Alongamento em Fibra de Vidro',
        date: '2026-10-07',
        time: '10:00',
        address: 'Av. Ibirapuera, 1850 - Apto 32',
        neighborhood: 'Moema',
        travelFee: 0,
        totalPrice: 180,
        status: 'Confirmado',
        proName: mockProfessional.name,
        proSlug: mockProfessional.slug,
      },
      {
        id: 'app-2',
        clientName: 'Juliana Costa',
        clientPhone: '11977772222',
        serviceName: 'Spa dos Pés + Esmaltação em Gel',
        date: '2026-10-07',
        time: '13:30',
        address: 'Rua Joaquim Floriano, 400 - Casa 2',
        neighborhood: 'Itaim Bibi',
        travelFee: 15,
        totalPrice: 125,
        status: 'Confirmado',
        proName: mockProfessional.name,
        proSlug: mockProfessional.slug,
      },
      {
        id: 'app-3',
        clientName: 'Renata Silveira',
        clientPhone: '11966663333',
        serviceName: 'Blindagem de Diamante',
        date: '2026-10-07',
        time: '16:30',
        address: 'Rua Oscar Freire, 920 - Apto 101',
        neighborhood: 'Jardins / Cerqueira César',
        travelFee: 15,
        totalPrice: 135,
        status: 'Confirmado',
        proName: mockProfessional.name,
        proSlug: mockProfessional.slug,
      },
    ])
  );

  // Estados do Painel da Profissional (Etapa 4 & 5)
  const [proSubTab, setProSubTab] = useState<'portfolio' | 'agenda' | 'services' | 'areas' | 'billing'>('portfolio');
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

  // Upload de Foto de Perfil do Aparelho (Computador / Celular)
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProAvatarUrl(reader.result);
        if (currentUser && currentUser.role === 'PROFESSIONAL') {
          setCurrentUser({ ...currentUser, avatarUrl: reader.result });
        }
        showProSuccess('📷 Foto de perfil atualizada na sua Vitrine!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload de Imagem de Capa / Banner do Aparelho (Computador / Celular)
  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProCoverUrl(reader.result);
        showProSuccess('🖼️ Imagem do banner de capa atualizada na sua Vitrine!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload de Foto de Trabalho Realizado (Portfólio)
  const handlePortfolioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPortfolioPhotoUrl(reader.result);
        setPortfolioFormError(null);
        if (!portfolioPhotoTitle.trim()) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setPortfolioPhotoTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
      }
    };
    reader.readAsDataURL(file);
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
  const [areaFormMode, setAreaFormMode] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [areaName, setAreaName] = useState<string>('');
  const [areaFee, setAreaFee] = useState<string>('15');
  const [areaIsFree, setAreaIsFree] = useState<boolean>(false);
  const [areaCepInput, setAreaCepInput] = useState<string>('');
  const [areaCepLoading, setAreaCepLoading] = useState<boolean>(false);
  const [areaFormError, setAreaFormError] = useState<string | null>(null);

  const openCreateAreaPage = () => {
    setEditingAreaId(null);
    setAreaName('');
    setAreaFee('15');
    setAreaIsFree(false);
    setAreaCepInput('');
    setAreaFormError(null);
    setAreaFormMode('CREATE');
  };

  const openEditAreaPage = (area: MockNeighborhood) => {
    setEditingAreaId(area.id);
    setAreaName(area.name);
    setAreaFee(String(area.travelFee));
    setAreaIsFree(area.travelFee === 0);
    setAreaCepInput('');
    setAreaFormError(null);
    setAreaFormMode('EDIT');
  };

  // Busca opcional de CEP para descobrir bairro automaticamente no cadastro de região
  const handleAreaCepLookup = async (val: string) => {
    const clean = val.replace(/\D/g, '');
    setAreaCepInput(val);
    if (clean.length === 8) {
      setAreaCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (!data.erro && data.bairro) {
          setAreaName(data.bairro);
        }
      } catch {
        // Silencioso caso falhe
      } finally {
        setAreaCepLoading(false);
      }
    }
  };

  const handleSaveAreaForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) {
      setAreaFormError('Informe o nome do bairro ou região atendida.');
      return;
    }
    const parsedFee = areaIsFree ? 0 : Math.max(0, Number(String(areaFee).replace(',', '.')) || 0);

    if (areaFormMode === 'CREATE') {
      const newArea: MockNeighborhood = {
        id: `b-${Date.now()}`,
        name: areaName.trim(),
        travelFee: parsedFee,
      };
      setProNeighborhoodsList([...proNeighborhoodsList, newArea]);
      showProSuccess(
        `🚗 Região "${newArea.name}" cadastrada (${parsedFee === 0 ? 'Deslocamento Grátis' : `Taxa R$ ${parsedFee.toFixed(2).replace('.', ',')}`})!`
      );
    } else if (areaFormMode === 'EDIT' && editingAreaId) {
      setProNeighborhoodsList(
        proNeighborhoodsList.map((n) =>
          n.id === editingAreaId ? { ...n, name: areaName.trim(), travelFee: parsedFee } : n
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

  // Estados de Assinatura SaaS (Persistidos no localStorage)
  const savedSub = loadFromStorage('belladoor_subscription', {
    status: 'TRIAL' as 'TRIAL' | 'ACTIVE',
    interval: 'ANNUAL' as 'MONTHLY' | 'ANNUAL',
  });
  const [subscriptionStatus, setSubscriptionStatus] = useState<'TRIAL' | 'ACTIVE'>(savedSub.status);
  const [planInterval, setPlanInterval] = useState<'MONTHLY' | 'ANNUAL'>(savedSub.interval);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [checkoutMethod, setCheckoutMethod] = useState<'PIX' | 'CARD'>('PIX');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState<boolean>(false);

  // Configuração de Expediente Padrão (Dias da Semana + Horário de Início/Fim + Almoço) - Passo 3
  const savedSchedule = loadFromStorage('belladoor_schedule', {
    workingDays: pro.workingDays || [1, 2, 3, 4, 5, 6],
    workStartHour: 9,
    workEndHour: 19,
    lunchBreakEnabled: true,
    blockedPeriods: [
      {
        id: 'blk-1',
        startDate: '2026-10-11',
        endDate: '2026-10-11',
        reason: 'Folga Pessoal / Domingo',
        dates: ['2026-10-11'],
      },
      {
        id: 'blk-2',
        startDate: '2026-10-15',
        endDate: '2026-10-17',
        reason: 'Masterclass Noivas & Penteados em SP',
        dates: ['2026-10-15', '2026-10-16', '2026-10-17'],
      },
    ],
  });

  const [workingDays, setWorkingDays] = useState<number[]>(savedSchedule.workingDays);
  const [workStartHour, setWorkStartHour] = useState<number>(savedSchedule.workStartHour);
  const [workEndHour, setWorkEndHour] = useState<number>(savedSchedule.workEndHour);
  const [lunchBreakEnabled, setLunchBreakEnabled] = useState<boolean>(savedSchedule.lunchBreakEnabled);

  // Controle de Bloqueio de Agenda por Período (Início e Fim)
  const [blockedPeriods, setBlockedPeriods] = useState<{
    id: string;
    startDate: string;
    endDate: string;
    reason: string;
    dates: string[];
  }[]>(savedSchedule.blockedPeriods);

  // =========================================================================
  // PASSO 1: PERSISTÊNCIA AUTOMÁTICA NO LOCALSTORAGE (Não perde nada no F5)
  // =========================================================================
  useEffect(() => {
    try {
      localStorage.setItem('belladoor_active_tab', JSON.stringify(activeTab));
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('belladoor_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('belladoor_user');
      }
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'belladoor_pro_vitrine',
        JSON.stringify({
          name: proDisplayName,
          title: proDisplayTitle,
          bio: proDisplayBio,
          instagram: proInstagram,
          whatsapp: proWhatsapp,
          avatarUrl: proAvatarUrl,
          coverUrl: proCoverUrl,
          portfolio: proPortfolioList,
          bufferTimeMinutes: proBufferTime,
        })
      );
    } catch {}
  }, [
    proDisplayName,
    proDisplayTitle,
    proDisplayBio,
    proInstagram,
    proWhatsapp,
    proAvatarUrl,
    proCoverUrl,
    proPortfolioList,
    proBufferTime,
  ]);

  useEffect(() => {
    try {
      localStorage.setItem('belladoor_pro_services', JSON.stringify(proServicesList));
    } catch {}
  }, [proServicesList]);

  useEffect(() => {
    try {
      localStorage.setItem('belladoor_pro_areas', JSON.stringify(proNeighborhoodsList));
    } catch {}
  }, [proNeighborhoodsList]);

  useEffect(() => {
    try {
      localStorage.setItem('belladoor_appointments', JSON.stringify(proAppointments));
    } catch {}
  }, [proAppointments]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'belladoor_schedule',
        JSON.stringify({
          workingDays,
          workStartHour,
          workEndHour,
          lunchBreakEnabled,
          blockedPeriods,
        })
      );
    } catch {}
  }, [workingDays, workStartHour, workEndHour, lunchBreakEnabled, blockedPeriods]);

  useEffect(() => {
    try {
      localStorage.setItem('belladoor_reviews', JSON.stringify(proReviews));
    } catch {}
  }, [proReviews]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'belladoor_subscription',
        JSON.stringify({ status: subscriptionStatus, interval: planInterval })
      );
    } catch {}
  }, [subscriptionStatus, planInterval]);

  // =========================================================================
  // PASSO 2: LINK DIRETO DA VITRINE (?pro=ana-silva-nails) + COMPARTILHAMENTO
  // =========================================================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const proSlugParam = params.get('pro');
    if (proSlugParam) {
      const matched = allProfessionalsWithLivePro.find(
        (p) => p.slug.toLowerCase() === proSlugParam.toLowerCase()
      );
      const targetPro = matched || myCustomProProfile;
      setSelectedPro(targetPro);
      setActiveTab('client');
      setClientSubView('EXPLORE');
      // Se o visitante abriu o link direto da profissional e não estava logado,
      // criamos uma sessão de visitante cliente para ele já ver a vitrine sem barreira!
      if (!currentUser) {
        setCurrentUser({
          id: 'usr-visitor-link',
          email: 'cliente@belladoor.app',
          fullName: 'Cliente Convidada',
          role: 'CLIENT',
        });
      }
    }
  }, []);

  const getDirectVitrineUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return `${origin}/?pro=${myCustomProProfile.slug}`;
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
        message: 'Envie este link direto para suas clientes ou coloque na Bio do seu Instagram:',
        highlight: url,
        buttonText: 'Pronto!',
        variant: 'rose',
      });
    }
  };

  const handleShareVitrineWhatsApp = () => {
    const url = getDirectVitrineUrl();
    const text = encodeURIComponent(
      `Olá! ✨ Agora você pode ver meu portfólio de trabalhos, valores e agendar seu atendimento a domicílio direto pela minha vitrine online no *BellaDoor*:\n\n👉 ${url}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  // Estado para novo bloqueio de período no Painel da Profissional
  const [newBlockStartDate, setNewBlockStartDate] = useState<string>('2026-10-20');
  const [newBlockEndDate, setNewBlockEndDate] = useState<string>('2026-10-22');
  const [newBlockReason, setNewBlockReason] = useState<string>('Férias & Descanso');
  const [proCalendarYear, setProCalendarYear] = useState<number>(2026);
  const [proCalendarMonth, setProCalendarMonth] = useState<number>(9); // 9 = Outubro
  const [rangeSelectStep, setRangeSelectStep] = useState<'START' | 'END'>('START');

  // Alternador de dias de atendimento padrão
  const toggleWorkingDay = (dayIndex: number) => {
    if (workingDays.includes(dayIndex)) {
      if (workingDays.length === 1) {
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
      setWorkingDays(workingDays.filter((d) => d !== dayIndex));
    } else {
      setWorkingDays([...workingDays, dayIndex].sort());
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
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1);
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);
  const [lastBooking, setLastBooking] = useState<ClientAppointment | null>(null);

  // Navegação de Meses no Calendário
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(9); // 9 = Outubro (0-indexed)

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    if (calendarYear === 2026 && calendarMonth === 9) return;
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
    if (proCalendarYear === 2026 && proCalendarMonth === 9) return;
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

  // =========================================================================
  // PASSO 3: HORÁRIOS DINÂMICOS BASEADOS NO EXPEDIENTE E AGENDAMENTOS REAIS
  // =========================================================================
  const availableSlots = (() => {
    const slots: { time: string; available: boolean; reason?: string }[] = [];
    for (let h = workStartHour; h < workEndHour; h++) {
      if (lunchBreakEnabled && h === 12) {
        continue; // Pausa para almoço (12:00 às 13:00)
      }
      const timeLabel = `${String(h).padStart(2, '0')}:00`;
      const isBookedOnDate =
        selectedDate &&
        proAppointments.some(
          (app) =>
            app.date === selectedDate &&
            app.time === timeLabel &&
            app.status !== 'Cancelado'
        );

      slots.push({
        time: timeLabel,
        available: !isBookedOnDate,
        reason: isBookedOnDate ? 'Horário já reservado' : undefined,
      });
    }
    return slots;
  })();

  const totalAmount = (selectedService?.price || 0) + travelFee;

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
        setCity(data.localidade || '');

        const matchedArea = proNeighborhoodsList.find((n) =>
          n.name.toLowerCase().includes(data.bairro?.toLowerCase() || '') ||
          data.bairro?.toLowerCase().includes(n.name.toLowerCase())
        );

        if (matchedArea) {
          setTravelFee(matchedArea.travelFee);
          setIsNeighborhoodCovered(true);
        } else if (data.localidade?.toLowerCase() === pro.baseCity.toLowerCase()) {
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

    const newAppointment: ClientAppointment = {
      id: `app-${Date.now()}`,
      clientName,
      clientPhone,
      serviceName: selectedService?.name || 'Atendimento',
      date: selectedDate,
      time: selectedTime || '14:00',
      address: `${street}, ${number}${complement ? ` - ${complement}` : ''}`,
      neighborhood: neighborhood,
      travelFee: travelFee,
      totalPrice: totalAmount,
      status: 'Confirmado',
      proName: pro.name,
      proSlug: pro.slug,
      reviewed: false,
    };

    setProAppointments((prev) => [newAppointment, ...prev]);
    setLastBooking(newAppointment);
    setBookingConfirmed(true);
  };

  // =========================================================================
  // PASSO 4: GERENCIAMENTO DE AGENDAMENTOS DA CLIENTE & AVALIAÇÕES (⭐)
  // =========================================================================
  const handleCancelClientAppointment = (appointmentId: string, serviceName: string) => {
    setProAppointments((prev) =>
      prev.map((app) => (app.id === appointmentId ? { ...app, status: 'Cancelado' } : app))
    );
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
    setReviewAppointmentId(app.id);
    setReviewClientName(app.clientName);
    setReviewServiceName(app.serviceName);
    setReviewRating(5);
    setReviewComment('');
    setShowReviewForm(true);
  };

  const handleSubmitClientReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      setUiDialog({
        emoji: '⭐',
        badge: 'Avaliação',
        title: 'Escreva um breve comentário',
        message: 'Conte como foi sua experiência com o atendimento a domicílio para ajudar outras clientes!',
        buttonText: 'Voltar',
        variant: 'rose',
      });
      return;
    }

    const todayStr = new Date().toLocaleDateString('pt-BR');
    const newReview: ClientReview = {
      id: `rev-${Date.now()}`,
      clientName: reviewClientName.trim() || currentUser?.fullName || 'Cliente Verificada',
      serviceName: reviewServiceName.trim() || 'Atendimento a Domicílio',
      rating: reviewRating,
      comment: reviewComment.trim(),
      date: todayStr,
    };

    setProReviews((prev) => [newReview, ...prev]);
    if (reviewAppointmentId) {
      setProAppointments((prev) =>
        prev.map((a) => (a.id === reviewAppointmentId ? { ...a, reviewed: true, status: 'Concluído' } : a))
      );
    }

    setShowReviewForm(false);
    setReviewAppointmentId(null);
    setReviewComment('');

    setUiDialog({
      emoji: '💖',
      badge: 'Avaliação Publicada',
      title: 'Obrigada pelo seu Carinho!',
      message: 'Sua avaliação com estrelas já está publicada na vitrine da profissional e atualizou a nota média dela.',
      highlight: `${'⭐'.repeat(newReview.rating)} "${newReview.comment}"`,
      buttonText: 'Fechar',
      variant: 'success',
    });
  };

  // Gera o link direto para o WhatsApp da Profissional com a mensagem pré-formatada
  const getWhatsAppBookingLink = () => {
    if (!lastBooking) return '#';
    const message = encodeURIComponent(
      `Olá, ${pro.name}! ✨\n` +
      `Acabei de realizar um agendamento pelo *BellaDoor*:\n\n` +
      `💅 *Serviço:* ${lastBooking.serviceName}\n` +
      `📅 *Data:* ${lastBooking.date.split('-').reverse().join('/')}\n` +
      `⏰ *Horário:* ${lastBooking.time}\n` +
      `📍 *Endereço:* ${lastBooking.address} (${lastBooking.neighborhood})\n` +
      `💰 *Total:* R$ ${lastBooking.totalPrice.toFixed(2).replace('.', ',')} (com deslocamento)\n` +
      `👤 *Cliente:* ${lastBooking.clientName}\n\n` +
      `Aguardo sua confirmação! 😊`
    );
    return `https://wa.me/${pro.whatsapp}?text=${message}`;
  };

  const resetBooking = () => {
    setSelectedService(null);
    setSelectedTime(null);
    setBookingConfirmed(false);
    setLastBooking(null);
    setStep(1);
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
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center">
      {/* BARRA SUPERIOR DO BELLADOOR (COMPONENTE MODULAR) */}
      <HeaderBar
        currentUser={currentUser}
        activeTab={activeTab}
        clientSubView={clientSubView}
        activeAppointmentsCount={proAppointments.filter((a) => a.status !== 'Cancelado').length}
        proDisplayName={proDisplayName}
        proAvatarUrl={proAvatarUrl}
        onToggleClientSubView={() =>
          setClientSubView(clientSubView === 'MY_BOOKINGS' ? 'EXPLORE' : 'MY_BOOKINGS')
        }
        onToggleProPreview={() => {
          if (activeTab === 'pro') {
            setSelectedPro(myCustomProProfile);
            setClientSubView('EXPLORE');
            setActiveTab('client');
          } else {
            setActiveTab('pro');
          }
        }}
        onLogout={handleLogout}
      />

      {/* CONTEÚDO PRINCIPAL */}
      <main className="w-full max-w-md sm:max-w-xl py-6 px-4">
        {!currentUser ? (
          /* ============================================================ */
          /* 0. TELA INICIAL: LOGIN & CADASTRO (COMPONENTE MODULAR)       */
          /* ============================================================ */
          <AuthView
            authMode={authMode}
            authRole={authRole}
            authName={authName}
            authEmail={authEmail}
            authPassword={authPassword}
            authLoading={authLoading}
            authError={authError}
            onSelectRole={setAuthRole}
            onChangeMode={(mode) => {
              setAuthMode(mode);
              setAuthError(null);
            }}
            onChangeName={setAuthName}
            onChangeEmail={setAuthEmail}
            onChangePassword={setAuthPassword}
            onGoogleAuth={handleGoogleAuth}
            onEmailAuthSubmit={handleEmailAuthSubmit}
            onQuickDemoLogin={handleQuickDemoLogin}
          />
        ) : activeTab === 'client' ? (
          /* ============================================================ */
          /* 1. VISÃO DA CLIENTE                                          */
          /* ============================================================ */
          clientSubView === 'MY_BOOKINGS' ? (
            /* ========================================================== */
            /* PASSO 4: ÁREA "MEUS AGENDAMENTOS" DA CLIENTE + AVALIAÇÕES  */
            /* ========================================================== */
            <ClientBookingsView
              proAppointments={proAppointments}
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
          ) : !selectedPro ? (
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
                if (p.workingDays) setWorkingDays(p.workingDays);
                if (p.blockedPeriods) setBlockedPeriods(p.blockedPeriods);
                resetBooking();
              }}
            />
          ) : (
            /* ========================================================== */
            /* B. PERFIL INDIVIDUAL DA PROFISSIONAL ESCOLHIDA             */
            /* ========================================================== */
            <div className="space-y-3">
              {/* Botão de Voltar para a Busca */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPro(null);
                    resetBooking();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-white border border-stone-200 px-3.5 py-2 rounded-xl hover:bg-stone-50 transition shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-rose-600" />
                  Ver Todas as Profissionais
                </button>
                <span className="text-[11px] text-stone-400 font-medium">Perfil verificado BellaDoor</span>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
                {/* Foto de Capa */}
                <div className="relative h-36 bg-rose-900">
                  <img
                    src={pro.coverUrl}
                    alt="Capa"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

            {/* Cabeçalho do Perfil */}
            <div className="px-6 pt-0 pb-6 relative">
              <div className="flex justify-between items-end -mt-12 mb-4">
                <div className="relative">
                  <img
                    src={pro.avatarUrl}
                    alt={pro.name}
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md"
                  />
                  <span className="absolute bottom-1 right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white" title="Disponível para agendamento" />
                </div>
                <div className="flex gap-2">
                  <a
                    href={`https://instagram.com/${pro.instagram}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-xl text-xs flex items-center gap-1 font-medium transition"
                  >
                    <Instagram className="w-4 h-4 text-pink-600" />
                    @{pro.instagram}
                  </a>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-stone-900">{pro.name}</h1>
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3 text-rose-600" /> Verificada
                  </span>
                </div>
                <p className="text-xs text-rose-600 font-semibold mt-0.5">{pro.title}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-stone-600">
                  <span className="flex items-center gap-1 font-bold text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {pro.rating}
                  </span>
                  <span>•</span>
                  <span>{pro.reviewCount} atendimentos realizados</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-stone-500">
                    <MapPin className="w-3 h-3" /> Base: {pro.baseNeighborhood}, {pro.baseCity}
                  </span>
                </div>
                {pro.bio && (
                  <p className="text-xs text-stone-600 mt-3 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100 whitespace-pre-line">
                    {pro.bio}
                  </p>
                )}
              </div>

              {/* PORTFÓLIO DE TRABALHOS REALIZADOS (LOGO ABAIXO DA BIO) */}
              {pro.portfolio && pro.portfolio.length > 0 && (
                <div className="mt-5 pt-5 border-t border-stone-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-rose-600" />
                      Portfólio de Trabalhos Realizados
                    </h3>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                      {pro.portfolio.length} {pro.portfolio.length === 1 ? 'foto' : 'fotos'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
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
                </div>
              )}
            </div>

            {/* SEÇÃO DO AGENDAMENTO */}
            <div className="border-t border-stone-200 bg-stone-50/70 p-6">
              {!bookingConfirmed ? (
                <div>
                  {/* Cabeçalho dos Passos */}
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bold text-base text-stone-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-rose-600" />
                      Agende seu Atendimento
                    </h2>
                    <span className="text-xs text-stone-500 font-medium">Passo {step} de 3</span>
                  </div>

                  {/* PASSO 1: ESCOLHA DO SERVIÇO */}
                  {step === 1 && (
                    <div className="space-y-3">
                      <p className="text-xs text-stone-600 mb-2">Selecione o serviço que deseja receber em casa:</p>
                      {proServicesList.map((service) => {
                        const isSelected = selectedService?.id === service.id;
                        return (
                          <div
                            key={service.id}
                            onClick={() => setSelectedService(service)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-rose-50 border-rose-500 shadow-sm'
                                : 'bg-white border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-sm text-stone-900">{service.name}</h3>
                                  {service.popular && (
                                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                      Mais pedido
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                                  {service.description}
                                </p>
                                <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 mt-2 font-medium">
                                  <Clock className="w-3 h-3 text-stone-400" /> {service.durationMinutes} minutos
                                </span>
                              </div>
                              <div className="text-right pl-3">
                                <span className="text-base font-extrabold text-stone-900">
                                  R$ {service.price.toFixed(2).replace('.', ',')}
                                </span>
                                <div className={`w-5 h-5 mt-2 rounded-full border flex items-center justify-center ml-auto ${
                                  isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-stone-300'
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <button
                        disabled={!selectedService}
                        onClick={() => setStep(2)}
                        className={`w-full py-3.5 rounded-xl font-bold text-sm mt-4 flex items-center justify-center gap-2 transition ${
                          selectedService
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md'
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
                      <div className="bg-white p-3 rounded-xl border border-stone-200 flex justify-between items-center text-xs">
                        <div>
                          <span className="text-stone-500">Serviço:</span>{' '}
                          <span className="font-bold text-stone-900">{selectedService?.name}</span>
                        </div>
                        <button
                          onClick={() => setStep(1)}
                          className="text-rose-600 font-semibold hover:underline"
                        >
                          Alterar
                        </button>
                      </div>

                      {/* 1. BUSCA POR CEP (ViaCEP) */}
                      <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                        <label className="block text-xs font-bold text-stone-800">
                          1. Onde será o atendimento? (Digite seu CEP)
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

                      {/* 2. CALENDÁRIO VISUAL INTERATIVO MULTI-MÊS */}
                      <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-xs font-bold text-stone-900">
                              2. Escolha o dia do atendimento no calendário:
                            </label>
                            <p className="text-[11px] text-stone-500">Navegue pelos meses e clique na data desejada</p>
                          </div>

                          {/* Seletor e Navegação de Mês */}
                          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                            <button
                              type="button"
                              disabled={calendarYear === 2026 && calendarMonth === 9}
                              onClick={handlePrevMonth}
                              className={`p-1 rounded-lg transition ${
                                calendarYear === 2026 && calendarMonth === 9
                                  ? 'text-stone-300 cursor-not-allowed'
                                  : 'text-stone-700 hover:bg-white hover:shadow-xs'
                              }`}
                              title="Mês anterior"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-extrabold text-stone-900 px-2 min-w-[125px] text-center">
                              {monthNames[calendarMonth]} {calendarYear}
                            </span>
                            <button
                              type="button"
                              onClick={handleNextMonth}
                              className="p-1 rounded-lg text-stone-700 hover:bg-white hover:shadow-xs transition"
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
                                const isPast = dateStr < '2026-10-06'; // Hoje na simulação é 06/10/2026
                                const blockedPeriod = blockedPeriods.find((bp) => bp.dates.includes(dateStr));
                                const isBlocked = !!blockedPeriod;
                                const isWorkingDay = workingDays.includes(dayOfWeek);
                                const isAvailable = !isPast && !isBlocked && isWorkingDay;
                                const isSelected = selectedDate === dateStr;
                                const isToday = dateStr === '2026-10-06';

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
                                        ? 'bg-rose-600 text-white font-extrabold shadow-md scale-105'
                                        : isToday
                                        ? 'border-2 border-rose-400 text-rose-700 bg-rose-50/30 hover:bg-rose-100 cursor-pointer'
                                        : 'bg-white border border-stone-200 text-stone-800 hover:bg-rose-50 hover:border-rose-400 hover:text-rose-700 cursor-pointer shadow-xs'
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
                      ) : blockedPeriods.some((b) => b.dates.includes(selectedDate)) ? (
                        (() => {
                          const period = blockedPeriods.find((b) => b.dates.includes(selectedDate));
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
                        return !workingDays.includes(selDayOfWeek);
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
                            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-rose-600" />
                              3. Horários livres para {selectedDate.split('-').reverse().slice(0, 2).join('/')}:
                            </label>
                            <span className="text-[10px] text-stone-500 flex items-center gap-1">
                              <Info className="w-3 h-3 text-stone-400" /> +{proBufferTime}min trânsito
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {availableSlots.map((slot) => (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={!slot.available}
                                onClick={() => setSelectedTime(slot.time)}
                                className={`py-2 px-1 rounded-xl text-xs font-semibold border transition ${
                                  !slot.available
                                    ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed line-through'
                                    : selectedTime === slot.time
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                    : 'bg-white text-stone-800 border-stone-200 hover:border-rose-300'
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
                          className="px-4 py-3 bg-white border border-stone-300 text-stone-700 rounded-xl text-xs font-bold"
                        >
                          Voltar
                        </button>
                        <button
                          type="button"
                          disabled={
                            !neighborhood ||
                            !selectedTime ||
                            !selectedDate ||
                            blockedPeriods.some((b) => b.dates.includes(selectedDate)) ||
                            !workingDays.includes(
                              new Date(
                                Number(selectedDate.split('-')[0]),
                                Number(selectedDate.split('-')[1]) - 1,
                                Number(selectedDate.split('-')[2])
                              ).getDay()
                            )
                          }
                          onClick={() => setStep(3)}
                          className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
                            neighborhood &&
                            selectedTime &&
                            selectedDate &&
                            !blockedPeriods.some((b) => b.dates.includes(selectedDate)) &&
                            workingDays.includes(
                              new Date(
                                Number(selectedDate.split('-')[0]),
                                Number(selectedDate.split('-')[1]) - 1,
                                Number(selectedDate.split('-')[2])
                              ).getDay()
                            )
                              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md'
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
                      <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-100 space-y-1 text-xs">
                        <div className="flex justify-between text-stone-600">
                          <span>{selectedService?.name}</span>
                          <span className="font-semibold text-stone-900">R$ {selectedService?.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                          <span>Taxa de Deslocamento ({neighborhood})</span>
                          <span className="font-semibold text-stone-900">
                            {travelFee === 0 ? 'Grátis' : `R$ ${travelFee.toFixed(2).replace('.', ',')}`}
                          </span>
                        </div>
                        <div className="border-t border-rose-200 pt-1 mt-1 flex justify-between font-extrabold text-sm text-rose-950">
                          <span>Total do Atendimento:</span>
                          <span>R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="text-[11px] text-stone-500 pt-1">
                          📅 {selectedDate.split('-').reverse().join('/')} às {selectedTime}
                        </div>
                      </div>

                      {/* Campos Complementares do Endereço */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-stone-700 mb-1">Rua / Logradouro:</label>
                          <input
                            required
                            type="text"
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">Número:*</label>
                          <input
                            required
                            type="text"
                            placeholder="Ex: 450"
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">Complemento / Apto (Opcional):</label>
                        <input
                          type="text"
                          placeholder="Apto 42, Bloco B, Casa dos fundos..."
                          value={complement}
                          onChange={(e) => setComplement(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      {/* Dados da Cliente */}
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">Seu Nome Completo:*</label>
                        <input
                          required
                          type="text"
                          placeholder="Ex: Larissa Silva"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">Seu WhatsApp:*</label>
                        <input
                          required
                          type="tel"
                          placeholder="Ex: (11) 98765-4321"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <p className="text-[11px] text-stone-500 leading-tight">
                        * O pagamento é realizado diretamente com a profissional no dia do atendimento.
                      </p>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="px-4 py-3 bg-white border border-stone-300 text-stone-700 rounded-xl text-xs font-bold"
                        >
                          Voltar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirmar Agendamento
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* TELA DE SUCESSO COM BOTÃO DIRETO DO WHATSAPP */
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">Agendamento Realizado!</h3>
                  <p className="text-xs text-stone-600 mt-1 max-w-xs mx-auto">
                    O horário foi pré-reservado na agenda de <strong>{pro.name}</strong>.
                  </p>

                  <div className="bg-white p-4 rounded-2xl border border-stone-200 text-left mt-4 text-xs space-y-1.5">
                    <p><strong>Serviço:</strong> {lastBooking?.serviceName}</p>
                    <p><strong>Data & Hora:</strong> {lastBooking?.date.split('-').reverse().join('/')} às {lastBooking?.time}</p>
                    <p><strong>Local:</strong> {lastBooking?.address} - {lastBooking?.neighborhood}</p>
                    <p><strong>Valor Total:</strong> R$ {lastBooking?.totalPrice.toFixed(2).replace('.', ',')}</p>
                  </div>

                  {/* BOTÃO DO WHATSAPP COM MENSAGEM PRÉ-FORMATADA */}
                  <a
                    href={getWhatsAppBookingLink()}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Confirmar no WhatsApp de {pro.name}
                  </a>

                  <p className="text-[11px] text-stone-400 mt-2">
                    💡 Clique acima para enviar o comprovante diretamente para a profissional.
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
              )}
            </div>

            {/* SEÇÃO DE AVALIAÇÕES REAIS DAS CLIENTES (PASSO 4) */}
            <div className="border-t border-stone-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    Avaliações de Clientes ({proReviews.length})
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Nota média <strong className="text-amber-600">{pro.rating} ★</strong> de clientes atendidas em casa
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setReviewAppointmentId(null);
                    setReviewClientName(currentUser?.fullName || '');
                    setReviewServiceName(proServicesList[0]?.name || 'Atendimento a Domicílio');
                    setReviewRating(5);
                    setReviewComment('');
                    setShowReviewForm(!showReviewForm);
                  }}
                  className="text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5 text-amber-600" />
                  Avaliar Profissional
                </button>
              </div>

              {/* Formulário de Nova Avaliação Direto na Vitrine */}
              {showReviewForm && (
                <form
                  onSubmit={handleSubmitClientReview}
                  className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-stone-900">
                      Deixe sua avaliação para {pro.name}
                    </span>
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
                      placeholder="Seu Nome"
                      value={reviewClientName}
                      onChange={(e) => setReviewClientName(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <input
                      type="text"
                      placeholder="Serviço realizado"
                      value={reviewServiceName}
                      onChange={(e) => setReviewServiceName(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                {proReviews.map((rev) => (
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
          </div>
        </div>
      )
    ) : (
          /* ============================================================ */
          /* 2. VISÃO DA PROFISSIONAL: APP MOBILE COMPLETO (Android/iOS)  */
          /* ============================================================ */
          <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
            {/* Header Superior do App com Capa/Banner Personalizável */}
            <div className="relative bg-stone-900 text-white overflow-hidden">
              {/* Imagem de Fundo do Banner */}
              <div className="absolute inset-0 h-28 opacity-35">
                <img
                  src={pro.coverUrl}
                  alt="Banner da Vitrine"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-stone-900/70 to-stone-900" />
              </div>

              <div className="relative p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
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
                      <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white p-1 rounded-full border border-stone-900 shadow-xs">
                        <Camera className="w-2.5 h-2.5" />
                      </span>
                    </button>
                    <div>
                      <h2 className="text-base font-bold flex items-center gap-1.5">
                        {pro.name}
                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Online" />
                      </h2>
                      <p className="text-[11px] text-rose-300 font-medium">{pro.title}</p>
                      <p className="text-[10px] text-stone-400">?pro={pro.slug}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {subscriptionStatus === 'TRIAL' ? (
                      <>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-900/60 text-rose-300 border border-rose-700/50 px-2 py-0.5 rounded-full">
                          Plano Pro (Trial)
                        </span>
                        <p className="text-[10px] text-stone-400 mt-1">12 dias restantes</p>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-900/80 text-emerald-300 border border-emerald-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-400" /> Assinante Ativa
                        </span>
                        <p className="text-[10px] text-emerald-400 mt-1 font-semibold">
                          {planInterval === 'ANNUAL' ? 'Plano Anual (R$ 299/ano)' : 'Plano Mensal (R$ 39,90/mês)'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* PASSO 2: BARRA DE COMPARTILHAMENTO DO LINK EXCLUSIVO DA VITRINE */}
                <div className="mt-3.5 bg-stone-800/80 border border-stone-700/80 rounded-2xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-rose-600/20 text-rose-400 rounded-lg shrink-0">
                      <Share2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="text-[10px] font-bold text-stone-300 uppercase tracking-wider">
                        Link Exclusivo da sua Vitrine (Instagram / WhatsApp):
                      </p>
                      <p className="text-[11px] font-extrabold text-rose-300 truncate">
                        {getDirectVitrineUrl()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyVitrineLink}
                      className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-900 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                    >
                      <Copy className="w-3 h-3 text-rose-600" />
                      Copiar Link
                    </button>
                    <button
                      type="button"
                      onClick={handleShareVitrineWhatsApp}
                      className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                    >
                      <MessageCircle className="w-3 h-3" />
                      WhatsApp
                    </button>
                  </div>
                </div>

                {/* Métricas Rápidas no Topo */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-stone-800 text-center">
                  <div className="bg-stone-800/60 p-2 rounded-xl">
                    <p className="text-[10px] text-stone-400">Faturamento</p>
                    <p className="text-sm font-extrabold text-white">
                      R${' '}
                      {proAppointments
                        .filter((a) => a.status !== 'Cancelado')
                        .reduce((acc, a) => acc + a.totalPrice, 0)
                        .toFixed(0)}
                    </p>
                  </div>
                  <div className="bg-stone-800/60 p-2 rounded-xl">
                    <p className="text-[10px] text-stone-400">Atendimentos</p>
                    <p className="text-sm font-extrabold text-rose-400">
                      {proAppointments.filter((a) => a.status !== 'Cancelado').length}
                    </p>
                  </div>
                  <div className="bg-stone-800/60 p-2 rounded-xl">
                    <p className="text-[10px] text-stone-400">Nota Vitrine</p>
                    <p className="text-sm font-extrabold text-amber-400">⭐ {pro.rating}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* BARRA DE NAVEGAÇÃO DE ABAS DO APP */}
            <div className="flex border-b border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-600 overflow-x-auto">
              <button
                onClick={() => {
                  setProSubTab('portfolio');
                  setServiceFormMode('LIST');
                  setAreaFormMode('LIST');
                  setPortfolioFormMode('LIST');
                }}
                className={`flex-1 py-3 px-1.5 text-center border-b-2 transition cursor-pointer whitespace-nowrap ${
                  proSubTab === 'portfolio'
                    ? 'border-rose-600 text-rose-600 bg-white font-bold'
                    : 'border-transparent hover:text-stone-900'
                }`}
              >
                📸 Vitrine & Fotos
              </button>
              <button
                onClick={() => {
                  setProSubTab('agenda');
                  setServiceFormMode('LIST');
                  setAreaFormMode('LIST');
                  setPortfolioFormMode('LIST');
                }}
                className={`flex-1 py-3 px-1.5 text-center border-b-2 transition cursor-pointer whitespace-nowrap ${
                  proSubTab === 'agenda'
                    ? 'border-rose-600 text-rose-600 bg-white font-bold'
                    : 'border-transparent hover:text-stone-900'
                }`}
              >
                📅 Agenda
              </button>
              <button
                onClick={() => {
                  setProSubTab('services');
                  setServiceFormMode('LIST');
                  setAreaFormMode('LIST');
                  setPortfolioFormMode('LIST');
                }}
                className={`flex-1 py-3 px-1.5 text-center border-b-2 transition cursor-pointer whitespace-nowrap ${
                  proSubTab === 'services'
                    ? 'border-rose-600 text-rose-600 bg-white font-bold'
                    : 'border-transparent hover:text-stone-900'
                }`}
              >
                💅 Serviços
              </button>
              <button
                onClick={() => {
                  setProSubTab('areas');
                  setServiceFormMode('LIST');
                  setAreaFormMode('LIST');
                  setPortfolioFormMode('LIST');
                }}
                className={`flex-1 py-3 px-1.5 text-center border-b-2 transition cursor-pointer whitespace-nowrap ${
                  proSubTab === 'areas'
                    ? 'border-rose-600 text-rose-600 bg-white font-bold'
                    : 'border-transparent hover:text-stone-900'
                }`}
              >
                🚗 Regiões
              </button>
              <button
                onClick={() => {
                  setProSubTab('billing');
                  setServiceFormMode('LIST');
                  setAreaFormMode('LIST');
                  setPortfolioFormMode('LIST');
                }}
                className={`flex-1 py-3 px-1.5 text-center border-b-2 transition cursor-pointer whitespace-nowrap ${
                  proSubTab === 'billing'
                    ? 'border-rose-600 text-rose-600 bg-white font-bold'
                    : 'border-transparent hover:text-stone-900'
                }`}
              >
                💳 Plano
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
              {proSubTab === 'agenda' && (
                <div className="space-y-4">
                  {/* PASSO 3A: RESUMO FINANCEIRO DA PROFISSIONAL */}
                  {(() => {
                    const activeApps = proAppointments.filter((a) => a.status !== 'Cancelado');
                    const totalRevenue = activeApps.reduce((acc, a) => acc + a.totalPrice, 0);
                    const totalTravelRevenue = activeApps.reduce((acc, a) => acc + a.travelFee, 0);
                    const totalServicesRevenue = totalRevenue - totalTravelRevenue;
                    const avgTicket = activeApps.length > 0 ? totalRevenue / activeApps.length : 0;

                    return (
                      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-rose-950 text-white p-4 rounded-2xl shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-200">
                                Resumo Financeiro da Agenda
                              </h3>
                              <p className="text-[10px] text-stone-400">
                                Cálculo automático de serviços + taxas de deslocamento
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                            100% Seu (0% Comissão)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                            <p className="text-[10px] text-stone-300">Receita Total</p>
                            <p className="text-sm font-extrabold text-emerald-400 mt-0.5">
                              R$ {totalRevenue.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                          <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                            <p className="text-[10px] text-stone-300">Em Serviços</p>
                            <p className="text-sm font-extrabold text-white mt-0.5">
                              R$ {totalServicesRevenue.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                          <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                            <p className="text-[10px] text-stone-300">Deslocamento</p>
                            <p className="text-sm font-extrabold text-amber-300 mt-0.5">
                              R$ {totalTravelRevenue.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                          <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
                            <p className="text-[10px] text-stone-300">Ticket Médio</p>
                            <p className="text-sm font-extrabold text-rose-300 mt-0.5">
                              R$ {avgTicket.toFixed(0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h3 className="font-bold text-sm text-stone-900">Rota de Atendimentos</h3>
                      <p className="text-xs text-stone-500">Ordem cronológica calculada com tempo de trânsito</p>
                    </div>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                      {proBufferTime} min de margem
                    </span>
                  </div>

                  {proAppointments.length === 0 ? (
                    <div className="text-center py-8 text-stone-400">
                      <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Nenhum atendimento agendado para hoje.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {proAppointments.map((item, index) => (
                        <div
                          key={item.id}
                          className={`p-4 rounded-2xl border space-y-2 relative overflow-hidden transition ${
                            item.status === 'Cancelado'
                              ? 'border-stone-200 bg-stone-100/60 opacity-60'
                              : 'border-stone-200 bg-stone-50/70'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-stone-900 bg-white px-2.5 py-1 rounded-xl border border-stone-200 shadow-sm">
                                {item.time}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-xs text-stone-900">{item.clientName}</p>
                                  <span
                                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                                      item.status === 'Cancelado'
                                        ? 'bg-red-100 text-red-700'
                                        : item.status === 'Concluído'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </div>
                                <p className="text-[11px] text-rose-600 font-semibold">
                                  {item.serviceName} • {item.date.split('-').reverse().join('/')}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                              R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                            </span>
                          </div>

                          <p className="text-xs text-stone-600 flex items-center gap-1.5 pt-1">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="truncate">{item.address} ({item.neighborhood})</span>
                          </p>

                          <div className="pt-2 flex flex-wrap gap-2">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.address}, ${item.neighborhood}, São Paulo`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              Navegar GPS (Waze/Maps)
                            </a>
                            <a
                              href={`https://wa.me/55${item.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, ${item.clientName}! Aqui é ${proDisplayName} do BellaDoor. Estou a caminho do seu endereço para o atendimento!`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center transition shadow-sm"
                              title="Chamar no WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                            {item.status === 'Confirmado' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setProAppointments((prev) =>
                                    prev.map((a) =>
                                      a.id === item.id ? { ...a, status: 'Concluído' } : a
                                    )
                                  );
                                  showProSuccess(`✅ Atendimento de ${item.clientName} marcado como Concluído!`);
                                }}
                                className="px-2.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold transition cursor-pointer"
                                title="Marcar como concluído"
                              >
                                ✓ Concluir
                              </button>
                            )}
                          </div>

                          {/* Indicador de tempo de deslocamento entre atendimentos */}
                          {index < proAppointments.length - 1 && (
                            <div className="text-[10px] text-stone-400 pt-1 flex items-center gap-1 justify-center border-t border-dashed border-stone-200 mt-2">
                              <Car className="w-3 h-3 text-stone-400" />
                              <span>+ {proBufferTime} min de deslocamento até o próximo cliente</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 1. CONFIGURAÇÃO DE EXPEDIENTE PADRÃO (DIAS DA SEMANA + HORÁRIOS + ALMOÇO) */}
                  <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-stone-900">
                            Expediente Padrão (Dias & Horários)
                          </h4>
                          <p className="text-[11px] text-stone-500">
                            Defina seus dias fixos e horário de início/fim. Reflete na hora na vitrine!
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                        {workingDays.length} dias • {String(workStartHour).padStart(2, '0')}h às{' '}
                        {String(workEndHour).padStart(2, '0')}h
                      </span>
                    </div>

                    {/* Botões dos Dias da Semana */}
                    <div className="grid grid-cols-7 gap-1.5 pt-1">
                      {WEEKDAYS.map((wd) => {
                        const isActive = workingDays.includes(wd.index);
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
                        onClick={() => setWorkingDays([1, 2, 3, 4, 5, 6])}
                        className="bg-white border border-stone-200 px-2 py-0.5 rounded-md hover:border-emerald-500 transition text-stone-700 cursor-pointer"
                      >
                        Seg a Sáb (Mais comum)
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkingDays([2, 3, 4, 5, 6])}
                        className="bg-white border border-stone-200 px-2 py-0.5 rounded-md hover:border-emerald-500 transition text-stone-700 cursor-pointer"
                      >
                        Ter a Sáb (Salão)
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkingDays([1, 2, 3, 4, 5])}
                        className="bg-white border border-stone-200 px-2 py-0.5 rounded-md hover:border-emerald-500 transition text-stone-700 cursor-pointer"
                      >
                        Seg a Sex
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkingDays([0, 1, 2, 3, 4, 5, 6])}
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
                            value={workStartHour}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setWorkStartHour(val);
                              if (workEndHour <= val) setWorkEndHour(val + 1);
                              showProSuccess(`⏰ Início do expediente atualizado para ${String(val).padStart(2, '0')}:00!`);
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
                            value={workEndHour}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setWorkEndHour(val);
                              showProSuccess(`⏰ Término do expediente atualizado para ${String(val).padStart(2, '0')}:00!`);
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
                            value={proBufferTime}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setProBufferTime(val);
                              showProSuccess(`🚗 Margem de trânsito ajustada para ${val} minutos!`);
                            }}
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          >
                            {[15, 30, 45, 60].map((m) => (
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
                          onClick={() => {
                            setLunchBreakEnabled(!lunchBreakEnabled);
                            showProSuccess(
                              !lunchBreakEnabled
                                ? '☕ Pausa de almoço (12h às 13h) ativada!'
                                : '⏰ Horário das 12h liberado para agendamentos!'
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition cursor-pointer ${
                            lunchBreakEnabled
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-stone-100 text-stone-500 border border-stone-200'
                          }`}
                        >
                          {lunchBreakEnabled ? '✓ Almoço Bloqueado' : 'Liberado'}
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-500 bg-white p-2.5 rounded-xl border border-stone-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Sua agenda está aberta para <strong>{workingDays.length} dias por semana</strong>, das{' '}
                        <strong>{String(workStartHour).padStart(2, '0')}:00</strong> às{' '}
                        <strong>{String(workEndHour).padStart(2, '0')}:00</strong> (
                        {availableSlots.length} horários diários disponíveis).
                      </span>
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
                            disabled={proCalendarYear === 2026 && proCalendarMonth === 9}
                            onClick={handleProPrevMonth}
                            className={`p-1 rounded transition ${
                              proCalendarYear === 2026 && proCalendarMonth === 9
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
                              const isPast = dateStr < '2026-10-06';
                              const isAlreadyBlocked = blockedPeriods.some((bp) => bp.dates.includes(dateStr));
                              const isWorkingDay = workingDays.includes(dayOfWeek);
                              const hasAppointment = proAppointments.some((a) => a.date === dateStr);

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
                            min="2026-10-06"
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
                            min={newBlockStartDate || '2026-10-06'}
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

              {/* ABA 2: GESTÃO DE SERVIÇOS, PREÇOS E SIMULAÇÃO DE DESLOCAMENTO */}
              {proSubTab === 'services' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {serviceFormMode === 'LIST' ? (
                    /* ======================================================== */
                    /* VISÃO 1: CATÁLOGO DE SERVIÇOS DA PROFISSIONAL            */
                    /* ======================================================== */
                    <>
                      {/* Banner Superior de Catálogo */}
                      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-stone-900 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded-full border border-rose-700/50">
                            <Sparkles className="w-3 h-3 text-rose-300" /> Catálogo Oficial
                          </span>
                          <h3 className="font-extrabold text-sm sm:text-base text-white">
                            Meus Serviços & Preços
                          </h3>
                          <p className="text-[11px] text-rose-100/80">
                            Gerencie valores, tempo de duração e destaque seus serviços mais pedidos.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={openCreateServicePage}
                          className="shrink-0 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold transition shadow-md flex items-center gap-1.5 cursor-pointer"
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
                          <p className="text-sm font-extrabold text-rose-600 mt-0.5">
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
                          className="bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 p-2.5 rounded-2xl cursor-pointer transition"
                          title="Ir para taxas de deslocamento"
                        >
                          <p className="text-[10px] text-rose-700 font-bold flex items-center justify-center gap-1">
                            <Car className="w-3 h-3" /> Deslocamento
                          </p>
                          <p className="text-[11px] font-extrabold text-rose-900 mt-0.5 underline">
                            {proNeighborhoodsList.length} bairros ➔
                          </p>
                        </div>
                      </div>

                      {/* Lista de Cards de Serviços */}
                      <div className="space-y-3">
                        {proServicesList.length === 0 ? (
                          <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-2">
                            <Sparkles className="w-7 h-7 text-rose-400 mx-auto" />
                            <p className="text-xs font-bold text-stone-800">Nenhum serviço cadastrado ainda</p>
                            <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                              Adicione seus serviços para que suas clientes possam agendar pelo seu link exclusivo.
                            </p>
                            <button
                              type="button"
                              onClick={openCreateServicePage}
                              className="mt-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                            >
                              + Cadastrar Primeiro Serviço
                            </button>
                          </div>
                        ) : (
                          proServicesList.map((service) => (
                            <div
                              key={service.id}
                              className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-rose-300 transition shadow-xs space-y-2.5"
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
                                  <span className="font-extrabold text-sm sm:text-base text-rose-600">
                                    R$ {service.price.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                              </div>

                              <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3 text-[11px] text-stone-500 font-medium">
                                  <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 px-2 py-0.5 rounded-lg">
                                    <Clock className="w-3 h-3 text-rose-600" /> {service.durationMinutes} min
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-stone-400">
                                    <Car className="w-3 h-3" /> +{proBufferTime}m trânsito
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditServicePage(service)}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
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
                          <ArrowLeft className="w-3.5 h-3.5 text-rose-600" />
                          Voltar ao Catálogo
                        </button>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          {serviceFormMode === 'CREATE' ? '✨ Novo Serviço' : '✏️ Editando Serviço'}
                        </span>
                      </div>

                      {/* Cabeçalho da Página */}
                      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-stone-900 text-white p-4 rounded-2xl shadow-sm space-y-1">
                        <h3 className="font-extrabold text-base flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-rose-300" />
                          {serviceFormMode === 'CREATE'
                            ? 'Cadastrar Novo Serviço a Domicílio'
                            : `Editar: ${srvName || 'Serviço'}`}
                        </h3>
                        <p className="text-xs text-rose-100/80">
                          Configure nome, descrição, valor e duração média do seu atendimento.
                        </p>
                      </div>

                      {/* Atalhos Rápidos de Modelos (Apenas ao criar novo serviço) */}
                      {serviceFormMode === 'CREATE' && (
                        <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl space-y-2">
                          <p className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            Modelos rápidos para preencher em 1 clique:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {[
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
                            ].map((tpl) => (
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
                                className="text-[11px] bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200 hover:border-rose-300 px-2.5 py-1.5 rounded-xl font-semibold transition cursor-pointer shadow-2xs"
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
                              placeholder="Ex: Maquiagem Social Glam, Alongamento em Gel..."
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
                              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-rose-600" />
                                Duração Média do Atendimento:
                              </label>
                              <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
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
                            className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
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
              {proSubTab === 'areas' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {areaFormMode === 'LIST' ? (
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

                      {/* Configuração do Buffer Time */}
                      <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                            <Car className="w-4 h-4 text-rose-600" />
                            Tempo de Trânsito entre Clientes (Buffer Time):
                          </label>
                          <span className="text-xs font-extrabold bg-rose-600 text-white px-2.5 py-0.5 rounded-full">
                            {proBufferTime} min
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
                              onClick={() => {
                                setProBufferTime(mins);
                                showProSuccess(`⏱️ Margem de deslocamento ajustada para ${mins} minutos!`);
                              }}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                proBufferTime === mins
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                  : 'bg-white text-stone-700 border-stone-200 hover:border-rose-300'
                              }`}
                            >
                              {mins}m
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Lista de Bairros e Taxas */}
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-xs font-extrabold text-stone-800 uppercase tracking-wider">
                            Bairros Cadastrados ({proNeighborhoodsList.length})
                          </span>
                          <button
                            type="button"
                            onClick={openCreateAreaPage}
                            className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar Bairro
                          </button>
                        </div>

                        {proNeighborhoodsList.map((n) => (
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
                                <p className="font-extrabold text-stone-900 text-xs">{n.name}</p>
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
                        ))}
                      </div>
                    </>
                  ) : (
                    /* ======================================================== */
                    /* VISÃO 2: PÁGINA DEDICADA DE REGIÃO & CUSTO DESLOCAMENTO  */
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
                            ? 'Configurar Bairro & Custo de Deslocamento'
                            : `Editar Região: ${areaName || 'Bairro'}`}
                        </h3>
                        <p className="text-xs text-rose-100/80">
                          Quando a cliente digitar um CEP deste bairro, o BellaDoor somará automaticamente esta taxa ao valor do serviço.
                        </p>
                      </div>

                      <form onSubmit={handleSaveAreaForm} className="space-y-4">
                        {areaFormError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{areaFormError}</span>
                          </div>
                        )}

                        {/* 1. Escolha do Bairro / Busca opcional por CEP */}
                        <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-3 shadow-xs">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> 1. Identificação do Bairro ou Região
                          </h4>

                          <div>
                            <label className="block text-xs font-bold text-stone-800 mb-1">
                              Nome do Bairro / Região:*
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: Moema, Pinheiros, Jardins, Vila Mariana..."
                              value={areaName}
                              onChange={(e) => {
                                setAreaName(e.target.value);
                                setAreaFormError(null);
                              }}
                              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                          </div>

                          {/* Sugestões Rápidas de Bairros */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-stone-400 uppercase">
                              Sugestões rápidas (1 clique):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                'Moema',
                                'Itaim Bibi',
                                'Jardins',
                                'Pinheiros',
                                'Vila Madalena',
                                'Vila Olímpia',
                                'Vila Mariana',
                                'Perdizes',
                                'Tatuapé',
                                'Santana',
                              ].map((bName) => (
                                <button
                                  key={bName}
                                  type="button"
                                  onClick={() => {
                                    setAreaName(bName);
                                    setAreaFormError(null);
                                  }}
                                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                                    areaName === bName
                                      ? 'bg-rose-600 text-white border-rose-600'
                                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-rose-300'
                                  }`}
                                >
                                  {bName}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Busca automática por CEP (Opcional) */}
                          <div className="pt-2 border-t border-stone-100">
                            <label className="block text-[11px] font-medium text-stone-500 mb-1">
                              💡 Não sabe o nome exato do bairro? Digite um CEP da região para preencher sozinho:
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                maxLength={9}
                                placeholder="Ex: 04538-133"
                                value={areaCepInput}
                                onChange={(e) => handleAreaCepLookup(e.target.value)}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                              />
                              {areaCepLoading && (
                                <Loader2 className="w-4 h-4 text-rose-600 animate-spin absolute right-3 top-2.5" />
                              )}
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
                          <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                            <span className="font-bold text-stone-800">
                              📍 {areaName.trim() || 'Nome do Bairro'} - {pro.baseCity}
                            </span>
                            <span className="font-extrabold text-emerald-600">
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
              {proSubTab === 'portfolio' && (
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
                          onClick={() => {
                            setSelectedPro(myCustomProProfile);
                            setActiveTab('client');
                          }}
                          className="text-[11px] bg-stone-900 hover:bg-stone-800 text-white font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5 text-rose-400" />
                          Ver Vitrine ao Vivo
                        </button>
                      </div>

                      {/* ============================================================ */}
                      {/* BLOCO 1: APRESENTAÇÃO DA VITRINE (BIO, NOME, INSTA E WHATS)  */}
                      {/* ============================================================ */}
                      <div className="bg-white rounded-3xl border border-stone-200 p-4 space-y-3.5 shadow-xs">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                          <h4 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                            <Pencil className="w-3.5 h-3.5 text-rose-600" />
                            1. Informações de Apresentação na Vitrine
                          </h4>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Salvo em tempo real
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 mb-1">
                              Seu Nome Profissional
                            </label>
                            <input
                              type="text"
                              value={proDisplayName}
                              onChange={(e) => setProDisplayName(e.target.value)}
                              placeholder="Ex: Camila Martins"
                              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 mb-1">
                              Especialidade em Destaque
                            </label>
                            <input
                              type="text"
                              value={proDisplayTitle}
                              onChange={(e) => setProDisplayTitle(e.target.value)}
                              placeholder="Ex: Nail Designer & Spa dos Pés"
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
                                value={proInstagram.replace(/^@+/, '')}
                                onChange={(e) => setProInstagram(e.target.value.replace(/^@+/, ''))}
                                placeholder="seu.instagram"
                                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-7 pr-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
                              />
                            </div>
                            <p className="text-[10px] text-stone-400 mt-1">
                              Aparece como botão <strong>@{proInstagram.replace(/^@+/, '') || 'seu.instagram'}</strong> na sua vitrine
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
                                value={proWhatsapp}
                                onChange={(e) => setProWhatsapp(e.target.value)}
                                placeholder="(11) 99999-8888"
                                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
                              />
                            </div>
                            <p className="text-[10px] text-stone-400 mt-1">
                              Número que receberá os comprovantes de agendamento das clientes
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 mb-1">
                            Bio / Descrição do seu Atendimento
                          </label>
                          <textarea
                            rows={3}
                            value={proDisplayBio}
                            onChange={(e) => setProDisplayBio(e.target.value)}
                            placeholder="Apresente seu trabalho, anos de experiência, cuidados de biossegurança e marcas que utiliza..."
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
                          />
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              showProSuccess(
                                '✨ Informações de apresentação, @Instagram e WhatsApp atualizados na sua Vitrine!'
                              )
                            }
                            className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            Confirmar Dados de Apresentação
                          </button>
                        </div>
                      </div>

                      {/* ============================================================ */}
                      {/* BLOCO 2: UPLOAD DE FOTO DO PERFIL E IMAGEM DO BANNER / CAPA  */}
                      {/* ============================================================ */}
                      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
                        <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                          <span className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                            <Image className="w-4 h-4 text-rose-600" />
                            2. Foto de Perfil & Imagem do Banner (Capa)
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Sincronizado com a Vitrine
                          </span>
                        </div>

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
                        <div className="px-4 pb-4 pt-0 relative">
                          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-10 gap-3 mb-3">
                            <div className="flex items-end gap-3">
                              {/* Avatar com botão de câmera */}
                              <div className="relative group shrink-0">
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

                              <div className="pb-1">
                                <h4 className="font-extrabold text-sm text-stone-900 leading-tight">
                                  {proDisplayName}
                                </h4>
                                <p className="text-[11px] text-rose-600 font-semibold">
                                  {proDisplayTitle}
                                </p>
                              </div>
                            </div>

                            {/* Botão explícito para Upload da Foto de Perfil */}
                            <label className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-[11px] px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition shrink-0">
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
                      </div>

                      {/* ============================================================ */}
                      {/* BLOCO 3: GERENCIAR FOTOS DOS TRABALHOS REALIZADOS (PORTFÓLIO)*/}
                      {/* ============================================================ */}
                      <div className="bg-white rounded-3xl border border-stone-200 p-4 space-y-4 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-rose-600" />
                              3. Fotos dos Trabalhos Realizados ({proPortfolioList.length})
                            </h4>
                            <p className="text-[11px] text-stone-500">
                              Adicione fotos reais dos seus atendimentos para encantar novas clientes
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={openCreatePortfolioPage}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                            Adicionar Foto
                          </button>
                        </div>

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
                      </div>
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

              {/* ABA 5: ASSINATURA SAAS & MONETIZAÇÃO (COMPONENTE MODULAR) */}
              {proSubTab === 'billing' && (
                <ProBillingTab
                  subscriptionStatus={subscriptionStatus}
                  planInterval={planInterval}
                  showCheckoutModal={showCheckoutModal}
                  checkoutMethod={checkoutMethod}
                  isPaymentProcessing={isPaymentProcessing}
                  onSelectPlanInterval={setPlanInterval}
                  onOpenCheckoutModal={() => setShowCheckoutModal(true)}
                  onCloseCheckoutModal={() => setShowCheckoutModal(false)}
                  onSelectCheckoutMethod={setCheckoutMethod}
                  onToggleSimulationStatus={() =>
                    setSubscriptionStatus(subscriptionStatus === 'ACTIVE' ? 'TRIAL' : 'ACTIVE')
                  }
                  onConfirmPaymentSimulation={() => {
                    setIsPaymentProcessing(true);
                    setTimeout(() => {
                      setIsPaymentProcessing(false);
                      setSubscriptionStatus('ACTIVE');
                      setShowCheckoutModal(false);
                      setUiDialog({
                        emoji: '🎉',
                        badge: 'Pagamento Confirmado',
                        title: 'Assinatura BellaDoor Pro Ativa!',
                        message:
                          'Seu pagamento foi aprovado com sucesso! Todos os recursos VIP, agendamentos ilimitados e seu link exclusivo na bio estão 100% liberados.',
                        highlight:
                          planInterval === 'ANNUAL'
                            ? 'Plano Pro Anual • R$ 299,00/ano (Selo VIP Ouro)'
                            : 'Plano Pro Mensal • R$ 39,90/mês',
                        buttonText: 'Continuar no Painel Pro ✨',
                        variant: 'success',
                      });
                    }, 1200);
                  }}
                  onShowUiDialog={setUiDialog}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAIS GLOBAIS: ONBOARDING 7 DIAS GRÁTIS & JANELINHA PADRÃO BELLADOOR */}
      <GlobalModals
        showTrialModal={showTrialModal}
        userFullName={currentUser?.fullName}
        selectedTrialPlan={selectedTrialPlan}
        uiDialog={uiDialog}
        onCloseTrialModal={() => setShowTrialModal(false)}
        onSelectTrialPlan={setSelectedTrialPlan}
        onActivateFreeTrial={() => {
          setPlanInterval(selectedTrialPlan);
          setShowTrialModal(false);
          setUiDialog({
            emoji: '🎉',
            badge: '7 Dias Grátis Liberados',
            title: `Bem-vinda, ${currentUser?.fullName || 'Profissional'}!`,
            message:
              'Seu Teste Grátis de 7 Dias foi ativado com sucesso! Seu painel profissional já está liberado para configurar serviços, regiões e receber agendamentos.',
            highlight:
              selectedTrialPlan === 'ANNUAL'
                ? 'Plano escolhido pós-teste: Anual (R$ 299,00/ano • Sem cobrança hoje)'
                : 'Plano escolhido pós-teste: Mensal (R$ 39,90/mês • Sem cobrança hoje)',
            buttonText: 'Começar a Usar Meu Painel 🚀',
            variant: 'rose',
          });
        }}
        onCloseUiDialog={() => setUiDialog(null)}
      />

      {/* RODAPÉ */}
      <footer className="w-full text-center py-6 text-xs text-stone-500 border-t border-stone-200 bg-white">
        <p>BellaDoor © 2026 — Plataforma de Gestão e Agendamento para Profissionais da Beleza a Domicílio</p>
      </footer>
    </div>
  );
}
