import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { getAdminFirestore, sendFCMV1Message, PushNotificationPayload } from "./server/firebaseAdmin";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());

  // In-memory deduplication set to avoid re-broadcasting identical alerts within a short window
  const sentNotificationTags = new Set<string>();

  // Lazy-initialize Gemini SDK to fail fast with clear error on first use if key is missing
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Single-request AI Product Translation Endpoint (Arabic -> German & English)
  app.post("/api/translate-product", async (req, res) => {
    try {
      const { nameAr, descriptionAr } = req.body;
      if (!nameAr || typeof nameAr !== "string" || !nameAr.trim()) {
        return res.status(400).json({ error: "الاسم بالعربية مطلوب للترجمة" });
      }

      const ai = getGeminiClient();
      const prompt = `You are a professional food and grocery product localization expert for 'Barakamarkt24', an authentic Syrian and Middle Eastern grocery store in Germany.
Translate and localize the following Arabic product details into German (De) and English (En).

Arabic Product Name: "${nameAr.trim()}"
Arabic Product Description: "${(descriptionAr || "").trim()}"

Requirements:
1. 'nameDe': Authentic, natural German supermarket product title (e.g., 'Syrischer Halloumi-Käse', 'Aleppo Zaatar Kräutermischung').
2. 'nameEn': Authentic, clear English grocery title (e.g., 'Syrian Halloumi Cheese', 'Aleppo Zaatar Herb Blend').
3. 'descriptionDe': Natural, appealing 1-2 sentence German food description. If Arabic description is short or empty, write a pleasant 1-sentence product description.
4. 'descriptionEn': Natural, appealing 1-2 sentence English food description. If Arabic description is short or empty, write a pleasant 1-sentence product description.
5. Return clean JSON matching the schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nameDe: { type: Type.STRING, description: "German product name" },
              nameEn: { type: Type.STRING, description: "English product name" },
              descriptionDe: { type: Type.STRING, description: "German product description" },
              descriptionEn: { type: Type.STRING, description: "English product description" },
            },
            required: ["nameDe", "nameEn", "descriptionDe", "descriptionEn"],
          },
        },
      });

      const text = response.text?.trim() || "{}";
      const result = JSON.parse(text);
      return res.json(result);
    } catch (error: any) {
      console.error("Translation server error:", error);
      return res.status(500).json({
        error: error?.message || "فشل الاتصال بخدمة الترجمة التلقائية"
      });
    }
  });

  // Push Notification Dispatch API (Handles real server-side FCM push to Admin, Driver, or Customer)
  app.post("/api/send-notification", async (req, res) => {
    try {
      const { title, body, message, userId, role, orderId, type, url, token, tokens } = req.body;
      const notifTitle = (title || "إشعار من بركة ماركت 24").trim();
      const notifBody = (body || message || "").trim();

      if (!notifTitle) {
        return res.status(400).json({ error: "عنوان الإشعار مطلوب" });
      }

      // Deduplication tag check (e.g. avoid duplicate triggers within 10 seconds for the same order)
      const dedupKey = `${orderId || 'general'}_${role || userId || 'all'}_${type || 'order'}`;
      if (orderId && sentNotificationTags.has(dedupKey)) {
        console.log(`[Notification Dispatcher] Skipping duplicate notification for key: ${dedupKey}`);
        return res.json({ success: true, duplicateSkipped: true });
      }

      if (orderId) {
        sentNotificationTags.add(dedupKey);
        setTimeout(() => sentNotificationTags.delete(dedupKey), 15000);
      }

      console.log(`[Notification Dispatcher] Dispatching FCM push: "${notifTitle}" (orderId: ${orderId || 'none'}, target: ${role || userId || 'all'})`);

      const payload: PushNotificationPayload = {
        title: notifTitle,
        body: notifBody,
        orderId: orderId || "",
        role: role || "",
        userId: userId || "",
        type: type || "order",
        url: url || (role === "admin" ? "/?screen=admin" : role === "driver" ? "/?screen=driver" : "/?screen=orders")
      };

      let targetTokens: string[] = [];

      // 1. If explicit token or token array passed in body
      if (Array.isArray(tokens) && tokens.length > 0) {
        targetTokens = tokens.filter(t => typeof t === "string" && t.trim().length > 0);
      } else if (token && typeof token === "string" && token.trim().length > 0) {
        targetTokens = [token.trim()];
      }

      // 2. Fetch targeted device tokens from Firestore fcmTokens collection
      const adminFirestore = getAdminFirestore();
      if (adminFirestore && targetTokens.length === 0) {
        try {
          const tokensRef = adminFirestore.collection("fcmTokens");
          let snapshot: any;

          if (role === "admin") {
            // Target all admins
            snapshot = await tokensRef.where("role", "==", "admin").where("enabled", "==", true).get();
          } else if (role === "driver") {
            // Target driver
            if (userId) {
              snapshot = await tokensRef.where("userId", "==", userId).where("enabled", "==", true).get();
            } else {
              snapshot = await tokensRef.where("role", "==", "driver").where("enabled", "==", true).get();
            }
          } else if (userId && userId !== "guest" && userId !== "all") {
            snapshot = await tokensRef.where("userId", "==", userId).where("enabled", "==", true).get();
          } else {
            // Broadcast or fallback
            snapshot = await tokensRef.where("enabled", "==", true).limit(50).get();
          }

          const invalidDocIdsToDelete: string[] = [];
          snapshot.forEach((docSnap: any) => {
            const data = docSnap.data();
            if (data?.token && typeof data.token === "string" && data.token.trim()) {
              targetTokens.push(data.token.trim());
            }
          });

          console.log(`[Notification Dispatcher] Found ${targetTokens.length} active device token(s) for target: ${role || userId}`);
        } catch (dbErr) {
          console.warn("[Notification Dispatcher] Could not query Firestore fcmTokens via Admin SDK:", dbErr);
        }
      }

      // 3. Send FCM v1 Messages to all discovered tokens
      let successCount = 0;
      let failureCount = 0;
      const invalidTokensToRemove: string[] = [];

      for (const t of Array.from(new Set(targetTokens))) {
        try {
          const sendResult = await sendFCMV1Message(t, payload);
          if (sendResult.success) {
            successCount++;
          } else {
            failureCount++;
            if (sendResult.invalidToken) {
              invalidTokensToRemove.push(t);
            }
          }
        } catch (pushErr) {
          failureCount++;
          console.warn("[Notification Dispatcher] Token push attempt error:", pushErr);
        }
      }

      // Clean up invalid or expired tokens in Firestore if found
      if (adminFirestore && invalidTokensToRemove.length > 0) {
        try {
          const batch = adminFirestore.batch();
          for (const invToken of invalidTokensToRemove) {
            const tokenDocId = `token_${invToken.slice(-36).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
            batch.delete(adminFirestore.collection("fcmTokens").doc(tokenDocId));
          }
          await batch.commit();
          console.log(`[Notification Dispatcher] Cleaned up ${invalidTokensToRemove.length} expired FCM token(s)`);
        } catch (cleanErr) {
          console.warn("[Notification Dispatcher] Error cleaning up expired tokens:", cleanErr);
        }
      }

      return res.json({
        success: true,
        dispatchedAt: new Date().toISOString(),
        recipient: userId || role || "all",
        tokensCount: targetTokens.length,
        deliveredCount: successCount,
        failureCount: failureCount
      });
    } catch (error: any) {
      console.error("Notification dispatch error:", error);
      return res.status(500).json({ error: error?.message || "فشل إرسال الإشعار" });
    }
  });

  // Broadcast Notification API (Admin marketing & announcements)
  app.post("/api/broadcast-notification", async (req, res) => {
    try {
      const { title, message, targetRole = "all", type = "promo", couponCode } = req.body;
      if (!title || !message) {
        return res.status(400).json({ error: "العنوان والرسالة مطلوبان للإشعار الجماعي" });
      }

      console.log(`[Notification Broadcast] Broadcasting "${title}" to target:${targetRole}`);

      return res.json({
        success: true,
        broadcastId: `bc_${Date.now()}`,
        targetRole,
        title,
        message,
        couponCode: couponCode || null,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Broadcast dispatch error:", error);
      return res.status(500).json({ error: error?.message || "فشل البث الجماعي للإشعار" });
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

