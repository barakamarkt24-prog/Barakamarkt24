import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { app, collections } from './firebaseConfig';

export interface FCMNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
}

export class FCMService {
  private messagingInstance: Messaging | null = null;
  private isInitialized = false;

  /**
   * Check if Firebase Cloud Messaging is supported in this browser/device environment
   */
  async checkSupport(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      const supported = await isSupported();
      return supported;
    } catch {
      return false;
    }
  }

  /**
   * Lazily initialize Messaging instance
   */
  private async getMessagingClient(): Promise<Messaging | null> {
    if (this.messagingInstance) return this.messagingInstance;
    const supported = await this.checkSupport();
    if (!supported) {
      console.log('Firebase Cloud Messaging is not supported in this environment (e.g. iframe / unsupported browser).');
      return null;
    }

    try {
      this.messagingInstance = getMessaging(app);
      this.isInitialized = true;
      return this.messagingInstance;
    } catch (e) {
      console.warn('Could not initialize Firebase Messaging client:', e);
      return null;
    }
  }

  /**
   * Request push notification permission from user and retrieve FCM Device Token
   * @param vapidKey Optional Web Push certificate public key (from Firebase Console)
   * @param userId Optional user ID to associate device token with in Firestore
   */
  async requestPermissionAndGetToken(vapidKey?: string, userId?: string): Promise<string | null> {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return null;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission was not granted by user:', permission);
        return null;
      }

      const messaging = await this.getMessagingClient();
      if (!messaging) return null;

      // Retrieve device registration token
      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey || undefined
      });

      if (currentToken) {
        console.log('FCM Device Token successfully obtained:', currentToken);
        
        // If user ID is supplied, store token in user profile in Firestore for future targeted push
        if (userId) {
          try {
            const userRef = doc(collections.users, userId);
            await updateDoc(userRef, {
              fcmTokens: arrayUnion(currentToken),
              lastTokenUpdate: new Date().toISOString()
            });
          } catch (err) {
            console.warn('Failed to save FCM token to Firestore user profile:', err);
          }
        }

        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
        return null;
      }
    } catch (error) {
      console.warn('An error occurred while retrieving FCM token:', error);
      return null;
    }
  }

  /**
   * Listen to foreground notifications when app is active in tab
   */
  async listenToForegroundMessages(onMessageReceived: (payload: FCMNotificationPayload) => void): Promise<(() => void) | null> {
    try {
      const messaging = await this.getMessagingClient();
      if (!messaging) return null;

      const unsubscribe = onMessage(messaging, (payload) => {
        const notif: FCMNotificationPayload = {
          title: payload.notification?.title || 'بركة ماركت 24',
          body: payload.notification?.body || '',
          icon: payload.notification?.icon || '/favicon.ico',
          data: payload.data
        };
        onMessageReceived(notif);
      });

      return unsubscribe;
    } catch (err) {
      console.warn('Error attaching foreground message listener:', err);
      return null;
    }
  }

  /**
   * Show a local browser notification when permitted
   */
  showBrowserNotification(title: string, options?: NotificationOptions): void {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options
        });
      } catch (e) {
        console.warn('Could not display browser notification:', e);
      }
    }
  }
}

export const fcmService = new FCMService();
