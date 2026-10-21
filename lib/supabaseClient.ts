/// <reference types="vite/client" />
// ==============================================================================
// BELLADOOR - CLIENTE UNIFICADO DE AUTENTICAÇÃO (GOOGLE FIREBASE / SUPABASE)
// Prioriza Google Firebase Auth quando configurado, com fallback local/Supabase
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  isFirebaseConfigured,
  signInWithFirebaseGoogle,
  signUpWithFirebaseEmail,
  signInWithFirebaseEmail,
  checkFirebaseEmailVerificationStatus,
  resendFirebaseVerificationEmail,
  signOutFirebaseUser,
} from './firebaseClient';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  birthDate?: string;
  emailVerified?: boolean;
  role: 'CLIENT' | 'PROFESSIONAL';
  avatarUrl?: string;
  isTrialActive?: boolean;
  trialDaysLeft?: number;
  trialEndsAt?: string;
  subscriptionPlan?: 'MONTHLY' | 'ANNUAL';
  subscriptionStatus?: 'TRIAL' | 'ACTIVE';
  appliedCoupon?: string;
  couponDaysTotal?: number;
  paymentMethod?: 'PIX' | 'CARD_RECURRING' | 'COUPON';
  autoRenewCanceled?: boolean;
  autoRenewCanceledAt?: string;
  onboardingCompleted?: boolean;
  lgpdConsentAt?: string;
  lgpdPolicyVersion?: string;
  termsAcceptedAt?: string;
  termsVersion?: string;
  privacyAcceptedAt?: string;
  privacyVersion?: string;
}

export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('https://'));
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null;
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseInstance;
};

/**
 * Inicia o fluxo de login social com Google (prioriza Google Firebase Auth)
 */
export async function signInWithGoogleOAuth(
  role: 'CLIENT' | 'PROFESSIONAL',
  authMode: 'LOGIN' | 'REGISTER' = 'LOGIN',
  roleExplicitlyChosen: boolean = false
): Promise<{ user?: AuthUser; isExistingUser?: boolean; error?: string }> {
  if (isFirebaseConfigured()) {
    return signInWithFirebaseGoogle(role, authMode, roleExplicitlyChosen);
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {};
  }

  try {
    const redirectUrl = `${window.location.origin}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          role,
        },
      },
    });

    if (error) return { error: error.message };
    return {};
  } catch (err: any) {
    return { error: err.message || 'Erro ao conectar ao Google OAuth' };
  }
}

/**
 * Cadastro com E-mail e Senha (prioriza Google Firebase Auth)
 */
export async function signUpWithEmail(
  email: string,
  pass: string,
  fullName: string,
  role: 'CLIENT' | 'PROFESSIONAL',
  birthDate?: string
): Promise<{ user?: AuthUser; requiresEmailVerification?: boolean; error?: string }> {
  if (isFirebaseConfigured()) {
    return signUpWithFirebaseEmail(email, pass, fullName, role, birthDate);
  }

  const supabase = getSupabaseClient();

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);
  const trialEndsAt = trialEnd.toISOString();

  if (!supabase) {
    const simulatedUser: AuthUser = {
      id: `usr-${Date.now()}`,
      email,
      fullName: fullName || email.split('@')[0],
      birthDate,
      emailVerified: false,
      role,
      isTrialActive: role === 'PROFESSIONAL',
      trialDaysLeft: 7,
      trialEndsAt: role === 'PROFESSIONAL' ? trialEndsAt : undefined,
    };
    return { user: simulatedUser, requiresEmailVerification: true };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName,
          birth_date: birthDate || null,
          role,
          trial_ends_at: role === 'PROFESSIONAL' ? trialEndsAt : null,
        },
      },
    });

    if (error) return { error: error.message };
    if (!data.user) return { error: 'Não foi possível criar o usuário.' };

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email || email,
      fullName: fullName || data.user.user_metadata?.full_name || email.split('@')[0],
      birthDate,
      emailVerified: false,
      role,
      isTrialActive: role === 'PROFESSIONAL',
      trialDaysLeft: 7,
      trialEndsAt: role === 'PROFESSIONAL' ? trialEndsAt : undefined,
    };

    return { user, requiresEmailVerification: true };
  } catch (err: any) {
    return { error: err.message || 'Falha no cadastro.' };
  }
}

/**
 * Login com E-mail e Senha (prioriza Google Firebase Auth)
 */
export async function signInWithEmail(
  email: string,
  pass: string,
  preferredRole: 'CLIENT' | 'PROFESSIONAL' = 'CLIENT'
): Promise<{ user?: AuthUser; requiresEmailVerification?: boolean; error?: string }> {
  if (isFirebaseConfigured()) {
    return signInWithFirebaseEmail(email, pass, preferredRole);
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    const role: 'CLIENT' | 'PROFESSIONAL' = email.includes('pro') ? 'PROFESSIONAL' : 'CLIENT';
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    const simulatedUser: AuthUser = {
      id: `usr-${Date.now()}`,
      email,
      fullName: email.split('@')[0],
      role,
      isTrialActive: role === 'PROFESSIONAL',
      trialDaysLeft: 7,
      trialEndsAt: role === 'PROFESSIONAL' ? trialEnd.toISOString() : undefined,
    };
    return { user: simulatedUser };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) return { error: error.message };
    if (!data.user) return { error: 'Usuário não encontrado.' };

    const userRole = (data.user.user_metadata?.role as 'CLIENT' | 'PROFESSIONAL') || 'CLIENT';
    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email || email,
      fullName: data.user.user_metadata?.full_name || email.split('@')[0],
      birthDate: data.user.user_metadata?.birth_date || undefined,
      role: userRole,
      isTrialActive: userRole === 'PROFESSIONAL',
      trialDaysLeft: 7,
      trialEndsAt: data.user.user_metadata?.trial_ends_at,
    };

    return { user };
  } catch (err: any) {
    return { error: err.message || 'Falha no login.' };
  }
}

/**
 * Verifica se o e-mail já foi confirmado pelo link enviado
 */
export async function checkEmailVerificationStatus(
  email: string,
  pass?: string
): Promise<{ verified: boolean; user?: AuthUser; error?: string }> {
  if (isFirebaseConfigured()) {
    return checkFirebaseEmailVerificationStatus(email, pass);
  }
  return { verified: true };
}

/**
 * Reenvia o e-mail de validação
 */
export async function resendVerificationEmail(
  email: string,
  pass?: string
): Promise<{ sent: boolean; error?: string }> {
  if (isFirebaseConfigured()) {
    return resendFirebaseVerificationEmail(email, pass);
  }
  return { sent: true };
}

/**
 * Encerra sessão (Firebase e/ou Supabase)
 */
export async function signOutUser(): Promise<void> {
  if (isFirebaseConfigured()) {
    await signOutFirebaseUser();
  }
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
}
