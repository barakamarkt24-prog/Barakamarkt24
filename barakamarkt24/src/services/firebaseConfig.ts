import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  CollectionReference, 
  DocumentData,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
  measurementId: firebaseConfigData.measurementId
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
export const db = getFirestore(app, firebaseConfigData.firestoreDatabaseId || undefined);

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
