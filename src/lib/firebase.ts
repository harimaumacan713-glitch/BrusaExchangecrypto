import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // Note: If the tool didn't explicitly return databaseId, it uses the default one.
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
