import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getFirestore, Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyAW11jOIK9TuvkHfK54yWVWwIR9SJ_3kP8',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'signn-gatekeeper-d531e.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'signn-gatekeeper-d531e',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'signn-gatekeeper-d531e.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '114540867399',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:114540867399:web:c94d1cab3de45d2bc5e662',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'G-MQ6PGV08TN',
};

// Initialize Firebase (client-side only)
let app: FirebaseApp | undefined;
let db: Firestore | undefined;

if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : (getApps()[0] as FirebaseApp);
  const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID;
  db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

const analytics: Analytics | null =
  typeof window !== 'undefined' && app ? getAnalytics(app) : null;

export { app, db, analytics };
