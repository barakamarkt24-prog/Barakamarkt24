import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  CollectionReference, 
  DocumentData
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';

const getEnv = (key: string): string | undefined => {
  try {
    return (import.meta as any)?.env?.[key];
  } catch (e) {
    return undefined;
  }
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || firebaseConfigData?.apiKey || '',
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || firebaseConfigData?.authDomain || '',
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || firebaseConfigData?.projectId || '',
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || firebaseConfigData?.storageBucket || '',
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || firebaseConfigData?.messagingSenderId || '',
  appId: getEnv('VITE_FIREBASE_APP_ID') || firebaseConfigData?.appId || '',
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID') || firebaseConfigData?.measurementId || undefined
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
const databaseId = getEnv('VITE_FIRESTORE_DATABASE_ID') || firebaseConfigData?.firestoreDatabaseId || undefined;
export const db = getFirestore(app, databaseId);

// Initialize Auth & Storage
export const auth = getAuth(app);
export const storage = getStorage(app);

// Helper for type-safe Firestore Collections
const createCollection = <T = DocumentData>(collectionName: string) => {
  return collection(db, collectionName) as CollectionReference<T>;
};

export const collections = {
  users: createCollection('users'),
  products: createCollection('products'),
  categories: createCollection('categories'),
  subcategories: createCollection('subcategories'),
  orders: createCollection('orders'),
  orderItems: createCollection('orderItems'),
  coupons: createCollection('coupons'),
  offers: createCollection('offers'),
  notifications: createCollection('notifications'),
  settings: createCollection('settings'),
  banners: createCollection('banners'),
  favorites: createCollection('favorites'),
  addresses: createCollection('addresses'),
  cities: createCollection('cities'),
  branches: createCollection('branches'),
  deliveryZones: createCollection('deliveryZones'),
  referrals: createCollection('referrals'),
  reviews: createCollection('reviews')
};

export enum OperationType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list'
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string) {
  console.error(`Firestore ${operationType} error at ${path}:`, error);
}
