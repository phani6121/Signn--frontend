import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let adminDb: Firestore;

function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    // Check if we have service account credentials
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccount) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. ' +
        'Please add your Firebase service account key to .env.local'
      );
    }
    
    try {
      const serviceAccountKey = JSON.parse(serviceAccount);
      app = initializeApp({
        credential: cert(serviceAccountKey),
      });
    } catch (error) {
      throw new Error(
        'Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. ' +
        'Make sure it is a valid JSON string.'
      );
    }
  } else {
    app = getApps()[0];
  }
  
  const databaseId = process.env.FIREBASE_DATABASE_ID;
  adminDb = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  return adminDb;
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    initializeFirebaseAdmin();
  }
  return adminDb;
}

export { adminDb };
