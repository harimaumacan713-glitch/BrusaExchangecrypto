import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDR91D_1_ijJztpUD2qy-ovqvDsGZ83Zjg",
  authDomain: "brusaexchangecrypto-a82b3.firebaseapp.com",
  databaseURL: "https://brusaexchangecrypto-a82b3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "brusaexchangecrypto-a82b3",
  storageBucket: "brusaexchangecrypto-a82b3.firebasestorage.app",
  messagingSenderId: "192578822040",
  appId: "1:192578822040:web:4a584da0cbaa85d6dd55ed",
  measurementId: "G-PFCBG9HGJS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const rtdb = getDatabase(app, firebaseConfig.databaseURL);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
