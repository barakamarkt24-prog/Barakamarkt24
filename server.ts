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

  // Single-request AI Product Translation Endpoint (Arabic -> German, English, Ukrainian, Persian)
  app.post("/api/translate-product", async (req, res) => {
    try {
      const { nameAr, descriptionAr } = req.body;
      if (!nameAr || typeof nameAr !== "string" || !nameAr.trim()) {
        return res.status(400).json({ error: "الاسم بالعربية مطلوب للترجمة" });
      }

      const ai = getGeminiClient();
      const prompt = `You are a professional food and grocery product localization expert for 'Barakamarkt24', an authentic Syrian and Middle Eastern grocery store in Germany.
Translate and localize the following Arabic product details into German (de), English (en), Ukrainian (uk), and Persian/Farsi (fa).

Arabic Product Name: "${nameAr.trim()}"
Arabic Product Description: "${(descriptionAr || "").trim()}"

Requirements:
1. 'nameDe': Authentic, natural German supermarket product title (e.g., 'Syrischer Halloumi-Käse', 'Aleppo Zaatar Kräutermischung').
2. 'nameEn': Authentic, clear English grocery title (e.g., 'Syrian Halloumi Cheese', 'Aleppo Zaatar Herb Blend').
3. 'nameUk': Authentic, natural Ukrainian grocery title (e.g., 'Сирійський сир Халумі', 'Суміш трав Заатар з Алеппо').
4. 'nameFa': Authentic, natural Persian/Farsi grocery title (e.g., 'پنیر حلومی سوری', 'مخلوط گیاهی زعتر حلب').
5. 'descriptionDe': Natural, appealing 1-2 sentence German food description.
6. 'descriptionEn': Natural, appealing 1-2 sentence English food description.
7. 'descriptionUk': Natural, appealing 1-2 sentence Ukrainian food description.
8. 'descriptionFa': Natural, appealing 1-2 sentence Persian food description.
9. Return clean JSON matching the schema.`;

      const candidateModels = ["gemini-3.7-flash", "gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-3.6-flash"];
      let lastError: any = null;
      let text = "";

      for (const modelName of candidateModels) {
        // Try up to 2 times for each model if a 503 or transient error occurs
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            if (attempt > 0) {
              // Wait 1 second before retry
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            const response = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    nameDe: { type: Type.STRING, description: "German product name" },
                    nameEn: { type: Type.STRING, description: "English product name" },
                    nameUk: { type: Type.STRING, description: "Ukrainian product name" },
                    nameFa: { type: Type.STRING, description: "Persian product name" },
                    descriptionDe: { type: Type.STRING, description: "German product description" },
                    descriptionEn: { type: Type.STRING, description: "English product description" },
                    descriptionUk: { type: Type.STRING, description: "Ukrainian product description" },
                    descriptionFa: { type: Type.STRING, description: "Persian product description" },
                  },
                  required: ["nameDe", "nameEn", "nameUk", "nameFa", "descriptionDe", "descriptionEn", "descriptionUk", "descriptionFa"],
                },
              },
            });

            text = response.text?.trim() || "";
            if (text) {
              break;
            }
          } catch (err: any) {
            lastError = err;
            console.warn(`[Translation] Model ${modelName} attempt ${attempt + 1} error:`, err?.message || err);
            // If it's not a transient 503/429/404, stop retrying this model
            const isTransient = err?.message?.includes("503") || err?.message?.includes("429") || err?.message?.includes("UNAVAILABLE") || err?.message?.includes("RESOURCE_EXHAUSTED");
            if (!isTransient && attempt === 0) {
              break; // Try next model immediately
            }
          }
        }

        if (text) {
          break;
        }
      }

      if (!text) {
        console.error("All translation models failed. Last error:", lastError);
        const errMsg = lastError?.message || "";
        if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand")) {
          return res.status(503).json({
            error: "خدمة الذكاء الاصطناعي تشهد ضغطاً مؤقتاً في الوقت الحالي. يرجى المحاولة مرة أخرى بعد لحظات."
          });
        }
        return res.status(500).json({
          error: "تعذر توليد الترجمة حالياً، يرجى المحاولة بعد قليل أو إدخال النصوص يدوياً."
        });
      }

      const result = JSON.parse(text);
      return res.json(result);
    } catch (error: any) {
      console.error("Translation server error:", error);
      return res.status(500).json({
        error: "فشل في معالجة بيانات الترجمة، يرجى المحاولة مرة أخرى."
      });
    }
  });

  // Single-request AI Announcement Translation Endpoint (Arabic -> German, English, Ukrainian, Persian)
  app.post("/api/translate-announcement", async (req, res) => {
    try {
      const { textAr } = req.body;
      if (!textAr || typeof textAr !== "string" || !textAr.trim()) {
        return res.status(400).json({ error: "نص الإعلان بالعربية مطلوب للترجمة" });
      }

      const ai = getGeminiClient();
      const prompt = `You are a professional multilingual localization specialist for 'Barakamarkt24', an authentic Syrian and Middle Eastern grocery store in Germany.
Translate and localize the following Arabic promotional ticker / announcement text into German (de), English (en), Ukrainian (uk), and Persian/Farsi (fa).
Preserve any relevant emojis (e.g. 🚚, 🌟, 🏷️, 🔥), keep the text catchy, concise, and natural for an e-commerce ticker banner.

Arabic Announcement: "${textAr.trim()}"

Requirements:
1. 'textDe': Authentic, natural German supermarket announcement text.
2. 'textEn': Authentic, natural English supermarket announcement text.
3. 'textUk': Authentic, natural Ukrainian supermarket announcement text.
4. 'textFa': Authentic, natural Persian/Farsi supermarket announcement text.
5. Return clean JSON matching schema.`;

      const candidateModels = ["gemini-3.7-flash", "gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-3.6-flash"];
      let lastError: any = null;
      let text = "";

      for (const modelName of candidateModels) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            if (attempt > 0) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            const response = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    textDe: { type: Type.STRING, description: "German translation of announcement" },
                    textEn: { type: Type.STRING, description: "English translation of announcement" },
                    textUk: { type: Type.STRING, description: "Ukrainian translation of announcement" },
                    textFa: { type: Type.STRING, description: "Persian translation of announcement" },
                  },
                  required: ["textDe", "textEn", "textUk", "textFa"],
                },
              },
            });

            text = response.text?.trim() || "";
            if (text) {
              break;
            }
          } catch (err: any) {
            lastError = err;
            console.warn(`[Announcement Translation] Model ${modelName} attempt ${attempt + 1} error:`, err?.message || err);
            const isTransient = err?.message?.includes("503") || err?.message?.includes("429") || err?.message?.includes("UNAVAILABLE") || err?.message?.includes("RESOURCE_EXHAUSTED");
            if (!isTransient && attempt === 0) {
              break;
            }
          }
        }

        if (text) {
          break;
        }
      }

      if (!text) {
        console.error("All announcement translation models failed. Last error:", lastError);
        const errMsg = lastError?.message || "";
        if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand")) {
          return res.status(503).json({
            error: "خدمة الذكاء الاصطناعي تشهد ضغطاً مؤقتاً في الوقت الحالي. يرجى المحاولة مرة أخرى بعد لحظات."
          });
        }
        return res.status(500).json({
          error: "تعذر توليد الترجمة حالياً، يرجى المحاولة بعد قليل أو إدخال النصوص يدوياً."
        });
      }

      const result = JSON.parse(text);
      return res.json(result);
    } catch (error: any) {
      console.error("Announcement translation server error:", error);
      return res.status(500).json({
        error: "فشل في معالجة بيانات الترجمة، يرجى المحاولة مرة أخرى."
      });
    }
  });

  // OneSignal Server Configuration & Helper (Web Push)
  const getOneSignalConfig = () => {
    const appId = (process.env.ONESIGNAL_APP_ID || process.env.VITE_ONESIGNAL_APP_ID || "").trim();
    const restApiKey = (process.env.ONESIGNAL_REST_API_KEY || "").trim();
    return { appId, restApiKey };
  };

  interface OneSignalPushOptions {
    title: string;
    body: string;
    userId?: string;
    role?: string;
    orderId?: string;
    type?: string;
    url?: string;
    screen?: string;
    targetRole?: string;
    couponCode?: string;
  }

  async function sendOneSignalPush(options: OneSignalPushOptions): Promise<{ success: boolean; id?: string; recipients?: number; error?: string }> {
    const { appId, restApiKey } = getOneSignalConfig();

    if (!appId || !restApiKey) {
      console.log(`[OneSignal Server] Push notification notice: ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY not configured on server (appId: ${appId ? 'configured' : 'missing'}, key: ${restApiKey ? 'configured' : 'missing'})`);
      return { success: false, error: "OneSignal credentials not configured" };
    }

    try {
      const { title, body, userId, role, orderId, type = "order", url, screen, targetRole, couponCode } = options;

      const launchUrl = url || (role === "admin" ? "/?screen=admin" : role === "driver" ? "/?screen=driver" : orderId ? `/?screen=orders&orderId=${orderId}` : "/");

      const payload: any = {
        app_id: appId,
        headings: {
          en: title,
          ar: title
        },
        contents: {
          en: body,
          ar: body
        },
        data: {
          orderId: orderId || "",
          role: role || "",
          userId: userId || "",
          type: type || "order",
          screen: screen || (role === "admin" ? "admin" : role === "driver" ? "driver" : "orders"),
          url: launchUrl,
          couponCode: couponCode || ""
        },
        web_url: launchUrl,
        url: launchUrl
      };

      // Target Selection:
      if (role === "admin") {
        // Target Admins via tag filter
        payload.filters = [
          { field: "tag", key: "role", relation: "=", value: "admin" }
        ];
      } else if (role === "driver") {
        if (userId && userId !== "guest" && userId !== "all") {
          payload.target_channel = "push";
          payload.include_aliases = {
            external_id: [userId]
          };
          payload.include_external_user_ids = [userId];
        } else {
          payload.filters = [
            { field: "tag", key: "role", relation: "=", value: "driver" }
          ];
        }
      } else if (userId && userId !== "guest" && userId !== "all") {
        // Target specific Customer by Firebase UID
        payload.target_channel = "push";
        payload.include_aliases = {
          external_id: [userId]
        };
        payload.include_external_user_ids = [userId];
      } else if (targetRole && targetRole !== "all") {
        payload.filters = [
          { field: "tag", key: "role", relation: "=", value: targetRole }
        ];
      } else {
        // Broadcast to all subscribed devices
        payload.included_segments = ["Subscribed Users"];
      }

      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": `Key ${restApiKey}`
        },
        body: JSON.stringify(payload)
      });

      const resData: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errDetail = Array.isArray(resData?.errors) ? resData.errors.join(", ") : (resData?.errors || `HTTP ${response.status}`);
        console.warn(`[OneSignal Server] Push API warning (${response.status}):`, errDetail);
        return { success: false, error: errDetail };
      }

      console.log(`[OneSignal Server] Push delivered successfully (id: ${resData?.id}, recipients: ${resData?.recipients || 0})`);
      return {
        success: true,
        id: resData?.id,
        recipients: resData?.recipients || 0
      };
    } catch (err: any) {
      console.warn("[OneSignal Server] Network exception during Push dispatch:", err?.message || "Connection error");
      return { success: false, error: err?.message || "Connection error" };
    }
  }

  // Push Notification Dispatch API (Handles real server-side OneSignal & FCM push to Admin, Driver, or Customer)
  app.post("/api/send-notification", async (req, res) => {
    try {
      const { title, body, message, userId, role, orderId, type, url, screen, token, tokens } = req.body;
      const notifTitle = (title || "إشعار من بركة ماركت 24").trim();
      const notifBody = (body || message || "").trim();

      if (!notifTitle) {
        return res.status(400).json({ error: "عنوان الإشعار مطلوب" });
      }

      // Deduplication tag check (e.g. avoid duplicate triggers within 15 seconds for the same order)
      const dedupKey = `${orderId || 'general'}_${role || userId || 'all'}_${type || 'order'}`;
      if (orderId && sentNotificationTags.has(dedupKey)) {
        console.log(`[Notification Dispatcher] Skipping duplicate notification for key: ${dedupKey}`);
        return res.json({ success: true, duplicateSkipped: true });
      }

      if (orderId) {
        sentNotificationTags.add(dedupKey);
        setTimeout(() => sentNotificationTags.delete(dedupKey), 15000);
      }

      console.log(`[Notification Dispatcher] Dispatching push: "${notifTitle}" (orderId: ${orderId || 'none'}, target: ${role || userId || 'all'})`);

      // 1. Primary: Dispatch OneSignal Push Notification
      const oneSignalResult = await sendOneSignalPush({
        title: notifTitle,
        body: notifBody,
        userId,
        role,
        orderId,
        type: type || "order",
        url,
        screen
      });

      // 2. Secondary / Fallback: Attempt FCM v1 if explicit tokens or FCM credentials exist
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
      if (Array.isArray(tokens) && tokens.length > 0) {
        targetTokens = tokens.filter(t => typeof t === "string" && t.trim().length > 0);
      } else if (token && typeof token === "string" && token.trim().length > 0) {
        targetTokens = [token.trim()];
      }

      const adminFirestore = getAdminFirestore();
      if (adminFirestore && targetTokens.length === 0) {
        try {
          const tokensRef = adminFirestore.collection("fcmTokens");
          let snapshot: any;

          if (role === "admin") {
            snapshot = await tokensRef.where("role", "==", "admin").where("enabled", "==", true).get();
          } else if (role === "driver") {
            if (userId) {
              snapshot = await tokensRef.where("userId", "==", userId).where("enabled", "==", true).get();
            } else {
              snapshot = await tokensRef.where("role", "==", "driver").where("enabled", "==", true).get();
            }
          } else if (userId && userId !== "guest" && userId !== "all") {
            snapshot = await tokensRef.where("userId", "==", userId).where("enabled", "==", true).get();
          }

          if (snapshot) {
            snapshot.forEach((docSnap: any) => {
              const data = docSnap.data();
              if (data?.token && typeof data.token === "string" && data.token.trim()) {
                if (data.enabled === false) return;
                targetTokens.push(data.token.trim());
              }
            });
          }
        } catch (dbErr) {
          // Non-blocking
        }
      }

      let fcmSuccessCount = 0;
      if (targetTokens.length > 0) {
        for (const t of Array.from(new Set(targetTokens))) {
          try {
            const sendResult = await sendFCMV1Message(t, payload);
            if (sendResult.success) fcmSuccessCount++;
          } catch {
            // Non-blocking
          }
        }
      }

      return res.json({
        success: true,
        dispatchedAt: new Date().toISOString(),
        recipient: userId || role || "all",
        oneSignal: oneSignalResult,
        fcmCount: fcmSuccessCount
      });
    } catch (error: any) {
      console.error("Notification dispatch error:", error?.message || error);
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

      console.log(`[Notification Broadcast] Broadcasting "${title}" to target: ${targetRole}`);

      // 1. OneSignal Broadcast
      const oneSignalResult = await sendOneSignalPush({
        title: title.trim(),
        body: message.trim(),
        targetRole,
        type: type || "promo",
        couponCode,
        url: couponCode ? `/?coupon=${couponCode}` : "/"
      });

      // 2. FCM Broadcast if configured
      const payload: PushNotificationPayload = {
        title: title.trim(),
        body: message.trim(),
        type: type || "promo",
        url: couponCode ? `/?coupon=${couponCode}` : "/"
      };

      let targetTokens: string[] = [];
      const adminFirestore = getAdminFirestore();
      if (adminFirestore) {
        try {
          const tokensRef = adminFirestore.collection("fcmTokens");
          let snapshot: any;
          if (targetRole === "admin" || targetRole === "driver" || targetRole === "customer") {
            snapshot = await tokensRef.where("role", "==", targetRole).where("enabled", "==", true).get();
          } else {
            snapshot = await tokensRef.where("enabled", "==", true).limit(200).get();
          }

          snapshot.forEach((docSnap: any) => {
            const data = docSnap.data();
            if (data?.token && typeof data.token === "string" && data.token.trim()) {
              if (data.enabled === false) return;
              targetTokens.push(data.token.trim());
            }
          });
        } catch {
          // Non-blocking
        }
      }

      let fcmSuccessCount = 0;
      for (const t of Array.from(new Set(targetTokens))) {
        try {
          const sendResult = await sendFCMV1Message(t, payload);
          if (sendResult.success) fcmSuccessCount++;
        } catch {
          // Non-blocking
        }
      }

      return res.json({
        success: true,
        broadcastId: `bc_${Date.now()}`,
        targetRole,
        title,
        message,
        couponCode: couponCode || null,
        oneSignal: oneSignalResult,
        fcmCount: fcmSuccessCount,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Broadcast dispatch error:", error?.message || error);
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

