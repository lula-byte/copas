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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = authInstance?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration (client is offline).');
      return false;
    }
    // Permission error or missing doc still confirms online reachability
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
