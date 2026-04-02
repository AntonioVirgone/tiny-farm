import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

declare var __firebase_config: string | undefined;
declare var __app_id: string | undefined;
declare var __initial_auth_token: string | undefined;

export let app: any = null;
export let auth: any = null;
export let db: any = null;
export let appId = 'local-dev-app';

const localFirebaseConfig = {
  apiKey: "AIzaSyBI4uaGf4XvlnFJcVDq5lcmQPueD0rJmCo",
  authDomain: "tiny-farm-be44a.firebaseapp.com",
  projectId: "tiny-farm-be44a",
  storageBucket: "tiny-farm-be44a.firebasestorage.app",
  messagingSenderId: "1097896561514",
  appId: "1:1097896561514:web:dbdf4147ccdded6f82b313",
};

try {
  let firebaseConfig = localFirebaseConfig;
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    firebaseConfig = JSON.parse(__firebase_config);
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  if (typeof __app_id !== 'undefined' && __app_id) {
    appId = __app_id;
  }
} catch (e) {
  console.warn("Firebase non inizializzato. Il salvataggio cloud potrebbe non essere disponibile.", e);
}

export { __initial_auth_token };