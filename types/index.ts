// ==============================================================================
// BELLADOOR - DEFINIÇÕES DE TIPOS TYPESCRIPT
// Compartilhados entre API, Web (Next.js) e Mobile (React Native / Expo)
// ==============================================================================

export type UserRole = 'PROFESSIONAL' | 'CLIENT' | 'ADMIN';

export interface Profile {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Professional {
  id: string;
  slug: string; // Ex: 'camila-makeup'
  bio?: string;
  category: string;
  instagramHandle?: string;
  whatsappNumber: string;
  baseCity: string;
  baseState: string;
  baseNeighborhood?: string;
  maxTravelDistanceKm: number;
  bufferTimeMinutes: number; // Intervalo de deslocamento (ex: 35 min)
  acceptsAtHome: boolean;
  acceptsAtStudio: boolean;
  isVerified: boolean;
  isActive: boolean;
}

export interface ServiceArea {
  id: string;
  professionalId: string;
  neighborhoodName: string;
  city: string;
  travelFee: number;
  isCovered: boolean;
}

export interface Service {
  id: string;
  professionalId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
}

export interface AvailabilityRule {
  id: string;
  professionalId: string;
  dayOfWeek: number; // 0=Domingo, 1=Segunda, ..., 6=Sábado
  startTime: string; // '08:00'
  endTime: string;   // '19:00'
  isActive: boolean;
}

export interface BlockedPeriod {
  id: string;
  professionalId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason?: string;
  createdAt?: string;
}

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Appointment {
  id: string;
  professionalId: string;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceId: string;
  service?: Service;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  servicePrice: number;
  travelFee: number;
  totalPrice: number;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';

export interface Subscription {
  id: string;
  professionalId: string;
  planName: string;
  status: SubscriptionStatus;
  priceMonthly: number;
  trialEndsAt: string;
  currentPeriodEnd?: string;
}
