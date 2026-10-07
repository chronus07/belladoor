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

export const mockProfessionalsList: MockProfessional[] = [
  {
    id: 'pro-1',
    name: 'Camila Martins',
    slug: 'camila-makeup',
    category: 'Maquiagem',
    specialties: ['Pele Blindada', 'Noivas & Madrinhas', 'Penteados'],
    title: 'Maquiagem Social & Penteados a Domicílio',
    bio: 'Especialista em peles blindadas de alta durabilidade e penteados modernos. Levo todo o camarim completo com iluminação profissional de estúdio até a sua casa!',
    rating: 4.9,
    reviewCount: 128,
    startingPrice: 70,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
    instagram: 'camilamartins.beauty',
    whatsapp: '11999887766',
    baseCity: 'São Paulo',
    baseNeighborhood: 'Moema',
    maxTravelKm: 25,
    bufferTimeMinutes: 35,
    workingDays: [1, 2, 3, 4, 5, 6], // Segunda a Sábado
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
    services: [
      {
        id: 'srv-1',
        name: 'Maquiagem Social Glam',
        description: 'Pele blindada resistente a lágrimas e suor, cílios postiços premium inclusos e contorno iluminado.',
        durationMinutes: 60,
        price: 180,
        popular: true,
      },
      {
        id: 'srv-2',
        name: 'Penteado & Ondas Glam',
        description: 'Ondas no babyliss com fixação profissional, coque despojado ou meio-preso para eventos.',
        durationMinutes: 50,
        price: 140,
      },
      {
        id: 'srv-3',
        name: 'Combo Beleza Total (Make + Cabelo)',
        description: 'Produção completa no conforto do seu quarto. Ideal para madrinhas, formandas e convidadas VIP.',
        durationMinutes: 110,
        price: 290,
        popular: true,
      },
      {
        id: 'srv-4',
        name: 'Design de Sobrancelha Visagista',
        description: 'Mapeamento facial e alinhamento com aplicação de henna para um olhar marcante.',
        durationMinutes: 30,
        price: 70,
      },
    ],
    neighborhoods: [
      { id: 'b-1', name: 'Moema (Região Base)', travelFee: 0 },
      { id: 'b-2', name: 'Itaim Bibi', travelFee: 15 },
      { id: 'b-3', name: 'Jardins / Cerqueira César', travelFee: 15 },
      { id: 'b-4', name: 'Pinheiros / Vila Madalena', travelFee: 20 },
      { id: 'b-5', name: 'Vila Mariana', travelFee: 20 },
      { id: 'b-6', name: 'Brooklin / Campo Belo', travelFee: 10 },
    ],
    portfolio: [
      {
        url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80',
        title: 'Make Noiva Clássica',
      },
      {
        url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
        title: 'Produção Formanda Glam',
      },
      {
        url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
        title: 'Penteado Ondas Hollywood',
      },
      {
        url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=600&q=80',
        title: 'Pele Glow Natural',
      },
    ],
  },
  {
    id: 'pro-2',
    name: 'Juliana Becker',
    slug: 'juliana-hair',
    category: 'Cabelo',
    specialties: ['Corte Visagista', 'Tratamentos VIP', 'Escova Modelada'],
    title: 'Hairstylist & Especialista em Saúde Capilar',
    bio: 'Mais de 8 anos transformando cabelos com cosméticos importados. Levo lavatório portátil higienizado e produtos de salão para o seu banheiro.',
    rating: 5.0,
    reviewCount: 94,
    startingPrice: 120,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80',
    instagram: 'julianabecker.hair',
    whatsapp: '11988884433',
    baseCity: 'São Paulo',
    baseNeighborhood: 'Pinheiros',
    maxTravelKm: 20,
    bufferTimeMinutes: 40,
    workingDays: [2, 3, 4, 5, 6], // Terça a Sábado (Dom e Seg folga)
    blockedPeriods: [
      {
        id: 'blk-jb-1',
        startDate: '2026-10-25',
        endDate: '2026-10-26',
        reason: 'Workshop LOréal Hair SP',
        dates: ['2026-10-25', '2026-10-26'],
      },
    ],
    services: [
      {
        id: 'srv-jb-1',
        name: 'Corte Visagista + Escova Modelada',
        description: 'Análise do formato do rosto, corte personalizado e finalização com ondas ou liso impecável.',
        durationMinutes: 75,
        price: 160,
        popular: true,
      },
      {
        id: 'srv-jb-2',
        name: 'Cronograma Capilar de Luxo',
        description: 'Nutrição profunda, reconstrução de fios danificados e selagem térmica com produtos LOréal / Wella.',
        durationMinutes: 60,
        price: 190,
      },
      {
        id: 'srv-jb-3',
        name: 'Escova Modelada Rápida',
        description: 'Lavagem suave e escovação com brilho espelhado para o seu dia a dia ou reuniões.',
        durationMinutes: 45,
        price: 120,
      },
    ],
    neighborhoods: [
      { id: 'bj-1', name: 'Pinheiros (Região Base)', travelFee: 0 },
      { id: 'bj-2', name: 'Vila Madalena', travelFee: 10 },
      { id: 'bj-3', name: 'Perdizes / Pompeia', travelFee: 15 },
      { id: 'bj-4', name: 'Jardins', travelFee: 15 },
    ],
    portfolio: [
      {
        url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80',
        title: 'Corte em Camadas',
      },
      {
        url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80',
        title: 'Escova Glamour',
      },
    ],
  },
  {
    id: 'pro-3',
    name: 'Amanda Souza',
    slug: 'amanda-nails',
    category: 'Unhas',
    specialties: ['Alongamento em Gel', 'Esmaltação em Gel', 'Spa dos Pés'],
    title: 'Nail Designer & Manicure em Gel a Domicílio',
    bio: 'Materiais 100% esterilizados em autoclave e descartáveis. Cuido das suas unhas com durabilidade de mais de 25 dias sem lascar!',
    rating: 4.8,
    reviewCount: 215,
    startingPrice: 65,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80',
    instagram: 'amandasouza.nails',
    whatsapp: '11977775511',
    baseCity: 'São Paulo',
    baseNeighborhood: 'Itaim Bibi',
    maxTravelKm: 15,
    bufferTimeMinutes: 30,
    workingDays: [1, 2, 3, 4, 5, 6], // Seg a Sáb
    blockedPeriods: [],
    services: [
      {
        id: 'srv-as-1',
        name: 'Alongamento em Gel / Fibra de Vidro',
        description: 'Aplicação completa com acabamento ultra natural e cutilagem russa inclusa.',
        durationMinutes: 120,
        price: 210,
        popular: true,
      },
      {
        id: 'srv-as-2',
        name: 'Esmaltação em Gel (Mão)',
        description: 'Esmalte seco na hora na cabine LED com brilho de até 3 semanas.',
        durationMinutes: 60,
        price: 90,
      },
      {
        id: 'srv-as-3',
        name: 'Manicure + Pedicure Tradicional',
        description: 'Cutilagem caprichada e esmaltação tradicional no conforto do seu sofá.',
        durationMinutes: 60,
        price: 65,
      },
    ],
    neighborhoods: [
      { id: 'ba-1', name: 'Itaim Bibi (Região Base)', travelFee: 0 },
      { id: 'ba-2', name: 'Vila Olímpia', travelFee: 10 },
      { id: 'ba-3', name: 'Moema', travelFee: 15 },
      { id: 'ba-4', name: 'Jardins', travelFee: 15 },
    ],
    portfolio: [
      {
        url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80',
        title: 'Alongamento Francesinha Clássica',
      },
      {
        url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80',
        title: 'Unhas Almond Nude',
      },
    ],
  },
  {
    id: 'pro-4',
    name: 'Renata Vasconcelos',
    slug: 'renata-lash',
    category: 'Sobrancelha',
    specialties: ['Lash Lifting', 'Volume Russo', 'Brown Lamination'],
    title: 'Especialista em Olhar & Extensão de Cílios',
    bio: 'Maca portátil ergonômica com manta térmica para você relaxar enquanto realça a beleza do seu olhar no seu quarto.',
    rating: 4.9,
    reviewCount: 86,
    startingPrice: 90,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1583001809873-a128495da465?auto=format&fit=crop&w=1200&q=80',
    instagram: 'renatavasconcelos.lash',
    whatsapp: '11966668822',
    baseCity: 'São Paulo',
    baseNeighborhood: 'Jardins',
    maxTravelKm: 18,
    bufferTimeMinutes: 30,
    workingDays: [1, 2, 3, 4, 5], // Seg a Sex (Fins de semana folga)
    blockedPeriods: [],
    services: [
      {
        id: 'srv-rv-1',
        name: 'Extensão de Cílios Volume Russo',
        description: 'Olhar marcante, leques leves artesanais aplicados fio a fio sem danificar seus cílios naturais.',
        durationMinutes: 120,
        price: 240,
        popular: true,
      },
      {
        id: 'srv-rv-2',
        name: 'Lash Lifting + Brow Lamination',
        description: 'Curvatura e alinhamento dos fios naturais com hidratação e efeito duradouro de 45 dias.',
        durationMinutes: 75,
        price: 180,
      },
      {
        id: 'srv-rv-3',
        name: 'Design de Sobrancelha com Henna',
        description: 'Mapeamento personalizado e tingimento de fios com efeito sombreado natural.',
        durationMinutes: 40,
        price: 90,
      },
    ],
    neighborhoods: [
      { id: 'br-1', name: 'Jardins (Região Base)', travelFee: 0 },
      { id: 'br-2', name: 'Cerqueira César', travelFee: 10 },
      { id: 'br-3', name: 'Higienópolis', travelFee: 15 },
      { id: 'br-4', name: 'Consolação', travelFee: 15 },
    ],
    portfolio: [
      {
        url: 'https://images.unsplash.com/photo-1583001809873-a128495da465?auto=format&fit=crop&w=600&q=80',
        title: 'Cílios Volume Expressivo',
      },
    ],
  },
];

// Mantém export default Camila Martins como pro padrão para o painel da profissional
export const mockProfessional = mockProfessionalsList[0];
