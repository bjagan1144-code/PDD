import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDHJ3Yilerm216ROxnq8pbsuVG1DS3LKS8",
  authDomain: "biopatch-ai-fire.firebaseapp.com",
  projectId: "biopatch-ai-fire",
  storageBucket: "biopatch-ai-fire.firebasestorage.app",
  messagingSenderId: "589082450168",
  appId: "1:589082450168:web:b37ffeb439c21c54a8030d",
  measurementId: "G-JRPD2BXQ24"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
