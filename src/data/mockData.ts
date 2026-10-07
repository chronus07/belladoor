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
}

export interface MockProfessional {
  id: string;
  name: string;
  slug: string;
  category: 'Maquiagem' | 'Cabelo' | 'Unhas' | 'Sobrancelha' | 'Estética';
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
  maxTravelKm: number;
  bufferTimeMinutes: number;
  workingDays?: number[]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  blockedPeriods?: { id: string; startDate: string; endDate: string; reason: string; dates: string[] }[];
  services: MockService[];
  neighborhoods: MockNeighborhood[];
  portfolio: { url: string; title: string }[];
}

// Template inicial limpo para a conta da profissional (sem dados de demonstração)
export const mockProfessional: MockProfessional = {
  id: 'pro-main',
  name: '',
  slug: 'vitrine',
  category: 'Maquiagem',
  specialties: [],
  title: '',
  bio: '',
  rating: 5.0,
  reviewCount: 0,
  startingPrice: 0,
  avatarUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
  coverUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
  instagram: '',
  whatsapp: '',
  baseCity: 'São Paulo',
  baseNeighborhood: 'Atendimento a Domicílio',
  maxTravelKm: 25,
  bufferTimeMinutes: 30,
  workingDays: [1, 2, 3, 4, 5, 6],
  blockedPeriods: [],
  services: [],
  neighborhoods: [],
  portfolio: [],
};

// Sem perfis de exemplo pré-cadastrados (apenas perfis reais criados na plataforma)
export const mockProfessionalsList: MockProfessional[] = [];
