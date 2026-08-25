import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  Unsubscribe 
} from 'firebase/firestore';
import { app, db, collections, auth } from './firebaseConfig';
import { AppNotification, User } from '../types';

export interface UserNotificationPreferences {
  orderUpdates: boolean;
  offers: boolean;
  systemAlerts: boolean;
  soundEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: UserNotificationPreferences = {
  orderUpdates: true,
  offers: true,
  systemAlerts: true,
  soundEnabled: true
};

const STORAGE_KEY_FCM_TOKEN = 'baraka_fcm_token_v1';
const STORAGE_KEY_NOTIF_PREFS = 'baraka_notif_prefs_v1';

class FCMService {
  private messagingInstance: Messaging | null = null;
  private isFCMSupported: boolean | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private audioContext: AudioContext | null = null;
  private activeToken: string | null = null;

  constructor() {
    try {
      this.activeToken = localStorage.getItem(STORAGE_KEY_FCM_TOKEN);
    } catch {
      this.activeToken = null;
    }
  }

  // Check if browser/environment supports Notification & Web Push
  async checkSupport(): Promise<boolean> {
    if (this.isFCMSupported !== null) {
      return this.isFCMSupported;
    }

    try {
      if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
        this.isFCMSupported = false;
        return false;
      }
      const supported = await isSupported();
      this.isFCMSupported = supported;
      return supported;
    } catch (e) {
      console.warn('[FCMService] FCM support check error:', e);
      this.isFCMSupported = false;
      return false;
    }
  }

  // Initialize Firebase Messaging and Service Worker
  async initFCM(onForegroundMessage?: (payload: any) => void): Promise<Messaging | null> {
    const supported = await this.checkSupport();
    if (!supported) {
      return null;
    }

    try {
      if (!this.messagingInstance) {
        this.messagingInstance = getMessaging(app);
      }

      // Register Service Worker
      if ('serviceWorker' in navigator && !this.swRegistration) {
        try {
          this.swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/'
          });
          console.log('[FCMService] Service Worker registered successfully with scope:', this.swRegistration.scope);
        } catch (swErr) {
          console.warn('[FCMService] Service Worker registration notice:', swErr);
        }
      }

      // Listen for foreground FCM messages
      if (this.messagingInstance && onForegroundMessage) {
        onMessage(this.messagingInstance, (payload) => {
          console.log('[FCMService] Foreground message received:', payload);
          this.playNotificationSound('order');
          onForegroundMessage(payload);
        });
      }

