import { 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc, 
  updateDoc,
  collection
} from 'firebase/firestore';
import { db, collections } from './firebaseConfig';
import { Referral, User } from '../types';

export class ReferralService {
  /**
   * Generates a clean, unique, memorable referral code
   * Format: BRK + 5 alphanumeric uppercase characters (e.g. BRK8W2Q)
   */
  generateReferralCode(prefix: string = 'BRK'): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit easily confused chars like 0, O, 1, I
    let randomPart = '';
    for (let i = 0; i < 5; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${randomPart}`.toUpperCase();
  }

  /**
   * Find a user by their unique referralCode
   */
  async findUserByReferralCode(referralCode: string): Promise<User | null> {
    if (!referralCode || !referralCode.trim()) return null;
    const cleanCode = referralCode.trim().toUpperCase();

    try {
      const q = query(collections.users, where('referralCode', '==', cleanCode));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return {
          ...userDoc.data(),
          id: userDoc.id
        } as User;
      }
      return null;
    } catch (error) {
      console.warn('Error querying user by referral code:', error);
      return null;
    }
  }

  /**
   * Ensure user has a valid referralCode assigned in Firestore.
   * If missing, generate and persist one.
   */
  async ensureReferralCode(user: User): Promise<string> {
    if (user.referralCode && user.referralCode.trim()) {
      return user.referralCode;
    }

    const newCode = this.generateReferralCode();
    try {
      const userRef = doc(collections.users, user.id);
      await updateDoc(userRef, { referralCode: newCode });
      user.referralCode = newCode;
    } catch (e) {
      console.warn('Could not update user referral code in Firestore:', e);
    }
    return newCode;
  }

  /**
   * Get the number of successful referrals for a given user
   */
  async getReferralCount(userId: string): Promise<number> {
    if (!userId) return 0;
    try {
      const q = query(collections.referrals, where('referrerUserId', '==', userId));
      const snap = await getDocs(q);
      return snap.size;
    } catch (error) {
      console.warn('Error getting referral count:', error);
      return 0;
    }
  }

  /**
   * Get all referral records for a given user
   */
  async getUserReferrals(userId: string): Promise<Referral[]> {
    if (!userId) return [];
    try {
      const q = query(collections.referrals, where('referrerUserId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({
        ...d.data(),
        id: d.id
      } as Referral));
    } catch (error) {
      console.warn('Error getting referrals list:', error);
      return [];
    }
  }

  /**
   * Records a new referral when a user signs up using a valid referral code.
   */
  async recordReferral(referrerUserId: string, newUserId: string, code: string): Promise<Referral> {
    const referralId = `ref_${newUserId}_${Date.now()}`;
    const referralDocRef = doc(collections.referrals, referralId);

    const referralData: Referral = {
      id: referralId,
      referrerUserId,
      referredUserId: newUserId,
      code: code.trim().toUpperCase(),
      bonusApplied: false,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    await setDoc(referralDocRef, referralData);
    return referralData;
  }
}

export const referralService = new ReferralService();
