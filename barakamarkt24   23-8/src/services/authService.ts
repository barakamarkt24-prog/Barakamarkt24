import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, collections } from './firebaseConfig';
import { User } from '../types';
import { referralService } from './referralService';

export const ADMIN_EMAILS = [
  'admin@barakamarkt24.com',
  'admin@barakamarkt24.de',
  'erttqw71@gmail.com'
];

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

export const mapAuthErrorToArabic = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'صيغة البريد الإلكتروني غير صحيحة.';
    case 'auth/user-disabled':
      return 'تم تعطيل هذا الحساب. يرجى التواصل مع إدارة المتجر.';
    case 'auth/user-not-found':
      return 'لا يوجد حساب مسجل بهذا البريد الإلكتروني.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'كلمة المرور أو البريد الإلكتروني غير صحيح.';
    case 'auth/email-already-in-use':
      return 'البريد الإلكتروني مسجل مسبقاً، يمكنك تسجيل الدخول به.';
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة. يجب أن تتكون من 6 أحرف أو أرقام على الأقل.';
    case 'auth/operation-not-allowed':
      return 'تسجيل الدخول عبر البريد الإلكتروني غير مفعّل حالياً.';
    case 'auth/too-many-requests':
      return 'تم حظر المحاولات مؤقتاً لكثرة المحاولات الخاطئة. يرجى المحاولة بعد قليل.';
    case 'auth/network-request-failed':
      return 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
    default:
      return 'حدث خطأ غير متوقع أثناء العملية. يرجى إعادة المحاولة.';
  }
};

