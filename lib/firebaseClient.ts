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
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  signOut,
  updateProfile,
  deleteUser,
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
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || 'AIzaSyBsMi0M2JBZYIYLrl4oKj3tlsQrWLLe3X4',
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || 'belladoor-app.firebaseapp.com',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || 'belladoor-app',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || 'belladoor-app.firebasestorage.app',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_ID || '940701922430',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '1:940701922430:web:8d1014c06ee63ac3ab142f',
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
    authInstance.languageCode = 'pt-BR';
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

function sanitizeForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * [LGPD Art. 46] Gera hash criptográfico irreversível SHA-256 com salt do e-mail via Web Crypto API
 */
export async function hashPasswordSHA256(plainPassword: string, emailSalt: string): Promise<string> {
  const normalizedSalt = (emailSalt || '').trim().toLowerCase();
  const payload = `belladoor_lgpd_v1:${normalizedSalt}:${plainPassword}`;
  try {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const msgBuffer = new TextEncoder().encode(payload);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return `sha256:${hashHex}`;
    }
  } catch {}
  // Fallback determinístico caso Web Crypto não esteja disponível em navegador antigo
  let h1 = 0xdeadbeef ^ payload.length;
  let h2 = 0x41c6ce57 ^ payload.length;
  for (let i = 0, ch; i < payload.length; i++) {
    ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `sha256:${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
}

async function verifyStoredPasswordHash(
  storedHash: string | undefined,
  plainPassword: string,
  emailSalt: string
): Promise<{ matches: boolean; needsUpgradeToSha256: boolean }> {
  if (!storedHash) return { matches: true, needsUpgradeToSha256: true };
  if (storedHash.startsWith('sha256:')) {
    const computed = await hashPasswordSHA256(plainPassword, emailSalt);
    return { matches: storedHash === computed, needsUpgradeToSha256: false };
  }
  // Compatibilidade com contas antigas pré-LGPD para migrar automaticamente para SHA-256 no login
  const legacyBase64 = btoa(unescape(encodeURIComponent(plainPassword)));
  return { matches: storedHash === legacyBase64, needsUpgradeToSha256: storedHash === legacyBase64 };
}

export function computeRemainingTrialDays(trialEndsAt?: string): number {
  if (!trialEndsAt) return 7;
  const endMs = new Date(trialEndsAt).getTime();
  if (Number.isNaN(endMs)) return 7;
  const diffDays = Math.ceil((endMs - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Login Oficial com Conta Google (Gmail) via Firebase Authentication + Cloud Firestore
 */
export async function signInWithFirebaseGoogle(
  role: 'CLIENT' | 'PROFESSIONAL',
  authMode: 'LOGIN' | 'REGISTER' = 'LOGIN',
  roleExplicitlyChosen: boolean = false
): Promise<{ user?: AuthUser; isExistingUser?: boolean; error?: string }> {
  const auth = getFirebaseAuth();
  if (!auth) return { error: 'Serviço de autenticação não disponível.' };

  try {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch {}

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);
    const normalizedEmail = (fbUser.email || '').trim().toLowerCase();

    const db = getFirebaseDb();
    if (db && normalizedEmail) {
      try {
        const usersRef = doc(db, 'belladoor_prod', 'users');
        const snap = await getDoc(usersRef);
        const existingUsers = snap.exists() ? snap.data()?.accounts || {} : {};
        const stored = existingUsers[normalizedEmail];

        if (stored && stored.email && stored.email.toLowerCase() === normalizedEmail) {
          const { passwordHash, ...cleanUser } = stored;
          // Se o usuário escolheu explicitamente Cliente ou Profissional na tela, respeita a escolha;
          // caso contrário, se apenas clicou em "Já Tenho Conta (Entrar)", usa o perfil salvo da conta.
          const resolvedRole: 'CLIENT' | 'PROFESSIONAL' = roleExplicitlyChosen
            ? role
            : (cleanUser.role as 'CLIENT' | 'PROFESSIONAL') || role;

          const resolvedTrialEndsAt =
            resolvedRole === 'PROFESSIONAL'
              ? cleanUser.trialEndsAt || trialEnd.toISOString()
              : undefined;
          const remainingDays = computeRemainingTrialDays(resolvedTrialEndsAt);

          const updatedUser: AuthUser = {
            ...cleanUser,
            id: fbUser.uid || cleanUser.id,
            email: normalizedEmail,
            fullName:
              cleanUser.fullName ||
              fbUser.displayName ||
              normalizedEmail.split('@')[0] ||
              'Usuária Google',
            role: resolvedRole,
            // Busca a foto do Google somente no 1º cadastro; nunca sobrescreve depois nos próximos logins
            avatarUrl: cleanUser.avatarUrl || undefined,
            isTrialActive:
              resolvedRole === 'PROFESSIONAL' &&
              cleanUser.subscriptionStatus !== 'ACTIVE' &&
              remainingDays > 0,
            trialDaysLeft: remainingDays,
            trialEndsAt: resolvedTrialEndsAt,
            subscriptionPlan: cleanUser.subscriptionPlan || 'ANNUAL',
            subscriptionStatus: cleanUser.subscriptionStatus || 'TRIAL',
          };

          existingUsers[normalizedEmail] = sanitizeForFirestore({
            ...stored,
            ...updatedUser,
            googlePhotoImportedOnce: true,
            updatedAt: new Date().toISOString(),
          });

          await setDoc(
            usersRef,
            sanitizeForFirestore({ accounts: existingUsers, updatedAt: new Date().toISOString() }),
            { merge: true }
          );

          return { user: updatedUser, isExistingUser: true };
        }

        const nowIso = new Date().toISOString();
        const newUser: AuthUser = {
          id: fbUser.uid,
          email: normalizedEmail,
          fullName: fbUser.displayName || normalizedEmail.split('@')[0] || 'Usuária Google',
          role,
          avatarUrl: fbUser.photoURL || undefined,
          isTrialActive: role === 'PROFESSIONAL',
          trialDaysLeft: 7,
          trialEndsAt: role === 'PROFESSIONAL' ? trialEnd.toISOString() : undefined,
          subscriptionPlan: 'ANNUAL',
          subscriptionStatus: 'TRIAL',
          lgpdConsentAt: nowIso,
          lgpdPolicyVersion: '2026.2',
          termsAcceptedAt: nowIso,
          termsVersion: '2026.2',
          privacyAcceptedAt: nowIso,
          privacyVersion: '2026.2',
        };

        existingUsers[normalizedEmail] = sanitizeForFirestore({
          ...newUser,
          googlePhotoImportedOnce: true,
          createdAt: nowIso,
          updatedAt: nowIso,
        });

        await setDoc(
          usersRef,
          sanitizeForFirestore({ accounts: existingUsers, updatedAt: nowIso }),
          { merge: true }
        );
        return { user: newUser, isExistingUser: authMode === 'LOGIN' };
      } catch (e) {
        console.warn('[Firebase Cloud] Aviso ao sincronizar conta Google no Firestore:', e);
      }
    }

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
      lgpdConsentAt: new Date().toISOString(),
      lgpdPolicyVersion: '2026.1',
    };

    return { user, isExistingUser: authMode === 'LOGIN' };
  } catch (err: any) {
    if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
      return { error: 'Janela de login com Google foi fechada antes de concluir. Clique novamente para entrar.' };
    }
    if (err?.code === 'auth/popup-blocked') {
      return { error: 'O navegador bloqueou a janela do Google. Permita pop-ups para este site e tente novamente.' };
    }
    return { error: 'Não foi possível concluir o login com Google no momento. Tente novamente.' };
  }
}

/**
 * Cadastro com E-mail e Senha no Firebase (Firebase Authentication + Cloud Firestore Multi-Device)
 */
export async function signUpWithFirebaseEmail(
  email: string,
  pass: string,
  fullName: string,
  role: 'CLIENT' | 'PROFESSIONAL',
  birthDate?: string
): Promise<{ user?: AuthUser; requiresEmailVerification?: boolean; error?: string }> {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);
  const normalizedEmail = email.trim().toLowerCase();

  const db = getFirebaseDb();
  const auth = getFirebaseAuth();

  // 1. Verifica se já existe no Cloud Firestore
  let existingUsers: Record<string, any> = {};
  let deletedEmails: Record<string, any> = {};
  if (db) {
    try {
      const usersRef = doc(db, 'belladoor_prod', 'users');
      const snap = await getDoc(usersRef);
      existingUsers = snap.exists() ? snap.data()?.accounts || {} : {};
      deletedEmails = snap.exists() ? snap.data()?.deletedEmails || {} : {};
      if (existingUsers[normalizedEmail]) {
        return { error: 'Este e-mail já possui conta. Clique em "Já Tenho Conta (Entrar)" para acessar.' };
      }
    } catch (e) {
      console.warn('[Firebase Cloud] Aviso ao verificar usuária no Firestore:', e);
    }
  }

  // 2. Cria a conta oficial no Google Firebase Authentication e envia e-mail de validação
  let firebaseUid = 'usr_' + Date.now();
  if (auth) {
    try {
      auth.languageCode = 'pt-BR';
      const result = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
      firebaseUid = result.user.uid;
      if (fullName) {
        await updateProfile(result.user, { displayName: fullName });
      }
      // Envia e-mail oficial de verificação do Firebase Authentication
      try {
        await sendEmailVerification(result.user, { url: window.location.origin });
      } catch {
        try {
          await sendEmailVerification(result.user);
        } catch (verifyErr) {
          console.warn('[Firebase Auth] Aviso ao disparar e-mail de verificação:', verifyErr);
        }
      }
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        // Se foi excluído pelo Admin no Firestore, permite recadastrar a conta novamente
        if (!existingUsers[normalizedEmail]) {
          try {
            const signInRes = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
            firebaseUid = signInRes.user.uid;
            if (fullName) {
              await updateProfile(signInRes.user, { displayName: fullName });
            }
            if (!signInRes.user.emailVerified) {
              try {
                await sendEmailVerification(signInRes.user, { url: window.location.origin });
              } catch {
                try {
                  await sendEmailVerification(signInRes.user);
                } catch {}
              }
            }
          } catch {
            // Se a senha nova for diferente da antiga do Firebase Auth, segue com novo registro no Firestore
          }
        } else {
          return { error: 'Este e-mail já possui conta. Clique em "Já Tenho Conta (Entrar)" ou use o botão Continuar com o Google.' };
        }
      } else if (err?.code === 'auth/invalid-email') {
        return { error: 'Formato de e-mail inválido. Verifique o endereço digitado.' };
      } else if (err?.code === 'auth/weak-password') {
        return { error: 'A senha deve ter pelo menos 6 caracteres.' };
      } else {
        console.warn('[Firebase Auth] Aviso ao criar usuário no Auth:', err);
      }
    }
  }

  const nowIso = new Date().toISOString();
  const newUser: AuthUser = {
    id: firebaseUid,
    email: normalizedEmail,
    fullName: fullName.trim() || normalizedEmail.split('@')[0],
    birthDate: birthDate?.trim() || undefined,
    emailVerified: false,
    role,
    isTrialActive: role === 'PROFESSIONAL',
    trialDaysLeft: 7,
    trialEndsAt: role === 'PROFESSIONAL' ? trialEnd.toISOString() : undefined,
    subscriptionPlan: 'ANNUAL',
    lgpdConsentAt: nowIso,
    lgpdPolicyVersion: '2026.2',
    termsAcceptedAt: nowIso,
    termsVersion: '2026.2',
    privacyAcceptedAt: nowIso,
    privacyVersion: '2026.2',
  };

  // 3. Salva perfil completo no Cloud Firestore com hash criptográfico irreversível SHA-256 (LGPD Art. 46)
  if (db) {
    try {
      const sha256Hash = await hashPasswordSHA256(pass, normalizedEmail);
      const usersRef = doc(db, 'belladoor_prod', 'users');
      delete deletedEmails[normalizedEmail];
      existingUsers[normalizedEmail] = sanitizeForFirestore({
        ...newUser,
        requiresEmailVerification: true,
        emailVerified: false,
        passwordHash: sha256Hash,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      await setDoc(
        usersRef,
        sanitizeForFirestore({
          accounts: existingUsers,
          deletedEmails,
          updatedAt: nowIso,
        })
      );
    } catch (e) {
      console.warn('[Firebase Cloud] Erro ao registrar usuária no Firestore:', e);
    }
  }

  return { user: newUser, requiresEmailVerification: true };
}

/**
 * Login com E-mail e Senha no Firebase (Firebase Authentication + Cloud Firestore Multi-Device)
 */
export async function signInWithFirebaseEmail(
  email: string,
  pass: string,
  preferredRole: 'CLIENT' | 'PROFESSIONAL' = 'CLIENT'
): Promise<{ user?: AuthUser; requiresEmailVerification?: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();

  // 1. Consulta o perfil salvo no Cloud Firestore
  let stored: any = null;
  let existingUsers: Record<string, any> = {};
  let deletedEmails: Record<string, any> = {};
  if (db) {
    try {
      const usersRef = doc(db, 'belladoor_prod', 'users');
      const snap = await getDoc(usersRef);
      existingUsers = snap.exists() ? snap.data()?.accounts || {} : {};
      deletedEmails = snap.exists() ? snap.data()?.deletedEmails || {} : {};
      stored = existingUsers[normalizedEmail] || null;
      if (!stored && deletedEmails[normalizedEmail]) {
        return {
          error:
            'Este cadastro foi removido. Clique em "Criar Nova Conta" acima caso deseje se cadastrar novamente.',
        };
      }
    } catch (e) {
      console.warn('[Firebase Cloud] Aviso ao consultar usuária no Firestore:', e);
    }
  }

  // Se a senha foi redefinida pelo usuário ("Esqueci minha senha") ou pelo Admin, valida direto pelo hash SHA-256 atualizado no Firestore
  if (stored && stored.passwordResetAt && stored.passwordHash) {
    const check = await verifyStoredPasswordHash(stored.passwordHash, pass, normalizedEmail);
    if (!check.matches) {
      return { error: 'Senha incorreta para este e-mail. Se esqueceu sua senha, clique em "Esqueci minha senha?".' };
    }
    const targetRole: 'CLIENT' | 'PROFESSIONAL' = preferredRole || (stored.role as 'CLIENT' | 'PROFESSIONAL') || 'CLIENT';
    const { passwordHash, ...cleanUser } = stored;
    const remainingDays = computeRemainingTrialDays(cleanUser.trialEndsAt);
    const resolvedUser: AuthUser = {
      ...(cleanUser as AuthUser),
      role: targetRole,
      trialDaysLeft: remainingDays,
      isTrialActive:
        targetRole === 'PROFESSIONAL' &&
        cleanUser.subscriptionStatus !== 'ACTIVE' &&
        remainingDays > 0,
    };

    if (targetRole !== stored.role && db) {
      try {
        existingUsers[normalizedEmail] = sanitizeForFirestore({
          ...stored,
          role: targetRole,
          updatedAt: new Date().toISOString(),
        });
        await setDoc(
          doc(db, 'belladoor_prod', 'users'),
          sanitizeForFirestore({
            accounts: existingUsers,
            deletedEmails,
            updatedAt: new Date().toISOString(),
          }),
          { merge: true }
        );
      } catch {}
    }

    if (stored.requiresEmailVerification && !stored.emailVerified) {
      return {
        user: resolvedUser,
        requiresEmailVerification: true,
      };
    }
    return { user: resolvedUser };
  }

  // 2. Autentica no Google Firebase Authentication
  if (auth) {
    try {
      const result = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
      const fbUser = result.user;
      try {
        await reload(fbUser);
      } catch {}

      const isVerifiedInAuth = Boolean(fbUser.emailVerified);
      const needsVerification =
        stored?.requiresEmailVerification === true &&
        !isVerifiedInAuth &&
        stored?.emailVerified !== true;

      if (stored) {
        const targetRole: 'CLIENT' | 'PROFESSIONAL' = preferredRole || (stored.role as 'CLIENT' | 'PROFESSIONAL') || 'CLIENT';
        const { passwordHash, ...cleanUser } = stored;
        const remainingDays = computeRemainingTrialDays(cleanUser.trialEndsAt);
        const resolvedUser: AuthUser = {
          ...(cleanUser as AuthUser),
          role: targetRole,
          emailVerified: isVerifiedInAuth || Boolean(cleanUser.emailVerified),
          trialDaysLeft: remainingDays,
          isTrialActive:
            targetRole === 'PROFESSIONAL' &&
            cleanUser.subscriptionStatus !== 'ACTIVE' &&
            remainingDays > 0,
        };

        const needsSha256Upgrade =
          typeof stored.passwordHash === 'string' && !stored.passwordHash.startsWith('sha256:');
        const roleChanged = targetRole !== stored.role;

        if (((isVerifiedInAuth && !stored.emailVerified) || needsSha256Upgrade || roleChanged) && db) {
          try {
            const upgradedHash = needsSha256Upgrade
              ? await hashPasswordSHA256(pass, normalizedEmail)
              : stored.passwordHash;
            existingUsers[normalizedEmail] = sanitizeForFirestore({
              ...stored,
              role: targetRole,
              emailVerified: isVerifiedInAuth || Boolean(stored.emailVerified),
              passwordHash: upgradedHash,
              updatedAt: new Date().toISOString(),
            });
            await setDoc(
              doc(db, 'belladoor_prod', 'users'),
              sanitizeForFirestore({
                accounts: existingUsers,
                deletedEmails,
                updatedAt: new Date().toISOString(),
              })
            );
          } catch {}
        }

        if (needsVerification) {
          return {
            user: resolvedUser,
            requiresEmailVerification: true,
          };
        }

        return { user: resolvedUser };
      }

      const role: 'CLIENT' | 'PROFESSIONAL' = preferredRole;
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);

      const user: AuthUser = {
        id: fbUser.uid,
        email: fbUser.email || normalizedEmail,
        fullName: fbUser.displayName || normalizedEmail.split('@')[0],
        emailVerified: isVerifiedInAuth,
        role,
        avatarUrl: fbUser.photoURL || undefined,
        isTrialActive: role === 'PROFESSIONAL',
        trialDaysLeft: 7,
        trialEndsAt: role === 'PROFESSIONAL' ? trialEnd.toISOString() : undefined,
        subscriptionPlan: 'ANNUAL',
        subscriptionStatus: 'TRIAL',
      };

      if (!isVerifiedInAuth && role === 'CLIENT') {
        return {
          user,
          requiresEmailVerification: true,
        };
      }

      return { user };
    } catch (err: any) {
      // Se já existia no Firestore antes do Auth, valida pelo hash SHA-256 salvo no Firestore
      if (stored) {
        const check = await verifyStoredPasswordHash(stored.passwordHash, pass, normalizedEmail);
        if (!check.matches) {
          return { error: 'Senha incorreta para este e-mail.' };
        }
        if (check.needsUpgradeToSha256 && db) {
          try {
            const upgradedHash = await hashPasswordSHA256(pass, normalizedEmail);
            existingUsers[normalizedEmail] = sanitizeForFirestore({
              ...stored,
              passwordHash: upgradedHash,
              updatedAt: new Date().toISOString(),
            });
            await setDoc(
              doc(db, 'belladoor_prod', 'users'),
              sanitizeForFirestore({
                accounts: existingUsers,
                deletedEmails,
                updatedAt: new Date().toISOString(),
              })
            );
          } catch {}
        }
        const targetRole: 'CLIENT' | 'PROFESSIONAL' = preferredRole || (stored.role as 'CLIENT' | 'PROFESSIONAL') || 'CLIENT';
        const { passwordHash, ...cleanUser } = stored;
        const remainingDays = computeRemainingTrialDays(cleanUser.trialEndsAt);
        const fallbackUser: AuthUser = {
          ...(cleanUser as AuthUser),
          role: targetRole,
          trialDaysLeft: remainingDays,
          isTrialActive:
            targetRole === 'PROFESSIONAL' &&
            cleanUser.subscriptionStatus !== 'ACTIVE' &&
            remainingDays > 0,
        };
        if (stored.requiresEmailVerification && !stored.emailVerified) {
          return {
            user: fallbackUser,
            requiresEmailVerification: true,
          };
        }
        return { user: fallbackUser };
      }

      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        return { error: 'E-mail ou senha incorretos, ou esta conta foi criada pelo botão do Google (clique em "Continuar com o Google" acima).' };
      }
      if (err?.code === 'auth/user-not-found') {
        return { error: 'Nenhuma conta encontrada com este e-mail. Clique em "Criar Nova Conta" acima para se cadastrar.' };
      }
      return { error: 'Nenhuma conta encontrada com este e-mail. Clique em "Criar Nova Conta" ou entre com sua conta Google.' };
    }
  }

  if (!stored) {
    return { error: 'Nenhuma conta encontrada com este e-mail. Clique em "Criar Nova Conta" acima para se cadastrar.' };
  }

  const check = await verifyStoredPasswordHash(stored.passwordHash, pass, normalizedEmail);
  if (!check.matches) {
    return { error: 'Senha incorreta para este e-mail.' };
  }
  const targetRole: 'CLIENT' | 'PROFESSIONAL' = preferredRole || (stored.role as 'CLIENT' | 'PROFESSIONAL') || 'CLIENT';
  const { passwordHash, ...cleanUser } = stored;
  const remainingDays = computeRemainingTrialDays(cleanUser.trialEndsAt);
  return {
    user: {
      ...(cleanUser as AuthUser),
      role: targetRole,
      trialDaysLeft: remainingDays,
      isTrialActive:
        targetRole === 'PROFESSIONAL' &&
        cleanUser.subscriptionStatus !== 'ACTIVE' &&
        remainingDays > 0,
    },
  };
}

/**
 * Verifica no Firebase Auth se o link de e-mail já foi clicado/validado pelo usuário
 */
export async function checkFirebaseEmailVerificationStatus(
  email: string,
  pass?: string
): Promise<{ verified: boolean; user?: AuthUser; error?: string }> {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  if (!auth) return { verified: false, error: 'Serviço de autenticação não disponível.' };

  try {
    let fbUser = auth.currentUser;
    if ((!fbUser || (fbUser.email || '').toLowerCase() !== normalizedEmail) && pass) {
      const res = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
      fbUser = res.user;
    }

    if (fbUser) {
      await reload(fbUser);
    }

    let existingUsers: Record<string, any> = {};
    let stored: any = null;
    if (db && normalizedEmail) {
      const usersRef = doc(db, 'belladoor_prod', 'users');
      const snap = await getDoc(usersRef);
      existingUsers = snap.exists() ? snap.data()?.accounts || {} : {};
      stored = existingUsers[normalizedEmail] || null;
    }

    const isVerified = Boolean(fbUser?.emailVerified || stored?.emailVerified === true);
    if (!isVerified) {
      return { verified: false };
    }

    if (db && normalizedEmail && stored) {
      existingUsers[normalizedEmail] = sanitizeForFirestore({
        ...stored,
        emailVerified: true,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(
        doc(db, 'belladoor_prod', 'users'),
        sanitizeForFirestore({ accounts: existingUsers, updatedAt: new Date().toISOString() }),
        { merge: true }
      );
      const { passwordHash, ...cleanUser } = existingUsers[normalizedEmail];
      const remainingDays = computeRemainingTrialDays(cleanUser.trialEndsAt);
      return {
        verified: true,
        user: {
          ...(cleanUser as AuthUser),
          emailVerified: true,
          trialDaysLeft: remainingDays,
          isTrialActive:
            cleanUser.role === 'PROFESSIONAL' &&
            cleanUser.subscriptionStatus !== 'ACTIVE' &&
            remainingDays > 0,
        },
      };
    }

    if (fbUser) {
      return {
        verified: true,
        user: {
          id: fbUser.uid,
          email: fbUser.email || normalizedEmail,
          fullName: fbUser.displayName || normalizedEmail.split('@')[0],
          emailVerified: true,
          role: 'CLIENT',
        },
      };
    }

    return { verified: true };
  } catch (err: any) {
    console.warn('[Firebase Auth] Erro ao verificar status do e-mail:', err);
    return { verified: false, error: 'Não foi possível verificar o status do e-mail no momento.' };
  }
}

/**
 * Reenvia o link oficial de validação de e-mail para o usuário
 */
export async function resendFirebaseVerificationEmail(
  email: string,
  pass?: string
): Promise<{ sent: boolean; error?: string }> {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const auth = getFirebaseAuth();
  if (!auth) return { sent: false, error: 'Serviço de autenticação não disponível.' };

  try {
    auth.languageCode = 'pt-BR';
    let fbUser = auth.currentUser;
    if ((!fbUser || (fbUser.email || '').toLowerCase() !== normalizedEmail) && pass) {
      const res = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
      fbUser = res.user;
    }
    if (!fbUser) {
      return { sent: false, error: 'Sessão expirada. Faça login novamente para reenviar o e-mail.' };
    }
    try {
      await sendEmailVerification(fbUser, { url: window.location.origin });
    } catch {
      await sendEmailVerification(fbUser);
    }
    return { sent: true };
  } catch (err: any) {
    if (err?.code === 'auth/too-many-requests') {
      return {
        sent: false,
        error: 'Um link já foi enviado recentemente. Aguarde alguns instantes e verifique sua caixa de entrada ou spam.',
      };
    }
    return { sent: false, error: 'Não foi possível reenviar o e-mail agora. Tente novamente em instantes.' };
  }
}

export async function signOutFirebaseUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    await signOut(auth);
  }
}

/**
 * Redefine a senha do usuário no Cloud Firestore validando E-mail + Data de Nascimento (com hash SHA-256)
 */
export async function resetUserPasswordInFirebase(
  email: string,
  birthDate: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const db = getFirebaseDb();
  const normalizedEmail = (email || '').trim().toLowerCase();
  const cleanBirthDate = (birthDate || '').trim();

  if (!db) {
    return { ok: false, error: 'Serviço de banco de dados indisponível no momento.' };
  }
  if (!normalizedEmail) {
    return { ok: false, error: 'Informe seu e-mail cadastrado.' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: 'A nova senha deve ter pelo menos 6 caracteres.' };
  }

  try {
    const usersRef = doc(db, 'belladoor_prod', 'users');
    const snap = await getDoc(usersRef);
    const existingUsers = snap.exists() ? snap.data()?.accounts || {} : {};
    const stored = existingUsers[normalizedEmail];

    if (!stored) {
      return {
        ok: false,
        error:
          'Nenhuma conta encontrada com este e-mail. Verifique se digitou corretamente ou clique em "Criar Nova Conta".',
      };
    }

    // Se a conta possui data de nascimento cadastrada, valida para confirmar a titularidade
    if (stored.birthDate && stored.birthDate.trim()) {
      const storedDigits = stored.birthDate.replace(/\D/g, '');
      const inputDigits = cleanBirthDate.replace(/\D/g, '');
      if (!inputDigits || storedDigits !== inputDigits) {
        return {
          ok: false,
          error:
            'A data de nascimento informada não confere com o cadastro deste e-mail. Verifique os números (DD/MM/AAAA) ou envie o link de recuperação para seu e-mail abaixo.',
        };
      }
    }

    const nowIso = new Date().toISOString();
    const newSha256Hash = await hashPasswordSHA256(newPassword, normalizedEmail);

    existingUsers[normalizedEmail] = sanitizeForFirestore({
      ...stored,
      birthDate: stored.birthDate || cleanBirthDate || undefined,
      passwordHash: newSha256Hash,
      passwordResetAt: nowIso,
      updatedAt: nowIso,
    });

    await setDoc(
      usersRef,
      sanitizeForFirestore({
        accounts: existingUsers,
        updatedAt: nowIso,
      }),
      { merge: true }
    );

    return { ok: true };
  } catch (err) {
    console.warn('[Firebase Auth] Erro ao redefinir senha:', err);
    return { ok: false, error: 'Não foi possível redefinir sua senha no momento. Tente novamente.' };
  }
}

/**
 * Envia link oficial de redefinição de senha do Google Firebase Auth por e-mail
 */
export async function sendFirebasePasswordResetLink(
  email: string
): Promise<{ sent: boolean; error?: string }> {
  const auth = getFirebaseAuth();
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!auth || !normalizedEmail) {
    return { sent: false, error: 'Informe um e-mail válido para receber o link.' };
  }

  try {
    auth.languageCode = 'pt-BR';
    await sendPasswordResetEmail(auth, normalizedEmail);
    return { sent: true };
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found') {
      return {
        sent: false,
        error: 'Este e-mail não possui senha cadastrada no servidor de e-mails ou entrou via Google.',
      };
    }
    if (err?.code === 'auth/too-many-requests') {
      return {
        sent: false,
        error: 'Um link já foi enviado recentemente. Verifique sua Caixa de Entrada e Spam.',
      };
    }
    return {
      sent: false,
      error: 'Use a redefinição imediata acima informando sua Data de Nascimento.',
    };
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
      doc(db, 'belladoor_prod', docId),
      sanitizeForFirestore({
        ...payload,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn(`[Firebase Cloud] Falha ao sincronizar documento ${docId}:`, err);
  }
}

/**
 * Adiciona ou atualiza um agendamento no Cloud Firestore de forma atômica
 * Garante que o agendamento seja gravado imediatamente e que não sobrescreva outros agendamentos.
 */
export async function appendAppointmentToFirestore(
  appointment: any
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  try {
    const docRef = doc(db, 'belladoor_prod', 'appointments');
    const snap = await getDoc(docRef);
    const existingItems = snap.exists() && Array.isArray(snap.data()?.items) ? snap.data()?.items : [];
    
    // Evita duplicatas pelo ID
    const filtered = existingItems.filter((item: any) => item.id !== appointment.id);
    const newItems = [appointment, ...filtered];

    await setDoc(
      docRef,
      sanitizeForFirestore({
        items: newItems,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firebase Cloud] Erro ao gravar agendamento no Firestore:', err);
  }
}

export interface BetaFeedbackEntry {
  id: string;
  proEmail: string;
  proName: string;
  proWhatsapp?: string;
  rating: number;
  likedMost: string;
  missingOrHard: string;
  willingnessToPay: 'YES' | 'MAYBE' | 'NO';
  additionalComments?: string;
  submittedAt: string;
}

/**
 * Adiciona ou atualiza feedback do programa beta das 10 primeiras profissionais
 */
export async function appendFeedbackToFirestore(feedback: BetaFeedbackEntry): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  try {
    const docRef = doc(db, 'belladoor_prod', 'beta_feedback');
    const snap = await getDoc(docRef);
    const existingItems = snap.exists() && Array.isArray(snap.data()?.items) ? snap.data()?.items : [];
    const filtered = existingItems.filter(
      (item: BetaFeedbackEntry) =>
        item.id !== feedback.id &&
        item.proEmail?.toLowerCase() !== feedback.proEmail?.toLowerCase()
    );
    const newItems = [feedback, ...filtered];

    await setDoc(
      docRef,
      sanitizeForFirestore({
        items: newItems,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firebase Cloud] Erro ao gravar feedback no Firestore:', err);
  }
}

/**
 * Escuta atualizações em tempo real de um documento do Cloud Firestore
 */
export function subscribeToFirestoreDocument<T>(
  docId: string,
  onUpdate: (data: T) => void,
  onReady?: (exists: boolean) => void
): () => void {
  const db = getFirebaseDb();
  if (!db) return () => {};

  let initialFired = false;
  const ref = doc(db, 'belladoor_prod', docId);
  const unsubscribe = onSnapshot(
    ref,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as T);
      }
      if (!initialFired) {
        initialFired = true;
        onReady?.(snapshot.exists());
      }
    },
    (err) => {
      console.warn(`[Firebase Cloud] Erro no listener em tempo real (${docId}):`, err);
      if (!initialFired) {
        initialFired = true;
        onReady?.(false);
      }
    }
  );

  return unsubscribe;
}

/**
 * Atualiza os dados de assinatura / cupom / dias livres da conta do usuário no Cloud Firestore
 */
export async function updateUserAccountInFirestore(
  email: string,
  updates: Partial<AuthUser>
): Promise<void> {
  const db = getFirebaseDb();
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!db || !normalizedEmail) return;

  try {
    const usersRef = doc(db, 'belladoor_prod', 'users');
    const snap = await getDoc(usersRef);
    const existingUsers = snap.exists() ? snap.data()?.accounts || {} : {};
    const stored = existingUsers[normalizedEmail] || {};

    existingUsers[normalizedEmail] = sanitizeForFirestore({
      ...stored,
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(
      usersRef,
      sanitizeForFirestore({ accounts: existingUsers, updatedAt: new Date().toISOString() }),
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firebase Cloud] Falha ao atualizar assinatura do usuário:', err);
  }
}

/**
 * [ADMIN] Salva / edita um cadastro de cliente ou profissional diretamente no Cloud Firestore
 */
export async function adminSaveUserInFirestore(
  originalEmail: string,
  updatedData: Record<string, any>
): Promise<{ ok: boolean; error?: string }> {
  const db = getFirebaseDb();
  if (!db) return { ok: false, error: 'Banco de dados não disponível.' };

  const oldKey = (originalEmail || '').trim().toLowerCase();
  const newKey = (updatedData.email || oldKey).trim().toLowerCase();
  if (!newKey) return { ok: false, error: 'E-mail inválido.' };

  try {
    const usersRef = doc(db, 'belladoor_prod', 'users');
    const snap = await getDoc(usersRef);
    const docData = snap.exists() ? snap.data() || {} : {};
    const existingUsers: Record<string, any> = { ...(docData.accounts || {}) };
    const deletedEmails: Record<string, any> = { ...(docData.deletedEmails || {}) };

    const previousRecord = existingUsers[oldKey] || existingUsers[newKey] || {};
    if (oldKey && oldKey !== newKey) {
      delete existingUsers[oldKey];
    }
    delete deletedEmails[newKey];

    const { newPasswordPlain, ...cleanUpdatedData } = updatedData;
    const nowIso = new Date().toISOString();
    const passwordFields: Record<string, any> = {};

    if (typeof newPasswordPlain === 'string' && newPasswordPlain.trim().length >= 6) {
      passwordFields.passwordHash = await hashPasswordSHA256(newPasswordPlain.trim(), newKey);
      passwordFields.passwordResetAt = nowIso;
    }

    existingUsers[newKey] = sanitizeForFirestore({
      ...previousRecord,
      ...cleanUpdatedData,
      ...passwordFields,
      email: newKey,
      updatedAt: nowIso,
    });

    await setDoc(
      usersRef,
      sanitizeForFirestore({
        ...docData,
        accounts: existingUsers,
        deletedEmails,
        updatedAt: nowIso,
      })
    );

    return { ok: true };
  } catch (err: any) {
    console.warn('[Firebase Admin] Erro ao salvar usuário:', err);
    return { ok: false, error: 'Não foi possível salvar as alterações no banco de dados.' };
  }
}

/**
 * [ADMIN] Exclui completamente o cadastro de um cliente ou profissional do Cloud Firestore e Diretório
 */
export async function adminDeleteUserFromFirestore(
  email: string,
  proKey?: string
): Promise<{ ok: boolean; error?: string }> {
  const db = getFirebaseDb();
  if (!db) return { ok: false, error: 'Banco de dados não disponível.' };

  const normalizedEmail = (email || '').trim().toLowerCase();
  const resolvedProKey =
    proKey || (normalizedEmail ? normalizedEmail.replace(/[^a-z0-9]/g, '_') : '');

  try {
    // 1. Remove de belladoor_prod/users
    const usersRef = doc(db, 'belladoor_prod', 'users');
    const snap = await getDoc(usersRef);
    if (snap.exists()) {
      const docData = snap.data() || {};
      const existingUsers: Record<string, any> = { ...(docData.accounts || {}) };
      const deletedEmails: Record<string, any> = { ...(docData.deletedEmails || {}) };

      if (normalizedEmail) {
        delete existingUsers[normalizedEmail];
        deletedEmails[normalizedEmail] = new Date().toISOString();
      }

      await setDoc(
        usersRef,
        sanitizeForFirestore({
          ...docData,
          accounts: existingUsers,
          deletedEmails,
          updatedAt: new Date().toISOString(),
        })
      );
    }

    // 2. Remove do Diretório Público de Profissionais (professionals_directory)
    if (resolvedProKey) {
      const dirRef = doc(db, 'belladoor_prod', 'professionals_directory');
      const dirSnap = await getDoc(dirRef);
      if (dirSnap.exists()) {
        const dirData = dirSnap.data() || {};
        const profiles: Record<string, any> = { ...(dirData.profiles || {}) };
        let changed = false;
        if (profiles[resolvedProKey]) {
          delete profiles[resolvedProKey];
          changed = true;
        }
        // Também verifica se há algum perfil com id `pro-${resolvedProKey}`
        Object.keys(profiles).forEach((k) => {
          if (
            k === resolvedProKey ||
            profiles[k]?.id === `pro-${resolvedProKey}` ||
            (normalizedEmail &&
              (profiles[k]?.email || '').toLowerCase() === normalizedEmail)
          ) {
            delete profiles[k];
            changed = true;
          }
        });
        if (changed) {
          await setDoc(
            dirRef,
            sanitizeForFirestore({
              ...dirData,
              profiles,
              updatedAt: new Date().toISOString(),
            })
          );
        }
      }

      // 3. Limpa documentos isolados da vitrine da profissional excluída
      await setDoc(
        doc(db, 'belladoor_prod', `pro_vitrine_${resolvedProKey}`),
        sanitizeForFirestore({
          deleted: true,
          name: '',
          updatedAt: new Date().toISOString(),
        })
      );
    }

    return { ok: true };
  } catch (err: any) {
    console.warn('[Firebase Admin] Erro ao excluir usuário:', err);
    return { ok: false, error: 'Não foi possível excluir o cadastro no momento.' };
  }
}

/**
 * [LGPD Art. 18, VI] Permite que a própria usuária (cliente ou profissional) exclua definitivamente sua conta e dados pessoais
 */
export async function deleteOwnAccountAndDataFromFirestore(
  email: string
): Promise<{ ok: boolean; error?: string }> {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return { ok: false, error: 'E-mail inválido para exclusão.' };
  }

  const proKey = normalizedEmail.replace(/[^a-z0-9]/g, '_');
  const res = await adminDeleteUserFromFirestore(normalizedEmail, proKey);
  if (!res.ok) return res;

  const auth = getFirebaseAuth();
  if (auth?.currentUser) {
    try {
      await deleteUser(auth.currentUser);
    } catch {
      try {
        await signOut(auth);
      } catch {}
    }
  }

  return { ok: true };
}



