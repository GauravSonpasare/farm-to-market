import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";
import { apiRequest } from "./api";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "dummy",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "dummy",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "dummy"
};

let app;
let messaging: any = null;
export let analytics: any = null;

try {
  if (firebaseConfig.apiKey !== "dummy") {
    app = initializeApp(firebaseConfig);
    if (typeof window !== "undefined") {
      analytics = getAnalytics(app);
      if ("serviceWorker" in navigator) {
        messaging = getMessaging(app);
      }
    }
  } else {
    console.log("[Mock Firebase] FCM Client SDK not initialized due to missing variables.");
  }
} catch (e) {
  console.error("Firebase init error", e);
}

export const requestNotificationPermission = async () => {
  if (!messaging) return;
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || "dummy"
      });
      if (token) {
        await apiRequest("POST", "/api/notifications/register-token", { token });
        console.log("FCM Token registered with backend");
      }
    }
  } catch (err) {
    console.error("FCM Permission error", err);
  }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};
