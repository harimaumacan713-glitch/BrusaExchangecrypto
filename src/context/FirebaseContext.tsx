import { createContext, useContext, ReactNode } from 'react';
import { auth, db, rtdb, messaging } from '../lib/firebase';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Database, getDatabase } from 'firebase/database';
import { Messaging, getMessaging } from 'firebase/messaging';

interface FirebaseContextType {
  auth: Auth;
  db: Firestore;
  rtdb: Database;
  messaging: Messaging;
}

const FirebaseContext = createContext<FirebaseContextType>({
  auth,
  db,
  rtdb,
  messaging
});

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  return (
    <FirebaseContext.Provider value={{ auth, db, rtdb, messaging }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
