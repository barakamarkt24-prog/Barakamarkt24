import { 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  getDocs, 
  updateDoc,
  arrayUnion,
  arrayRemove,
  query, 
  where 
} from 'firebase/firestore';
import { db, collections } from './firebaseConfig';
import { Favorite, Product } from '../types';

export class FavoriteService {
  /**
   * Add a product to the user's favorites in Firebase Firestore.
   * Persists to both the users/{userId} document (favorites array) and the favorites collection.
   */
  async addFavorite(userId: string, productId: string): Promise<Favorite> {
    if (!userId || !productId) {
      throw new Error('User ID and Product ID are required to add a favorite');
    }

    const favId = `fav_${userId}_${productId}`;
    const favRef = doc(collections.favorites, favId);
    const userRef = doc(collections.users, userId);

    const favData: Favorite = {
      id: favId,
      userId,
      productId,
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Update favorites collection
      await setDoc(favRef, favData, { merge: true });
    } catch (e) {
      console.warn('Error setting document in favorites collection:', e);
    }

    try {
      // 2. Update users/{userId} favorites array
      await updateDoc(userRef, {
        favorites: arrayUnion(productId)
      });
    } catch (e) {
      // If user doc doesn't exist or doesn't have permissions, attempt merge setDoc
      try {
        await setDoc(userRef, { favorites: arrayUnion(productId) }, { merge: true });
      } catch (err) {
        console.warn('Error adding favorite to user document:', err);
      }
    }

    return favData;
  }

  /**
   * Remove a product from the user's favorites in Firebase Firestore.
   * Removes from both the users/{userId} document and the favorites collection.
   */
  async removeFavorite(userId: string, productId: string): Promise<void> {
    if (!userId || !productId) return;

    const favId = `fav_${userId}_${productId}`;
    const favRef = doc(collections.favorites, favId);
    const userRef = doc(collections.users, userId);

    try {
      await deleteDoc(favRef);
    } catch (error) {
      console.warn('Error removing favorite from Firestore favorites collection:', error);
    }

    try {
      await updateDoc(userRef, {
        favorites: arrayRemove(productId)
      });
    } catch (error) {
      console.warn('Error removing favorite from user document:', error);
    }
  }

  /**
   * Fetch all favorite product IDs for a given user from Firebase Firestore.
   * Reads from users/{userId}.favorites array as well as the favorites collection.
   */
  async getUserFavoriteProductIds(userId: string): Promise<string[]> {
    if (!userId) return [];

    const idSet = new Set<string>();

    // 1. Read from users/{userId} favorites array
    try {
      const userRef = doc(collections.users, userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (Array.isArray(userData?.favorites)) {
          userData.favorites.forEach((id: any) => {
            if (typeof id === 'string' && id.trim()) {
              idSet.add(id.trim());
            }
          });
        }
      }
    } catch (e) {
      console.warn('Error reading favorites array from user document:', e);
    }

    // 2. Read from favorites collection
    try {
      const q = query(collections.favorites, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data() as Favorite;
        if (data?.productId) {
          idSet.add(data.productId);
        }
      });
    } catch (error) {
      console.warn('Error getting user favorites collection from Firestore:', error);
    }

    return Array.from(idSet);
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
        if (prod?.id && !remoteSet.has(prod.id)) {
          await this.addFavorite(userId, prod.id);
          remoteSet.add(prod.id);
        }
      }

      return Array.from(remoteSet);
    } catch (error) {
      console.warn('Error syncing favorites on login:', error);
      return localProducts.map(p => p.id).filter(Boolean);
    }
  }
}

export const favoriteService = new FavoriteService();

