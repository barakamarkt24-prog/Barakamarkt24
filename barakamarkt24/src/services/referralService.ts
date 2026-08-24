import { doc, getDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { db, collections } from './firebaseConfig';
import { User } from '../types';

export const referralService = {
  generateReferralCode(name?: string): string {
    const cleanName = (name || 'BM').replace(/\s+/g, '').slice(0, 4).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}${random}`;
  },

  async ensureReferralCode(user: Partial<User> & { id: string }): Promise<string> {
    if (user.referralCode) return user.referralCode;

    const newCode = this.generateReferralCode(user.name);
    try {
      const userRef = doc(collections.users, user.id);
      await updateDoc(userRef, { referralCode: newCode });
    } catch (e) {
      console.warn('Could not persist referralCode in Firestore:', e);
    }
    return newCode;
  },

  async getReferralCount(userId: string): Promise<number> {
    try {
      const q = query(collections.users, where('referredBy', '==', userId));
      const snap = await getDocs(q);
      return snap.size;
    } catch (e) {
      console.warn('Could not fetch referral count:', e);
      return 0;
    }
  },

  async getReferralByCode(code: string) {
    try {
      const q = query(collections.users, where('referralCode', '==', code.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data();
      }
    } catch (e) {
      console.warn('getReferralByCode error:', e);
    }
    return null;
  },

  async findUserByReferralCode(code: string): Promise<any | null> {
    return this.getReferralByCode(code);
  },

  async recordReferral(referrerId: string, refereeId: string, referralCode: string) {
    try {
      const refereeRef = doc(collections.users, refereeId);
      await updateDoc(refereeRef, { referredBy: referrerId });
      return true;
    } catch (e) {
      console.warn('recordReferral error:', e);
      return false;
    }
  },

  async applyReferral(referrerId: string, refereeId: string) {
    return this.recordReferral(referrerId, refereeId, '');
  }
};

