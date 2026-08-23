import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  initializeFirestore, 
  getFirestore, 
  Firestore, 
  collection, 
  CollectionReference, 
  DocumentData 
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Firebase configuration from provisioned environment
export const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
  firestoreDatabaseId: firebaseConfigJson.firestoreDatabaseId || '(default)'
};

// Initialize Firebase App singleton
export const app: FirebaseApp = getApps().length === 0 
  ? initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
    }) 
  : getApp();

// Initialize Firestore with custom Database ID and auto-detect long polling
const dbId = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, dbId);
} catch (e) {
  // If already initialized, get existing instance
  firestoreInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
}

export const db: Firestore = firestoreInstance;

// Initialize Firebase Authentication
export const auth: Auth = getAuth(app);

// Initialize Firebase Storage
export const storage: FirebaseStorage = getStorage(app);

// Operation types for standard error handling
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error Context: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Typed collection helper
const createCollection = <T = DocumentData>(collectionName: string) => {
  return collection(db, collectionName) as CollectionReference<T>;
};

// All 12 requested Firestore collections
export const collections = {
  users: createCollection('users'),
  categories: createCollection('categories'),
  subcategories: createCollection('subcategories'),
  products: createCollection('products'),
  orders: createCollection('orders'),
  orderItems: createCollection('orderItems'),
  addresses: createCollection('addresses'),
  favorites: createCollection('favorites'),
  coupons: createCollection('coupons'),
  offers: createCollection('offers'),
  notifications: createCollection('notifications'),
  referrals: createCollection('referrals'),
};
