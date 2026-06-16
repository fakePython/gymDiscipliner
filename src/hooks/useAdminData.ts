import { useEffect, useState } from 'react';
import { collection, collectionGroup, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

export interface AdminUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  createdAt: Date | null;
  lastActive: Date | null;
}

export interface GlobalStats {
  totalUsers: number;
  totalEntries: number;
  topDiscipliners: { name: string; count: number }[];
}

export function useAdminData(): { users: AdminUser[]; globalStats: GlobalStats; loading: boolean } {
  const active = isFirebaseConfigured && db != null;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ totalUsers: 0, totalEntries: 0, topDiscipliners: [] });
  const [loading, setLoading] = useState(active);

  useEffect(() => {
    if (!active || !db) return;

    async function fetchData() {
      if (!db) return;
      try {
        // Fetch all user profiles
        const profilesSnap = await getDocs(collectionGroup(db, 'profile'));
        const fetchedUsers: AdminUser[] = [];
        for (const profileDoc of profilesSnap.docs) {
          const data = profileDoc.data();
          const uid = profileDoc.ref.parent.parent?.id ?? '';
          fetchedUsers.push({
            uid,
            displayName: data.displayName ?? null,
            email: data.email ?? null,
            createdAt: data.createdAt?.toDate() ?? null,
            lastActive: null,
          });
        }

        // Fetch last active per user (latest day entry)
        for (const u of fetchedUsers) {
          try {
            const daysSnap = await getDocs(
              query(
                collection(db, 'users', u.uid, 'discipliners', 'gym', 'days'),
                orderBy('__name__', 'desc'),
                limit(1)
              )
            );
            if (!daysSnap.empty) {
              const dateStr = daysSnap.docs[0].id;
              u.lastActive = new Date(dateStr);
            }
          } catch { /* best effort */ }
        }

        // Count total day entries across all users
        const daysSnap = await getDocs(collectionGroup(db, 'days'));
        const totalEntries = daysSnap.size;

        // Aggregate top discipliner names from disciplinerConfig
        const configSnap = await getDocs(collectionGroup(db, 'disciplinerConfig'));
        const nameCount: Record<string, number> = {};
        for (const configDoc of configSnap.docs) {
          const data = configDoc.data();
          const customs: { name: string }[] = data.custom ?? [];
          for (const d of customs) {
            nameCount[d.name] = (nameCount[d.name] ?? 0) + 1;
          }
        }
        const topDiscipliners = Object.entries(nameCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setUsers(fetchedUsers);
        setGlobalStats({ totalUsers: fetchedUsers.length, totalEntries, topDiscipliners });
      } catch (e) {
        console.error('Admin data fetch failed', e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [active]);

  return { users, globalStats, loading };
}
