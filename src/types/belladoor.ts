export interface ClientAppointment {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  date: string;
  time: string;
  address: string;
  neighborhood: string;
  travelFee: number;
  totalPrice: number;
  status: string;
  proName?: string;
  proSlug?: string;
  reviewed?: boolean;
}

export interface ClientReview {
  id: string;
  clientName: string;
  serviceName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface BlockedPeriod {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  dates: string[];
}

export interface UiDialogPayload {
  emoji: string;
  badge?: string;
  title: string;
  message: string;
  highlight?: string;
  buttonText?: string;
  variant?: 'success' | 'warning' | 'rose';
}

export const DEFAULT_REVIEWS: ClientReview[] = [
  {
    id: 'rev-1',
    clientName: 'Fernanda Lima',
    serviceName: 'Alongamento em Fibra de Vidro',
    rating: 5,
    comment:
      'Simplesmente impecável! Chegou super no horário aqui em casa, material todo esterilizado e as unhas ficaram perfeitas.',
    date: '05/10/2026',
  },
  {
    id: 'rev-2',
    clientName: 'Juliana Costa',
    serviceName: 'Spa dos Pés + Esmaltação em Gel',
    rating: 5,
    comment:
      'Atendimento maravilhoso no conforto da minha sala. Muito caprichosa e atenciosa, já virei cliente fixa!',
    date: '02/10/2026',
  },
  {
    id: 'rev-3',
    clientName: 'Renata Silveira',
    serviceName: 'Blindagem de Diamante',
    rating: 5,
    comment:
      'Praticidade nota 1000! Não precisei pegar trânsito e o acabamento ficou digno de salão de luxo.',
    date: '28/09/2026',
  },
];

export const WEEKDAYS = [
  { index: 0, short: 'Dom', full: 'Domingo' },
  { index: 1, short: 'Seg', full: 'Segunda-feira' },
  { index: 2, short: 'Ter', full: 'Terça-feira' },
  { index: 3, short: 'Qua', full: 'Quarta-feira' },
  { index: 4, short: 'Qui', full: 'Quinta-feira' },
  { index: 5, short: 'Sex', full: 'Sexta-feira' },
  { index: 6, short: 'Sáb', full: 'Sábado' },
];

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
