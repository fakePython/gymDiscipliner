import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

export function useAdminRole(uid: string | null): { isAdmin: boolean; loading: boolean } {
  const active = isFirebaseConfigured && db != null && uid != null;
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(active);

  useEffect(() => {
    if (!active || !db || !uid) return;

    return onSnapshot(
      doc(db, 'users', uid, 'profile', 'v1'),
      (snap) => {
        setIsAdmin(snap.exists() && snap.data()?.role === 'admin');
        setLoading(false);
      },
      () => {
        setIsAdmin(false);
        setLoading(false);
      }
    );
  }, [uid, active]);

  return { isAdmin, loading };
}
