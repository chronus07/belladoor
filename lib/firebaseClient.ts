/// <reference types="vite/client" />
// ==============================================================================
// BELLADOOR - CLIENTE OFICIAL GOOGLE FIREBASE (AUTH & CLOUD FIRESTORE)
// Sincroniza Vitrine, Serviços, Regiões, Agenda, Agendamentos e Avaliações na Nuvem Google
// ==============================================================================

import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import { AuthUser } from './supabaseClient';

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || 'AIzaSyD_Lk4dmDW1Hx1IVLx-_FygFa57FPebSJo',
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || 'belladoor-app.firebaseapp.com',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || 'belladoor-app',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || 'belladoor-app.firebasestorage.app',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '940701922430',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '',
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};

export const getFirebaseApp = (): FirebaseApp | null => {
  if (!isFirebaseConfigured()) return null;
  if (!appInstance) {
    appInstance = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return appInstance;
};

export const getFirebaseAuth = (): Auth | null => {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!authInstance) {
    authInstance = getAuth(app);
  }
  return authInstance;
};

export const getFirebaseDb = (): Firestore | null => {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!dbInstance) {
    dbInstance = getFirestore(app);
  }
  return dbInstance;
};

/**
 * Login Oficial com Conta Google via Firebase Authentication
 */
export async function signInWithFirebaseGoogle(
  role: 'CLIENT' | 'PROFESSIONAL'
): Promise<{ user?: AuthUser; error?: string }> {
  const auth = getFirebaseAuth();
  if (!auth) return {};

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    const user: AuthUser = {
      id: fbUser.uid,
      email: fbUser.email || '',
      fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuária Google',
      role,
      avatarUrl: fbUser.photoURL || undefined,
      isTrialActive: role === 'PROFESSIONAL',
      trialDaysLeft: 7,
      trialEndsAt: role === 'PROFESSIONAL' ? trialEnd.toISOString() : undefined,
      subscriptionPlan: 'ANNUAL',
    };

    return { user };
  } catch (err: any) {
    return { error: err.message || 'Erro ao autenticar com o Google Firebase.' };
  }
}

/**
 * Cadastro com E-mail e Senha no Firebase (Auth + Cloud Firestore Multi-Device)
 */
export async function signUpWithFirebaseEmail(
  email: string,
  pass: string,
  fullName: string,
  role: 'CLIENT' | 'PROFESSIONAL'
): Promise<{ user?: AuthUser; error?: string }> {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);
  const normalizedEmail = email.trim().toLowerCase();

  // Salva no Cloud Firestore para sincronizar login em qualquer dispositivo
  const db = getFirebaseDb();
  if (db) {
    try {
      const usersRef = doc(db, 'belladoor', 'users');
      const snap = await getDoc(usersRef);
      const existingUsers = snap.exists() ? snap.data()?.accounts || {} : {};

      const newUser: AuthUser = {
        id: 'usr_' + Date.now(),
        email: normalizedEmail,
        fullName: fullName || normalizedEmail.split('@')[0],
        role,
        isTrialActive: role === 'PROFESSIONAL',
        trialDaysLeft: 7,
        trialEndsAt: role === 'PROFESSIONAL' ? trialEnd.toISOString() : undefined,
        subscriptionPlan: 'ANNUAL',
      };

      existingUsers[normalizedEmail] = {
        ...newUser,
        passwordHash: btoa(unescape(encodeURIComponent(pass))),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(usersRef, { accounts: existingUsers, updatedAt: new Date().toISOString() }, { merge: true });
      return { user: newUser };
    } catch (e) {
      console.warn('[Firebase Cloud] Erro ao registrar usuária no Firestore:', e);
    }
  }

  const auth = getFirebaseAuth();
  if (!auth) return {};

  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (fullName) {
      await updateProfile(result.user, { displayName: fullName });
    }

    const user: AuthUser = {
      id: result.user.uid,
      email: result.user.email || email,
      fullName: fullName || email.split('@')[0],
      role,
      isTrialActive: role === 'PROFESSIONAL',
      trialDaysLeft: 7,
      trialEndsAt: role === 'PROFESSIONAL' ? trialEnd.toISOString() : undefined,
      subscriptionPlan: 'ANNUAL',
    };

    return { user };
  } catch (err: any) {
    return { error: err.message || 'Erro ao criar conta no Firebase.' };
  }
}

/**
 * Login com E-mail e Senha no Firebase (Cloud Firestore Multi-Device + Auth)
 */
export async function signInWithFirebaseEmail(
  email: string,
  pass: string,
  preferredRole: 'CLIENT' | 'PROFESSIONAL' = 'CLIENT'
): Promise<{ user?: AuthUser; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const db = getFirebaseDb();

  if (db) {
    try {
      const usersRef = doc(db, 'belladoor', 'users');
      const snap = await getDoc(usersRef);
      const existingUsers = snap.exists() ? snap.data()?.accounts || {} : {};
      const stored = existingUsers[normalizedEmail];

      if (stored) {
        const expectedHash = btoa(unescape(encodeURIComponent(pass)));
        if (stored.passwordHash && stored.passwordHash !== expectedHash) {
          return { error: 'Senha incorreta para este e-mail.' };
        }
        const { passwordHash, ...cleanUser } = stored;
        return { user: cleanUser as AuthUser };
      }
    } catch (e) {
      console.warn('[Firebase Cloud] Aviso ao consultar usuária no Firestore:', e);
    }
  }

  const auth = getFirebaseAuth();
  if (!auth) return {};

  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    const fbUser = result.user;
    const role: 'CLIENT' | 'PROFESSIONAL' = email.includes('pro') ? 'PROFESSIONAL' : preferredRole;

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    const user: AuthUser = {
      id: fbUser.uid,
      email: fbUser.email || email,
      fullName: fbUser.displayName || email.split('@')[0],
      role,
      avatarUrl: fbUser.photoURL || undefined,
      isTrialActive: role === 'PROFESSIONAL',
      trialDaysLeft: 7,
      trialEndsAt: role === 'PROFESSIONAL' ? trialEnd.toISOString() : undefined,
    };

    return { user };
  } catch (err: any) {
    return { error: err.message || 'E-mail ou senha inválidos.' };
  }
}

export async function signOutFirebaseUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    await signOut(auth);
  }
}

/**
 * Salva um bloco de estado do BellaDoor no Cloud Firestore (Sincronização Multi-Dispositivo)
 */
export async function syncDocumentToFirestore(
  docId: string,
  payload: Record<string, any>
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  try {
    await setDoc(
      doc(db, 'belladoor', docId),
      {
        ...payload,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn(`[Firebase Cloud] Falha ao sincronizar documento ${docId}:`, err);
  }
}

/**
 * Escuta atualizações em tempo real de um documento do Cloud Firestore
 */
export function subscribeToFirestoreDocument<T>(
  docId: string,
  onUpdate: (data: T) => void
): () => void {
  const db = getFirebaseDb();
  if (!db) return () => {};

  const ref = doc(db, 'belladoor', docId);
  const unsubscribe = onSnapshot(
    ref,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as T);
      }
    },
    (err) => {
      console.warn(`[Firebase Cloud] Erro no listener em tempo real (${docId}):`, err);
    }
  );

  return unsubscribe;
}
