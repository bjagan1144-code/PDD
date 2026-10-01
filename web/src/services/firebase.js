import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration from Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDHJ3Yilerm216ROxnq8pbsuVG1DS3LKS8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "biopatch-ai-fire.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "biopatch-ai-fire",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "biopatch-ai-fire.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "589082450168",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:589082450168:web:b37ffeb439c21c54a8030d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JRPD2BXQ24"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
