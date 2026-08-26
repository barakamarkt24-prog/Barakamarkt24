import * as admin from "firebase-admin";
import { cert, applicationDefault, getApps, initializeApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getMessaging, Messaging, Message } from "firebase-admin/messaging";
import { GoogleAuth } from "google-auth-library";
import fs from "fs";
import path from "path";

// Load configuration details from firebase-applet-config.json
let firebaseConfigData: Record<string, any> = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfigData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch (e) {
  console.warn("[FirebaseAdmin] Could not read firebase-applet-config.json:", e);
}

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || firebaseConfigData.projectId || "gen-lang-client-0509797903";

// Lazy initialized Firebase Admin App & Firestore
let adminAppInstance: App | null = null;
let adminFirestoreInstance: Firestore | null = null;
let adminMessagingInstance: Messaging | null = null;
let googleAuthClient: GoogleAuth | null = null;

export function getFirebaseAdminApp(): App | null {
  if (adminAppInstance) {
    return adminAppInstance;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminAppInstance = existingApps[0]!;
    return adminAppInstance;
  }

  try {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      credential = cert(serviceAccount);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      credential = applicationDefault();
    } else {
      // In Google Cloud Run / AI Studio container environment, application default credentials might be available
      try {
        credential = applicationDefault();
      } catch {
        credential = undefined;
      }
    }

    adminAppInstance = initializeApp({
      credential,
      projectId: PROJECT_ID
    });

    console.log(`[FirebaseAdmin] Initialized Firebase Admin SDK with project: ${PROJECT_ID}`);
    return adminAppInstance;
  } catch (err) {
    console.warn("[FirebaseAdmin] Notice: Firebase Admin SDK standard init:", err);
    return null;
  }
}

export function getAdminFirestore(): Firestore | null {
  if (adminFirestoreInstance) return adminFirestoreInstance;
  const app = getFirebaseAdminApp();
  if (app) {
    try {
      if (firebaseConfigData.firestoreDatabaseId) {
        adminFirestoreInstance = getFirestore(app, firebaseConfigData.firestoreDatabaseId);
      } else {
        adminFirestoreInstance = getFirestore(app);
      }
      return adminFirestoreInstance;
    } catch (e) {
      console.warn("[FirebaseAdmin] Firestore instance init warning:", e);
    }
  }
  return null;
}

export function getAdminMessaging(): Messaging | null {
  if (adminMessagingInstance) return adminMessagingInstance;
  const app = getFirebaseAdminApp();
  if (app) {
    try {
      adminMessagingInstance = getMessaging(app);
      return adminMessagingInstance;
    } catch (e) {
      console.warn("[FirebaseAdmin] Messaging instance init warning:", e);
    }
  }
  return null;
}

/**
 * Obtain an OAuth2 Bearer Access Token for FCM HTTP v1 API
 */
async function getFCMAccessToken(): Promise<string | null> {
  try {
    if (!googleAuthClient) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        googleAuthClient = new GoogleAuth({
          credentials,
          scopes: ["https://www.googleapis.com/auth/firebase.messaging"]
        });
      } else {
        googleAuthClient = new GoogleAuth({
          scopes: ["https://www.googleapis.com/auth/firebase.messaging"]
        });
      }
    }

    const client = await googleAuthClient.getClient();
    const accessTokenResponse = await client.getAccessToken();
    return accessTokenResponse.token || null;
  } catch (e) {
    console.warn("[FirebaseAdmin] Could not obtain OAuth2 token for FCM v1:", e);
    return null;
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  orderId?: string;
  role?: string;
  userId?: string;
  type?: string;
  url?: string;
  icon?: string;
}

/**
 * Send real FCM HTTP v1 message to a specific device token
 */
export async function sendFCMV1Message(token: string, payload: PushNotificationPayload): Promise<{ success: boolean; error?: string; invalidToken?: boolean }> {
  if (!token || typeof token !== "string") {
    return { success: false, error: "Token is empty" };
  }

  // Strategy 1: Use Firebase Admin SDK if fully initialized
  const messaging = getAdminMessaging();
  if (messaging) {
    try {
      const message: Message = {
        token: token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.icon || undefined
        },
        data: {
          title: payload.title,
          body: payload.body,
          orderId: payload.orderId || "",
          role: payload.role || "",
          type: payload.type || "order",
          url: payload.url || "/",
          screen: payload.role === "admin" ? "admin" : payload.role === "driver" ? "driver" : "orders"
        },
        webpush: {
          headers: {
            Urgency: "high"
          },
          notification: {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || "/icons/icon-192x192.png",
            badge: "/icons/badge-72x72.png",
            dir: "rtl",
            lang: "ar",
            tag: payload.orderId ? `order-${payload.orderId}` : `baraka-${Date.now()}`,
            renotify: true,
            requireInteraction: false
          },
          fcmOptions: {
            link: payload.url || (payload.role === "admin" ? "/?screen=admin" : payload.role === "driver" ? "/?screen=driver" : payload.orderId ? `/?screen=orders&orderId=${payload.orderId}` : "/?screen=orders")
          }
        }
      };

      await messaging.send(message);
      return { success: true };
    } catch (adminErr: any) {
      const errCode = adminErr?.code || "";
      const isInvalid = errCode === "messaging/registration-token-not-registered" ||
                        errCode === "messaging/invalid-registration-token" ||
                        errCode === "messaging/invalid-argument";
      console.warn(`[FirebaseAdmin] Messaging.send error for token ${token.slice(0, 10)}...:`, adminErr?.message || adminErr);
      return { success: false, error: adminErr?.message, invalidToken: isInvalid };
    }
  }

  // Strategy 2: Direct FCM HTTP v1 call via GoogleAuth REST
  try {
    const accessToken = await getFCMAccessToken();
    if (accessToken) {
      const url = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: {
            token: token,
            notification: {
              title: payload.title,
              body: payload.body
            },
            data: {
              title: payload.title,
              body: payload.body,
              orderId: payload.orderId || "",
              role: payload.role || "",
              type: payload.type || "order",
              url: payload.url || "/"
            },
            webpush: {
              notification: {
                title: payload.title,
                body: payload.body,
                icon: "/icons/icon-192x192.png",
                tag: payload.orderId || `baraka-${Date.now()}`,
                dir: "rtl",
                lang: "ar"
              },
              fcm_options: {
                link: payload.url || "/"
              }
            }
          }
        })
      });

      if (res.ok) {
        return { success: true };
      } else {
        const errorBody = await res.text();
        const isInvalid = res.status === 404 || errorBody.includes("UNREGISTERED") || errorBody.includes("INVALID_ARGUMENT");
        return { success: false, error: errorBody, invalidToken: isInvalid };
      }
    }
  } catch (restErr: any) {
    console.warn("[FirebaseAdmin] Direct HTTP v1 call error:", restErr?.message || restErr);
  }

  return { success: false, error: "FCM v1 authentication credentials not available in environment" };
}
