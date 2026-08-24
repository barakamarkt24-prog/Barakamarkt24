import { 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { collections } from './firebaseConfig';
import { 
  Address, 
  Favorite, 
  Coupon, 
  Offer, 
  AppNotification, 
  Referral 
} from '../types';

class StoreExtrasService {
  
  // --- Addresses Collection ---

  async getUserAddresses(userId: string): Promise<Address[]> {
    try {
      const q = query(collections.addresses, where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...(d.data() as Address), id: d.id }));
    } catch (e) {
      console.warn('Error getting addresses:', e);
      return [];
    }
  }

  async saveAddress(addressData: Omit<Address, 'id'>): Promise<Address> {
    const id = `addr-${Date.now()}`;
    const address: Address = { ...addressData, id };
    try {
      const docRef = doc(collections.addresses, id);
      await setDoc(docRef, address);
    } catch (e) {
      console.warn('Error saving address to Firestore:', e);
    }
    return address;
  }

  // --- Favorites Collection ---

  async getUserFavorites(userId: string): Promise<string[]> {
    try {
      const q = query(collections.favorites, where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => (d.data() as Favorite).productId);
    } catch (e) {
      return [];
    }
  }

  async addFavorite(userId: string, productId: string): Promise<void> {
    const id = `fav_${userId}_${productId}`;
    try {
      const docRef = doc(collections.favorites, id);
      await setDoc(docRef, {
        id,
        userId,
        productId,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Error adding favorite:', e);
    }
  }

  async removeFavorite(userId: string, productId: string): Promise<void> {
    const id = `fav_${userId}_${productId}`;
    try {
      const docRef = doc(collections.favorites, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Error removing favorite:', e);
    }
  }

  // --- Coupons Collection ---

  async getActiveCoupons(): Promise<Coupon[]> {
    try {
      const snap = await getDocs(collections.coupons);
      if (!snap.empty) {
        return snap.docs
          .map(d => ({ ...(d.data() as Coupon), id: d.id }))
          .filter(c => c.isActive);
      }
    } catch (e) {
      console.warn('Error getting coupons:', e);
    }
    // Default welcome promo coupon
    return [
      {
        id: 'coupon-baraka10',
        code: 'BARAKA10',
        discountPercent: 10,
        minSpend: 25,
        validUntil: '2026-12-31',
        isActive: true,
        descriptionAr: 'خصم 10% على كافة المونة والبقالية'
      }
    ];
  }

  async validateCoupon(code: string, subtotal: number): Promise<{ valid: boolean; discount: number; message: string }> {
    const coupons = await this.getActiveCoupons();
    const coupon = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
    
    if (!coupon) {
      return { valid: false, discount: 0, message: 'كوبون الخصم غير صحيح أو منتهي الصلاحية' };
    }

    if (subtotal < coupon.minSpend) {
      return { valid: false, discount: 0, message: `الحد الأدنى لتطبيق هذا الكوبون هو €${coupon.minSpend}` };
    }

    let discount = 0;
    if (coupon.discountPercent) {
      discount = (subtotal * coupon.discountPercent) / 100;
    } else if (coupon.discountAmount) {
      discount = coupon.discountAmount;
    }

    return { valid: true, discount, message: `تم تفعيل خصم ${coupon.descriptionAr}` };
  }

  // --- Offers Collection ---

  async getActiveOffers(): Promise<Offer[]> {
    try {
      const snap = await getDocs(collections.offers);
      if (!snap.empty) {
        return snap.docs
          .map(d => ({ ...(d.data() as Offer), id: d.id }))
          .filter(o => o.active);
      }
    } catch (e) {
      console.warn('Error getting offers from Firestore:', e);
    }
    return [];
  }

  // --- Notifications Collection ---

  async getUserNotifications(userId: string): Promise<AppNotification[]> {
    try {
      const q = query(collections.notifications, where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...(d.data() as AppNotification), id: d.id }));
    } catch (e) {
      return [];
    }
  }

  // --- Referrals Collection ---

  async getReferralByCode(code: string): Promise<Referral | null> {
    try {
      const q = query(collections.referrals, where('code', '==', code));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { ...(snap.docs[0].data() as Referral), id: snap.docs[0].id };
      }
    } catch (e) {
      // Ignored
    }
    return null;
  }
}

export const storeExtrasService = new StoreExtrasService();
