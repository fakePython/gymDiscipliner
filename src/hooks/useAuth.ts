import { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u && db) {
        await setDoc(
          doc(db, 'users', u.uid, 'profile', 'v1'),
          { role: 'user', createdAt: serverTimestamp(), displayName: u.displayName, email: u.email },
          { merge: true }
        );
      }
    });
  }, []);

  const signIn = useCallback(async () => {
    if (!auth) return;
    await signInWithPopup(auth, new GoogleAuthProvider());
  }, []);

  const signOut = useCallback(async () => {
    if (!auth) return;
    await auth.signOut();
  }, []);

  return { user, loading, signIn, signOut };
}
