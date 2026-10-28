export interface MockService {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  popular?: boolean;
}

export interface MockNeighborhood {
  id: string;
  name: string;
  travelFee: number;
  city?: string;
  cep?: string;
  address?: string;
}

export interface DaySchedule {
  startHour: number; // 7..22
  endHour: number;   // 8..23
  lunchBreakEnabled?: boolean;
}

export type DaySchedulesMap = Record<number, DaySchedule>;

export interface MockProfessional {
  id: string;
  name: string;
  email?: string;
  slug: string;
  category: 'Maquiagem' | 'Cabelo' | 'Unhas' | 'Sobrancelha' | 'Estética' | 'Barbearia';
  specialties: string[];
  title: string;
  bio: string;
  rating: number;
  reviewCount: number;
  startingPrice: number;
  avatarUrl: string;
  coverUrl: string;
  instagram: string;
  whatsapp: string;
  baseCity: string;
  baseNeighborhood: string;
  baseCep?: string;
  baseAddress?: string;
  maxTravelKm: number;
  bufferTimeMinutes: number;
  serviceMode?: 'DOMICILIO' | 'STUDIO' | 'HIBRIDO';
  studioName?: string;
  businessNiche?: 'BEAUTY' | 'BARBERSHOP' | 'NEUTRAL';
  visualTheme?: 'ROSE' | 'DARK_BARBER' | 'EMERALD' | 'MINIMAL';
  workingDays?: number[]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  workStartHour?: number;
  workEndHour?: number;
  lunchBreakEnabled?: boolean;
  daySchedules?: Record<number, DaySchedule>;
  useCustomDaySchedules?: boolean;
  blockedPeriods?: { id: string; startDate: string; endDate: string; reason: string; dates: string[] }[];
  bookingRules?: import('../types/belladoor').BookingConfirmationSettings;
  services: MockService[];
  neighborhoods: MockNeighborhood[];
  portfolio: { url: string; title: string }[];
  isVerified?: boolean;
  verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  verificationDocUrl?: string;
  verificationDocType?: 'RG' | 'CNH' | 'OUTRO';
  verifiedAt?: string;
  verificationNotes?: string;
}

// Template inicial limpo para a conta da profissional (sem dados de demonstração)
export const mockProfessional: MockProfessional = {
  id: 'pro-main',
  name: '',
  slug: 'vitrine',
  category: 'Maquiagem',
  businessNiche: 'BEAUTY',
  visualTheme: 'ROSE',
  specialties: [],
  title: '',
  bio: '',
  rating: 5.0,
  reviewCount: 0,
  startingPrice: 0,
  isVerified: false,
  verificationStatus: 'UNVERIFIED',
  avatarUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
  coverUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
  instagram: '',
  whatsapp: '',
  baseCity: '',
  baseNeighborhood: 'Atendimento a Domicílio',
  baseCep: '',
  baseAddress: '',
  maxTravelKm: 25,
  bufferTimeMinutes: 30,
  serviceMode: 'HIBRIDO',
  studioName: '',
  workingDays: [1, 2, 3, 4, 5, 6],
  workStartHour: 9,
  workEndHour: 19,
  lunchBreakEnabled: true,
  daySchedules: {},
  useCustomDaySchedules: false,
  blockedPeriods: [],
  services: [],
  neighborhoods: [],
  portfolio: [],
};

// Sem perfis de exemplo pré-cadastrados (apenas perfis reais criados na plataforma)
export const mockProfessionalsList: MockProfessional[] = [];
