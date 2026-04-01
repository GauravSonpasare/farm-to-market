importScripts("https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyBwj7_lrel1TRRDsRnbQO1QuYKvpiukR_k",
  authDomain: "f2mai-cb474.firebaseapp.com",
  projectId: "f2mai-cb474",
  storageBucket: "f2mai-cb474.firebasestorage.app",
  messagingSenderId: "94543098516",
  appId: "1:94543098516:web:abc227adc10bc4d16e3a81",
  measurementId: "G-VF1LHB48S8"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icons/bell.png"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