class AuthService {
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];
  private isInitialized = false;
  private authReadyPromise: Promise<User | null>;
  private resolveAuthReady!: (user: User | null) => void;

  constructor() {
    this.authReadyPromise = new Promise((resolve) => {
      this.resolveAuthReady = resolve;
    });
    this.initAuth();
  }

  private async initAuth() {
    // Explicitly enforce browser local persistence (persists across browser tabs and app restarts)
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (e) {
      console.warn('Firebase setPersistence warning:', e);
    }

    // Listen for real Firebase Auth state changes
    onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const userDocRef = doc(collections.users, fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as User;
            let userReferralCode = data.referralCode;
            if (!userReferralCode) {
              userReferralCode = referralService.generateReferralCode();
              try {
                await updateDoc(userDocRef, { referralCode: userReferralCode });
              } catch (err) {
                console.warn('Could not backfill referralCode:', err);
              }
            }

            this.currentUser = {
              ...data,
              id: fbUser.uid,
              referralCode: userReferralCode,
              role: (data.role === 'admin' || isSuperAdminEmail(fbUser.email)) ? 'admin' : 'customer'
            };
          } else {
            // Create user document if not exists
            const isAdmin = isSuperAdminEmail(fbUser.email);
            const generatedCode = referralService.generateReferralCode();
            const newUserProfile: User = {
              id: fbUser.uid,
              name: fbUser.displayName || (isAdmin ? 'مدير المتجر' : 'عميل بركة ماركت'),
              email: fbUser.email || '',
              phone: fbUser.phoneNumber || '',
              role: isAdmin ? 'admin' : 'customer',
              city: 'غرايفسفالد',
              address: '',
              referralCode: generatedCode,
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newUserProfile);
            this.currentUser = newUserProfile;
          }
        } catch (e) {
          console.warn('Firestore profile sync on auth state changed:', e);
          if (!this.currentUser) {
            this.currentUser = {
              id: fbUser.uid,
              name: fbUser.displayName || 'عميل بركة ماركت',
              email: fbUser.email || '',
              phone: fbUser.phoneNumber || '',
              role: isSuperAdminEmail(fbUser.email) ? 'admin' : 'customer',
              city: 'غرايفسفالد',
              address: '',
              referralCode: referralService.generateReferralCode()
            };
          }
        }
      } else {
        this.currentUser = null;
      }

      if (!this.isInitialized) {
        this.isInitialized = true;
        this.resolveAuthReady(this.currentUser ? { ...this.currentUser } : null);
      }
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb(this.currentUser ? { ...this.currentUser } : null));
  }

  public onUserChanged(cb: (user: User | null) => void) {
    this.listeners.push(cb);
    if (this.isInitialized) {
      cb(this.currentUser ? { ...this.currentUser } : null);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  public async waitForAuthReady(): Promise<User | null> {
    if (this.isInitialized) {
      return this.currentUser ? { ...this.currentUser } : null;
    }
    return this.authReadyPromise;
  }

  public getCurrentUser(): User | null {
    return this.currentUser ? { ...this.currentUser } : null;
  }

  public isAuthReady(): boolean {
    return this.isInitialized;
  }

  // 1. Firebase Email & Password Registration (Role is strictly customer)
  async register(name: string, email: string, phone: string, password: string, referralCodeInput?: string): Promise<User> {
    const cleanEmail = email.trim();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanReferralCode = referralCodeInput?.trim().toUpperCase() || '';

    let referrerUser: User | null = null;
    if (cleanReferralCode) {
      referrerUser = await referralService.findUserByReferralCode(cleanReferralCode);
      if (!referrerUser) {
        throw new Error('كود الدعوة المدخل غير صالح أو غير موجود.');
      }
      if (referrerUser.email.toLowerCase() === cleanEmail.toLowerCase()) {
        throw new Error('لا يمكنك استخدام كود الدعوة الخاص بك.');
      }
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;

      // Prevent using user's own ID as referrer
      if (referrerUser && referrerUser.id === fbUser.uid) {
        throw new Error('لا يمكنك استخدام كود الدعوة الخاص بك.');
      }

      // Update displayName on Firebase Auth profile
      try {
        await updateFirebaseProfile(fbUser, { displayName: cleanName });
      } catch (e) {
        console.warn('Error setting displayName in auth:', e);
      }

      const generatedMyReferralCode = referralService.generateReferralCode();

      // Assign role (admin if super admin email, otherwise customer)
      const role = isSuperAdminEmail(cleanEmail) ? 'admin' : 'customer';
      const newUser: User = {
        id: fbUser.uid,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        role,
        city: 'غرايفسفالد',
        address: '',
        referralCode: generatedMyReferralCode,
        ...(referrerUser ? { referredBy: referrerUser.id } : {}),
        createdAt: new Date().toISOString()
      };

      const userDocRef = doc(collections.users, fbUser.uid);
      await setDoc(userDocRef, newUser);

      // Record referral entry if valid referral code used
      if (referrerUser) {
        try {
          await referralService.recordReferral(referrerUser.id, fbUser.uid, cleanReferralCode);
        } catch (refErr) {
          console.warn('Could not record referral in Firestore:', refErr);
        }
      }

      this.currentUser = newUser;
      this.notifyListeners();
      return { ...this.currentUser };
    } catch (err: any) {
      if (err?.message && !err?.code) {
        throw err;
      }
      const errorMsg = mapAuthErrorToArabic(err?.code || '');
      const customError = new Error(errorMsg);
      (customError as any).code = err?.code;
      throw customError;
    }
  }

  // 2. Firebase Email & Password Login
  async login(email: string, password: string): Promise<User> {
    const cleanEmail = email.trim();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;
      
      const userDocRef = doc(collections.users, fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data() as User;
        let userReferralCode = data.referralCode;
        if (!userReferralCode) {
          userReferralCode = referralService.generateReferralCode();
          try {
            await updateDoc(userDocRef, { referralCode: userReferralCode });
          } catch (err) {
            console.warn('Could not backfill referralCode on login:', err);
          }
        }

        this.currentUser = {
          ...data,
          id: fbUser.uid,
          referralCode: userReferralCode,
          role: (data.role === 'admin' || isSuperAdminEmail(fbUser.email)) ? 'admin' : 'customer'
        };
      } else {
        const isAdmin = isSuperAdminEmail(fbUser.email);
        const generatedCode = referralService.generateReferralCode();
        const profile: User = {
          id: fbUser.uid,
          name: fbUser.displayName || cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: fbUser.phoneNumber || '',
          role: isAdmin ? 'admin' : 'customer',
          city: 'غرايفسفالد',
          address: '',
          referralCode: generatedCode,
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, profile);
        this.currentUser = profile;
      }

      this.notifyListeners();
      return { ...this.currentUser };
    } catch (err: any) {
      const errorMsg = mapAuthErrorToArabic(err?.code || '');
      const customError = new Error(errorMsg);
      (customError as any).code = err?.code;
      throw customError;
    }
  }

  // 3. Firebase Password Reset Recovery
  async sendPasswordReset(email: string): Promise<void> {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      throw new Error('يرجى إدخال البريد الإلكتروني لاستعادة كلمة المرور');
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err: any) {
      const errorMsg = mapAuthErrorToArabic(err?.code || '');
      const customError = new Error(errorMsg);
      (customError as any).code = err?.code;
      throw customError;
    }
  }

  // 4. Firebase Sign Out
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase logout error:', e);
    }
    this.currentUser = null;
    this.notifyListeners();
  }

  // 5. Update Profile (Name, Phone, Address, City) - Preserves 'customer' role strictly
  async updateProfile(updates: { name?: string; phone?: string; address?: string; city?: string }): Promise<User> {
    if (!this.currentUser) {
      throw new Error('يجب تسجيل الدخول أولاً لتعديل البيانات');
    }

    const sanitizedUpdates: Partial<User> = {};
    if (updates.name !== undefined) sanitizedUpdates.name = updates.name.trim();
    if (updates.phone !== undefined) sanitizedUpdates.phone = updates.phone.trim();
    if (updates.address !== undefined) sanitizedUpdates.address = updates.address.trim();
    if (updates.city !== undefined) sanitizedUpdates.city = updates.city.trim();

    // Never allow role modification by client update
    delete (sanitizedUpdates as any).role;

    try {
      const userDocRef = doc(collections.users, this.currentUser.id);
      await updateDoc(userDocRef, sanitizedUpdates);

      // If name changed and auth.currentUser exists, update display name
      if (auth.currentUser && sanitizedUpdates.name) {
        try {
          await updateFirebaseProfile(auth.currentUser, { displayName: sanitizedUpdates.name });
        } catch (e) {
          // Ignored
        }
      }
    } catch (e) {
      console.warn('Error updating profile in Firestore:', e);
      // Still update local object if offline or fallback
    }

    this.currentUser = {
      ...this.currentUser,
      ...sanitizedUpdates
    };

    this.notifyListeners();
    return { ...this.currentUser };
  }
}

export const authService = new AuthService();
