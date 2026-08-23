import { 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db, collections } from './firebaseConfig';
import { Favorite, Product } from '../types';

export class FavoriteService {
  /**
   * Add a product to the user's favorites in Firebase Firestore
   */
  async addFavorite(userId: string, productId: string): Promise<Favorite> {
    if (!userId || !productId) {
      throw new Error('User ID and Product ID are required to add a favorite');
    }

    const favId = `fav_${userId}_${productId}`;
    const favRef = doc(collections.favorites, favId);

    const favData: Favorite = {
      id: favId,
      userId,
      productId,
      createdAt: new Date().toISOString()
    };

    await setDoc(favRef, favData, { merge: true });
    return favData;
  }

  /**
   * Remove a product from the user's favorites in Firebase Firestore
   */
  async removeFavorite(userId: string, productId: string): Promise<void> {
    if (!userId || !productId) return;

    const favId = `fav_${userId}_${productId}`;
    const favRef = doc(collections.favorites, favId);

    try {
      await deleteDoc(favRef);
    } catch (error) {
      console.warn('Error removing favorite from Firestore:', error);
    }
  }

  /**
   * Fetch all favorite product IDs for a given user from Firebase Firestore
   */
  async getUserFavoriteProductIds(userId: string): Promise<string[]> {
    if (!userId) return [];

    try {
      const q = query(collections.favorites, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => (doc.data() as Favorite).productId).filter(Boolean);
    } catch (error) {
      console.warn('Error getting user favorites from Firestore:', error);
      return [];
    }
  }

  /**
   * Syncs local favorites with Firestore when a user logs in.
   * Uploads any locally stored favorites to Firebase and retrieves server favorites.
   */
  async syncFavoritesOnLogin(userId: string, localProducts: Product[]): Promise<string[]> {
    if (!userId) return [];

    try {
      // 1. Get existing remote favorites
      const remoteProductIds = await this.getUserFavoriteProductIds(userId);
      const remoteSet = new Set(remoteProductIds);

      // 2. Upload any local items not yet in Firestore
      for (const prod of localProducts) {
        if (!remoteSet.has(prod.id)) {
          await this.addFavorite(userId, prod.id);
          remoteSet.add(prod.id);
        }
      }

      return Array.from(remoteSet);
    } catch (error) {
      console.warn('Error syncing favorites on login:', error);
      return localProducts.map(p => p.id);
    }
  }
}

export const favoriteService = new FavoriteService();