      return this.messagingInstance;
    } catch (e) {
      console.warn('[FCMService] Failed to initialize FCM:', e);
      return null;
    }
  }

  // Get current browser permission state
  getPermissionState(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  // Request push notification permission and obtain FCM token
  async requestPermissionAndGetToken(vapidKey?: string, user?: User | null): Promise<string | null> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('[FCMService] Notification permission was not granted:', permission);
        return null;
      }

      const supported = await this.checkSupport();
      if (!supported) {
        // Even if full FCM is restricted, browser Notification permission was granted
        return 'browser_permission_granted';
      }

      const messaging = await this.initFCM();
      if (!messaging) {
        return 'browser_permission_granted';
      }

      let registration = this.swRegistration;
      if (!registration && 'serviceWorker' in navigator) {
        registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js') || undefined;
      }

      // Obtain FCM Device Token
      const token = await getToken(messaging, {
        vapidKey: vapidKey || undefined,
        serviceWorkerRegistration: registration || undefined
      });

      if (token) {
        this.activeToken = token;
        try {
          localStorage.setItem(STORAGE_KEY_FCM_TOKEN, token);
        } catch {
          // ignore
        }

        // Save token & device metadata in Firestore
        await this.saveTokenToFirestore(token, user);
        console.log('[FCMService] Device FCM token obtained and registered:', token.slice(0, 15) + '...');
        return token;
      }

      return 'browser_permission_granted';
    } catch (error) {
      console.warn('[FCMService] Error requesting notification token:', error);
      return null;
    }
  }

  // Persist FCM Token to Firestore fcmTokens collection
  async saveTokenToFirestore(token: string, user?: User | null): Promise<void> {
    try {
      const tokenDocId = `token_${token.slice(-36).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const tokenRef = doc(collections.fcmTokens, tokenDocId);

      const userId = user?.id || auth.currentUser?.uid || 'guest';
      const userEmail = user?.email || auth.currentUser?.email || '';
      const role = user?.role || (userEmail && (
        userEmail === 'admin@barakamarkt24.com' ||
        userEmail === 'admin@barakamarkt24.de' ||
        userEmail === 'erttqw71@gmail.com' ||
        userEmail === 'barakamarkt24@gmail.com'
      ) ? 'admin' : 'customer');
      const now = new Date().toISOString();

      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(userAgent);
      const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

      const prefs = this.getNotificationPreferences();

      await setDoc(tokenRef, {
        id: tokenDocId,
        token: token,
        userId: userId,
        userEmail: userEmail,
        role: role,
        deviceType: deviceType,
        platform: typeof navigator !== 'undefined' ? (navigator as any).platform || 'web' : 'web',
        userAgent: userAgent.slice(0, 200),
        enabled: true,
        settings: {
          orderUpdates: prefs.orderUpdates,
          offers: prefs.offers,
          systemAlerts: prefs.systemAlerts
        },
        createdAt: now,
        updatedAt: now,
        lastActive: now
      }, { merge: true });

      console.log(`[FCMService] FCM Token registered in Firestore for user: ${userId} (${role})`);
    } catch (e) {
      console.warn('[FCMService] Could not save FCM token to Firestore:', e);
    }
  }

  // Remove token when logging out or revoking notifications
  async removeTokenFromFirestore(token?: string): Promise<void> {
    const t = token || this.activeToken;
    if (!t) return;

    try {
      const tokenDocId = `token_${t.slice(-36).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const tokenRef = doc(collections.fcmTokens, tokenDocId);
      await deleteDoc(tokenRef);
      try {
        localStorage.removeItem(STORAGE_KEY_FCM_TOKEN);
      } catch {}
      this.activeToken = null;
    } catch (e) {
      console.warn('[FCMService] Error removing token from Firestore:', e);
    }
  }

  // Get user notification preferences from local storage or defaults
  getNotificationPreferences(): UserNotificationPreferences {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIF_PREFS);
      if (saved) {
        return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  // Save notification preferences
  saveNotificationPreferences(prefs: Partial<UserNotificationPreferences>, user?: User | null): UserNotificationPreferences {
    const current = this.getNotificationPreferences();
    const updated = { ...current, ...prefs };
    try {
      localStorage.setItem(STORAGE_KEY_NOTIF_PREFS, JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (this.activeToken && user) {
      this.saveTokenToFirestore(this.activeToken, user);
    }

    return updated;
  }

  // Display a local browser system notification if permissions are granted
  showLocalNotification(title: string, options?: NotificationOptions & { sound?: boolean; url?: string }): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          dir: 'rtl',
          lang: 'ar',
          ...options
        });

        if (options?.url) {
          notif.onclick = () => {
            window.focus();
            if (options.url && options.url !== window.location.href) {
              window.location.href = options.url;
            }
          };
        }

        if (options?.sound !== false) {
          this.playNotificationSound('order');
        }
      } catch (e) {
        // In mobile browsers Service Worker showNotification is required
        if (this.swRegistration) {
          this.swRegistration.showNotification(title, {
            icon: '/icons/icon-192x192.png',
            dir: 'rtl',
            lang: 'ar',
            ...options
          });
        }
      }
    }
  }

  // Synthesize pleasant acoustic chime audio using Web Audio API
  playNotificationSound(type: 'order' | 'driver' | 'promo' | 'chime' = 'order'): void {
    const prefs = this.getNotificationPreferences();
    if (!prefs.soundEnabled) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      const ctx = this.audioContext;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      if (type === 'order') {
        // High-energy positive triad (C5 -> E5 -> G5)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.12);
          gain.gain.setValueAtTime(0.25, now + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.005, now + i * 0.12 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.35);
        });
      } else if (type === 'driver') {
        // Distinct alert two-tone (A5 -> D6)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(880, now);
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.25);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1174.66, now + 0.15);
        gain2.gain.setValueAtTime(0.35, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.5);
      } else {
        // Gentle chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      console.warn('[FCMService] Web Audio sound synthesis notice:', e);
    }
  }

  // Subscribe to real-time notifications in Firestore for active user
  subscribeToUserNotifications(
    userId: string,
    role: 'customer' | 'admin' | 'driver',
    onNotification: (notifications: AppNotification[], newIncoming?: AppNotification) => void
  ): Unsubscribe {
    try {
      let q = query(
        collections.notifications,
        where('userId', 'in', [userId, 'all', role === 'admin' ? 'admin' : role === 'driver' ? 'driver' : 'customer'])
      );

      let isFirstLoad = true;
      const seenIds = new Set<string>();
      const startTime = Date.now();

      return onSnapshot(q, (snapshot) => {
        const notifs: AppNotification[] = snapshot.docs.map(d => {
          const data = d.data() as any;
          return {
            id: d.id,
            userId: data.userId || '',
            title: data.title || '',
            message: data.message || '',
            read: Boolean(data.read),
            createdAt: data.createdAt || '',
            type: data.type || 'order',
            targetOrderId: data.targetOrderId || data.orderId || '',
            orderId: data.orderId || data.targetOrderId || ''
          };
        });

        // Sort descending by id or createdAt
        notifs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        if (isFirstLoad) {
          snapshot.docs.forEach(docSnap => seenIds.add(docSnap.id));
          isFirstLoad = false;
          onNotification(notifs);
        } else {
          let latestIncoming: AppNotification | undefined;
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added' && !seenIds.has(change.doc.id)) {
              seenIds.add(change.doc.id);
              const data = change.doc.data() as any;
              latestIncoming = {
                id: change.doc.id,
                userId: data.userId || '',
                title: data.title || '',
                message: data.message || '',
                read: Boolean(data.read),
                createdAt: data.createdAt || '',
                type: data.type || 'order',
                targetOrderId: data.targetOrderId || data.orderId || '',
                orderId: data.orderId || data.targetOrderId || ''
              };
            }
          });

          if (latestIncoming) {
            // Play notification sound
            this.playNotificationSound(latestIncoming.type === 'order' ? 'order' : 'promo');
            // Show browser notification if background or permitted
            this.showLocalNotification(latestIncoming.title, {
              body: latestIncoming.message,
              data: {
                orderId: latestIncoming.orderId,
                type: latestIncoming.type
              }
            });
          }

          onNotification(notifs, latestIncoming);
        }
      }, (err) => {
        console.warn('[FCMService] Realtime notifications listener error:', err);
      });
    } catch (e) {
      console.warn('[FCMService] Failed to attach notification listener:', e);
      return () => {};
    }
  }

  // Create an in-app & push notification in Firestore
  async sendNotification(notification: {
    userId: string;
    title: string;
    message: string;
    type?: 'order' | 'promo' | 'system';
    orderId?: string;
  }): Promise<void> {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })} - ${now.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}`;
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const docRef = doc(collections.notifications, notifId);
      await setDoc(docRef, {
        id: notifId,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'order',
        orderId: notification.orderId || '',
        targetOrderId: notification.orderId || '',
        read: false,
        createdAt: formattedDate,
        timestamp: now.toISOString()
      });

      // Dispatch backend push API in background
      try {
        fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: notification.userId,
            title: notification.title,
            body: notification.message,
            orderId: notification.orderId,
            type: notification.type || 'order'
          })
        }).catch(() => {});
      } catch {
        // Non-blocking
      }
    } catch (e) {
      console.warn('[FCMService] Could not persist notification to Firestore:', e);
    }
  }

  // Mark a notification as read
  async markNotificationAsRead(notifId: string): Promise<void> {
    try {
      const docRef = doc(collections.notifications, notifId);
      await updateDoc(docRef, { read: true });
    } catch (e) {
      console.warn('[FCMService] Failed to mark notification as read:', e);
    }
  }

  // Send test push notification
  async triggerTestNotification(role: 'admin' | 'driver' | 'customer' = 'customer'): Promise<boolean> {
    const permission = this.getPermissionState();
    if (permission !== 'granted') {
      const result = await this.requestPermissionAndGetToken();
      if (!result) return false;
    }

    const testTitles: Record<string, string> = {
      admin: '🔔 إشعار تجريبي للمشرف — طلب جديد #ORD-998811',
      driver: '🚚 إشعار تجريبي للسائق — طلب توصيل جاهز في غرايفسفالد',
      customer: '🎉 إشعار تجريبي — خصم 15% على جميع منتجات بركة ماركت 24'
    };

    const testBodies: Record<string, string> = {
      admin: 'طلب جديد بقيمة €48.50 من العميل أحمد الأحمد (الدفع عند الاستلام).',
      driver: 'تم تعيين طلب جديد لك في شارع Lange Str. 22، غرايفسفالد.',
      customer: 'استخدم كود الخصم BARAKA15 للحصول على تخفيض فوري على طلبك القادم!'
    };

    const title = testTitles[role] || testTitles.customer;
    const body = testBodies[role] || testBodies.customer;

    // 1. Play audio chime
    this.playNotificationSound(role === 'driver' ? 'driver' : 'order');

    // 2. Show native browser notification
    this.showLocalNotification(title, {
      body,
      tag: `test-notif-${Date.now()}`
    });

    // 3. Write to Firestore notifications collection
    const currentUserId = auth.currentUser?.uid || 'guest';
    await this.sendNotification({
      userId: currentUserId,
      title,
      message: body,
      type: role === 'admin' ? 'order' : role === 'driver' ? 'order' : 'promo'
    });

    return true;
  }
}

export const fcmService = new FCMService();
