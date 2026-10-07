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

export const DEFAULT_REVIEWS: ClientReview[] = [];

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
