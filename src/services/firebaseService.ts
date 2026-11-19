import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'remixed-project-id' &&
    firebaseConfig.apiKey &&
    firebaseConfig.firestoreDatabaseId
);

export const firebaseProjectId = firebaseConfig.projectId || '';

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  authInstance = getAuth(app);
}

export const db = dbInstance as Firestore;
export const auth = authInstance as Auth;

function sanitizeSensitiveText(text: string): string {
  return text
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[REDACTED_KEY]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .trim();
}

export function formatFirebaseUserError(
  error: unknown,
  fallbackMessage: string
): string {
  let rawMessage = '';
  let errorCode = '';
  let operationType = '';
  let path = '';

  if (error && typeof error === 'object' && 'code' in error) {
    const codeVal = (error as { code?: unknown }).code;
    if (typeof codeVal === 'string') {
      errorCode = codeVal;
    }
  }

  const msg = error instanceof Error ? error.message : String(error || '');
  try {
    const parsed = JSON.parse(msg) as Partial<FirestoreErrorInfo>;
    if (parsed && typeof parsed.error === 'string') {
      rawMessage = parsed.error;
      operationType = parsed.operationType || '';
      path = parsed.path || '';
    } else {
      rawMessage = msg;
    }
  } catch {
    rawMessage = msg;
  }

  const lower = `${errorCode} ${rawMessage}`.toLowerCase();
  const contextSuffix =
    operationType && path ? ` (operasi: ${operationType} pada ${path})` : '';

  if (
    lower.includes('permission-denied') ||
    lower.includes('missing or insufficient permissions')
  ) {
    return `Izin akses Firestore ditolak [permission-denied]${contextSuffix}. Pastikan Firestore Security Rules terbaru sudah aktif dan sesi autentikasi valid.`;
  }

  if (lower.includes('unauthenticated') || lower.includes('auth/')) {
    return `Sesi autentikasi Firebase belum valid [${errorCode || 'unauthenticated'}]. Muat ulang halaman atau pastikan Anonymous Authentication aktif.`;
  }

  if (
    lower.includes('unavailable') ||
    lower.includes('client is offline') ||
    lower.includes('network') ||
    lower.includes('failed to fetch')
  ) {
    return `Koneksi ke server Firestore terputus atau offline [unavailable]. Periksa koneksi internet Anda lalu coba lagi.`;
  }

  if (lower.includes('not-found') || lower.includes('does not exist')) {
    return `Database atau dokumen Firestore tidak ditemukan [not-found]${contextSuffix}. Periksa ID database Firestore pada konfigurasi proyek.`;
  }

  if (lower.includes('failed-precondition')) {
    return `Prasyarat operasi Firestore belum terpenuhi [failed-precondition]${contextSuffix}.`;
  }

  if (lower.includes('resource-exhausted') || lower.includes('quota')) {
    return `Batas kuota permintaan Firestore tercapai sementara [resource-exhausted]. Coba lagi beberapa saat.`;
  }

  if (lower.includes('deadline-exceeded') || lower.includes('aborted')) {
    return `Permintaan ke Firestore habis waktu atau bentrok sementara [${errorCode || 'timeout'}]. Silakan coba lagi.`;
  }

  const safeDetail = sanitizeSensitiveText(rawMessage);
  if (safeDetail) {
    return `${fallbackMessage} Detail: ${safeDetail.slice(0, 180)}`;
  }

  return fallbackMessage;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = authInstance?.currentUser;
  const rawErrMsg = error instanceof Error ? error.message : String(error);
  const errCode =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';
  const combinedError =
    errCode && !rawErrMsg.includes(errCode)
      ? `[${errCode}] ${rawErrMsg}`
      : rawErrMsg;

  const errInfo: FirestoreErrorInfo = {
    error: sanitizeSensitiveText(combinedError),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<boolean> {
  if (!dbInstance) return false;
  try {
    await getDocFromServer(doc(dbInstance, 'test', 'connection'));
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code?: unknown }).code || '')
        : '';

    if (code === 'unavailable' || msg.includes('the client is offline')) {
      console.error('Please check your Firebase configuration (client is offline).');
      return false;
    }
    if (code === 'not-found' || msg.includes('does not exist')) {
      console.error('Firestore database ID was not found:', msg);
      return false;
    }
    if (code === 'permission-denied') {
      console.warn('Firestore connection check returned permission-denied:', msg);
      return true;
    }
    // Missing doc or other server responses still confirm online reachability
    return true;
  }
}

export async function ensureAnonymousSession(): Promise<{
  user: User | null;
  anonymousDisabled: boolean;
  errorMessage: string | null;
}> {
  if (!authInstance || !isFirebaseConfigured) {
    return {
      user: null,
      anonymousDisabled: false,
      errorMessage: 'Konfigurasi Firebase belum tersedia.',
    };
  }

  // Wait for initial auth state hydration from IndexedDB
  const existingUser = await new Promise<User | null>((resolve) => {
    const unsub = onAuthStateChanged(authInstance!, (u) => {
      unsub();
      resolve(u);
    });
  });

  if (existingUser) {
    await testFirestoreConnection();
    return { user: existingUser, anonymousDisabled: false, errorMessage: null };
  }

  try {
    const cred = await signInAnonymously(authInstance);
    await testFirestoreConnection();
    return { user: cred.user, anonymousDisabled: false, errorMessage: null };
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code || '';
    if (
      code === 'auth/operation-not-allowed' ||
      code === 'auth/admin-restricted-operation'
    ) {
      return {
        user: null,
        anonymousDisabled: true,
        errorMessage:
          'Anonymous Authentication belum diaktifkan di Firebase Console proyek ini.',
      };
    }
    return {
      user: null,
      anonymousDisabled: false,
      errorMessage:
        error instanceof Error ? error.message : 'Gagal terhubung ke Firebase Auth.',
    };
  }
}

export async function signInWithGoogleFallback(): Promise<User> {
  if (!authInstance) {
    throw new Error('Firebase Auth belum terinisialisasi.');
  }
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(authInstance, provider);
  await testFirestoreConnection();
  return result.user;
}
