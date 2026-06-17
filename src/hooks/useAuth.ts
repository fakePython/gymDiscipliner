import { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
        const ref = doc(db, 'users', u.uid, 'profile', 'v1');
        try {
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            // First sign-in: seed the profile with role='user'. Existing users
            // (including admins) keep whatever role is already in Firestore.
            await setDoc(ref, {
              role: 'user',
              createdAt: serverTimestamp(),
              displayName: u.displayName,
              email: u.email,
            });
          } else {
            // Refresh mutable fields only — never touch role or createdAt.
            await setDoc(
              ref,
              { displayName: u.displayName, email: u.email },
              { merge: true }
            );
          }
        } catch (err) {
          console.error('Failed to seed/update profile', err);
        }
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
