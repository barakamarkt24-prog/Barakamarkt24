/**
 * OneSignal & Median Push Notification Service for Barakamarkt24
 * Integrates Median Native OneSignal Bridge for Android/iOS apps
 * with Web SDK v16 fallback for desktop and mobile web browsers.
 */

import { User } from '../types';

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
    median?: any;
    gonative?: any;
  }
}

// Public OneSignal App ID from Vite environment (Safe client-side config)
export const ONESIGNAL_APP_ID = (((import.meta as any)?.env?.VITE_ONESIGNAL_APP_ID as string) || '').trim();

class OneSignalService {
  private isInitialized = false;
  private isInitializing = false;
  private currentSyncedUserId: string | null = null;

  /**
   * Detect if the web app is running inside a Median (GoNative) Native App wrapper
   */
  isMedianApp(): boolean {
    if (typeof window === 'undefined') return false;
    if (window.median || window.gonative) return true;
    const ua = navigator.userAgent || '';
    return ua.includes('median') || ua.includes('gonative');
  }

  /**
   * Get the active Median bridge reference if available
   */
  private getMedianBridge(): any {
    if (typeof window === 'undefined') return null;
    return window.median || window.gonative || null;
  }

  /**
   * Initialize OneSignal (Native Median Bridge or Web SDK)
   */
  async init(onNotificationClick?: (data: any) => void): Promise<void> {
    if (typeof window === 'undefined' || this.isInitialized || this.isInitializing) {
      return;
    }

    this.isInitializing = true;

    // A. Native Median Environment:
    if (this.isMedianApp()) {
      console.log('[OneSignalService] Running inside Median Native App shell. Activating Native OneSignal Bridge.');
      this.isInitialized = true;
      this.isInitializing = false;

      // Check / register status with Median Native Plugin
      const bridge = this.getMedianBridge();
      if (bridge?.onesignal) {
        try {
          if (typeof bridge.onesignal.register === 'function') {
            bridge.onesignal.register();
          }
          if (typeof bridge.onesignal.info === 'function') {
            bridge.onesignal.info().then((info: any) => {
              console.log('[OneSignalService] Median OneSignal Native Info:', info);
            }).catch(() => {});
          }
        } catch (e) {
          console.log('[OneSignalService] Median OneSignal register notice:', e);
        }
      }
      return;
    }

    // B. Standard Web Browser Environment:
    if (!ONESIGNAL_APP_ID) {
      console.log('[OneSignalService] Web OneSignal App ID not defined (VITE_ONESIGNAL_APP_ID).');
      this.isInitializing = false;
      return;
    }

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
   * Sync active Firebase user with OneSignal External ID & Tags
   * Handles both Median Native App Bridge & OneSignal Web SDK
   */
  async syncUser(user: User | null): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const bridge = this.getMedianBridge();
    const isMedian = this.isMedianApp();

    // 1. Sync with Median Native OneSignal Plugin (for Android & iOS Native Apps)
    if (isMedian && bridge?.onesignal) {
      try {
        if (user && user.id && user.id !== 'guest') {
          console.log(`[OneSignalService] Syncing Median Native OneSignal: externalId=${user.id}, role=${user.role || 'customer'}`);
          
          // Official Median OneSignal APIs
          if (typeof bridge.onesignal.login === 'function') {
            bridge.onesignal.login({ externalId: user.id });
          } else if (typeof bridge.onesignal.setExternalId === 'function') {
            bridge.onesignal.setExternalId({ externalId: user.id });
          }

          // Set role and identification tags in Median Native Plugin
          if (bridge.onesignal.tags && typeof bridge.onesignal.tags.setTags === 'function') {
            bridge.onesignal.tags.setTags({
              tags: {
                role: user.role || 'customer',
                userId: user.id,
                email: user.email || '',
                name: user.name || ''
              }
            });
          }
          this.currentSyncedUserId = user.id;
        } else {
          if (typeof bridge.onesignal.logout === 'function') {
            bridge.onesignal.logout();
          }
          this.currentSyncedUserId = null;
        }
      } catch (medianErr) {
        console.warn('[OneSignalService] Error syncing user with Median OneSignal:', medianErr);
      }
    }

    // 2. Sync with Web OneSignal SDK (if running in standard browser)
    if (!isMedian && ONESIGNAL_APP_ID) {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          if (user && user.id && user.id !== 'guest') {
            if (this.currentSyncedUserId !== user.id) {
              console.log(`[OneSignalService] Authenticating OneSignal Web session for Firebase UID: ${user.id} (${user.role})`);
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
              console.log('[OneSignalService] Logging out user from OneSignal Web session');
              await OneSignal.logout();
              this.currentSyncedUserId = null;
            }
          }
        } catch (err) {
          console.warn('[OneSignalService] Error syncing user with OneSignal Web:', err);
        }
      });
    }
  }

  /**
   * Request Push Notification Permission
   */
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    const bridge = this.getMedianBridge();
    if (this.isMedianApp() && bridge?.onesignal) {
      try {
        if (typeof bridge.onesignal.register === 'function') {
          bridge.onesignal.register();
          return true;
        }
        if (typeof bridge.onesignal.prompt === 'function') {
          bridge.onesignal.prompt();
          return true;
        }
      } catch (e) {
        console.warn('[OneSignalService] Error requesting Median push permission:', e);
      }
    }

    if (!('Notification' in window)) {
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
          console.warn('[OneSignalService] Error requesting permission via OneSignal Web:', e);
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
    if (typeof window === 'undefined') return false;
    if (this.isMedianApp()) return true;
    if (!('Notification' in window)) return false;
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

