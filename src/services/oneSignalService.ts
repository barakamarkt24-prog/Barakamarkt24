/**
 * OneSignal Web Push Notification Service for Barakamarkt24
 * Integrates OneSignal Web SDK v16 with Firebase Auth UID & Role-based push targeting
 */

import { User } from '../types';

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

// Public OneSignal App ID from Vite environment (Safe client-side config)
export const ONESIGNAL_APP_ID = (((import.meta as any)?.env?.VITE_ONESIGNAL_APP_ID as string) || '').trim();

class OneSignalService {
  private isInitialized = false;
  private isInitializing = false;
  private currentSyncedUserId: string | null = null;

  /**
   * Initialize OneSignal Web SDK
   */
  async init(onNotificationClick?: (data: any) => void): Promise<void> {
    if (typeof window === 'undefined' || this.isInitialized || this.isInitializing) {
      return;
    }

    if (!ONESIGNAL_APP_ID) {
      console.log('[OneSignalService] OneSignal App ID is not yet defined in environment (VITE_ONESIGNAL_APP_ID).');
      return;
    }

    this.isInitializing = true;

    try {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            serviceWorkerParam: { scope: '/' },
            serviceWorkerPath: 'OneSignalSDKWorker.js',
            serviceWorkerUpdaterPath: 'OneSignalSDKUpdaterWorker.js',
            notifyButton: {
              enable: false
            }
          });

          this.isInitialized = true;
          this.isInitializing = false;
          console.log('[OneSignalService] OneSignal Web SDK v16 initialized successfully.');

          // Setup Notification Click listener for deep linking
          if (OneSignal.Notifications && typeof OneSignal.Notifications.addEventListener === 'function') {
            OneSignal.Notifications.addEventListener('click', (event: any) => {
              console.log('[OneSignalService] Push notification clicked:', event);
              const additionalData = event?.notification?.additionalData || {};
              if (onNotificationClick) {
                onNotificationClick(additionalData);
              }
            });
          }
        } catch (initErr) {
          console.warn('[OneSignalService] Error during OneSignal.init():', initErr);
          this.isInitializing = false;
        }
      });
    } catch (e) {
      console.warn('[OneSignalService] Failed to queue OneSignal deferred init:', e);
      this.isInitializing = false;
    }
  }

  /**
   * Sync active Firebase user with OneSignal (Login & Role Tags)
   */
  async syncUser(user: User | null): Promise<void> {
    if (typeof window === 'undefined' || !ONESIGNAL_APP_ID) {
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        if (user && user.id && user.id !== 'guest') {
          if (this.currentSyncedUserId !== user.id) {
            console.log(`[OneSignalService] Authenticating OneSignal session for Firebase UID: ${user.id} (${user.role})`);
            await OneSignal.login(user.id);
            this.currentSyncedUserId = user.id;
          }

          // Add user identification tags for role-based targeting
          if (OneSignal.User && typeof OneSignal.User.addTags === 'function') {
            await OneSignal.User.addTags({
              role: user.role || 'customer',
              userId: user.id,
              email: user.email || '',
              name: user.name || ''
            });
          }
        } else {
          if (this.currentSyncedUserId) {
            console.log('[OneSignalService] Logging out user from OneSignal session');
            await OneSignal.logout();
            this.currentSyncedUserId = null;
          }
        }
      } catch (err) {
        console.warn('[OneSignalService] Error syncing user with OneSignal:', err);
      }
    });
  }

  /**
   * Request Push Notification Permission
   */
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    return new Promise((resolve) => {
      if (!ONESIGNAL_APP_ID) {
        Notification.requestPermission().then((res) => {
          resolve(res === 'granted');
        }).catch(() => resolve(false));
        return;
      }

      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          if (OneSignal.Notifications && typeof OneSignal.Notifications.requestPermission === 'function') {
            const accepted = await OneSignal.Notifications.requestPermission();
            resolve(accepted === true || Notification.permission === 'granted');
          } else {
            const perm = await Notification.requestPermission();
            resolve(perm === 'granted');
          }
        } catch (e) {
          console.warn('[OneSignalService] Error requesting permission via OneSignal:', e);
          const perm = await Notification.requestPermission().catch(() => 'denied');
          resolve(perm === 'granted');
        }
      });
    });
  }

  /**
   * Check if push notifications are enabled
   */
  isPushEnabled(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    return Notification.permission === 'granted';
  }

  /**
   * Get current synced user ID
   */
  getSyncedUserId(): string | null {
    return this.currentSyncedUserId;
  }
}

export const oneSignalService = new OneSignalService();
