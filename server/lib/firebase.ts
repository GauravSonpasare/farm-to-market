import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// This requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env
try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY !== "testkey" && process.env.FIREBASE_CLIENT_EMAIL) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } else {
    console.log('[Mock Firebase] Firebase Admin not initialized: Missing environment variables');
  }
} catch (error) {
  console.error('Firebase Admin initialization error', error);
}

export const messaging: any = admin.apps.length ? admin.messaging() : null;

export const sendPushNotification = async (token: string, title: string, body: string, data?: any) => {
  if (!messaging) {
    console.log(`[MOCK PUSH LOG] Would send push to ${token}: [${title}] ${body}`);
    return;
  }
  
  try {
    await messaging.send({
      token,
      notification: { title, body },
      data: data || {},
    });
    console.log(`Push sent successfully to ${token}`);
  } catch (err) {
    console.error(`Failed to send push to ${token}`, err);
  }
};
