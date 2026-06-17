import { useEffect, useState } from 'react';
import { collection, collectionGroup, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
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

const PRESET_DISCIPLINER_IDS = ['gym', 'learning'];

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

        // Per-user: read disciplinerConfig once, derive the user's discipliner ids
        // (presets + custom), then count entries and find last-active across all of them.
        // Iterating by user avoids the v1/v2 double-count that collectionGroup('days')
        // would produce (both users/{uid}/days and users/{uid}/discipliners/{id}/days
        // share the 'days' collection name).
        let totalEntries = 0;
        const nameCount: Record<string, number> = {};

        await Promise.all(
          fetchedUsers.map(async (u) => {
            try {
              const configRef = doc(db!, 'users', u.uid, 'disciplinerConfig', 'v1');
              const configSnap = await getDoc(configRef);
              const configData = configSnap.exists() ? configSnap.data() : {};
              const customs: { id: string; name: string }[] = configData.custom ?? [];

              for (const c of customs) {
                nameCount[c.name] = (nameCount[c.name] ?? 0) + 1;
              }

              const disciplinerIds = [
                ...PRESET_DISCIPLINER_IDS,
                ...customs.map((c) => c.id),
              ];

              let userTotal = 0;
              let userLastActive: string | null = null;

              await Promise.all(
                disciplinerIds.map(async (disciplinerId) => {
                  const daysColl = collection(db!, 'users', u.uid, 'discipliners', disciplinerId, 'days');
                  const [countSnap, latestSnap] = await Promise.all([
                    getDocs(daysColl),
                    getDocs(query(daysColl, orderBy('__name__', 'desc'), limit(1))),
                  ]);
                  userTotal += countSnap.size;
                  const latestId = latestSnap.docs[0]?.id;
                  if (latestId && (!userLastActive || latestId > userLastActive)) {
                    userLastActive = latestId;
                  }
                })
              );

              totalEntries += userTotal;
              if (userLastActive) {
                // YYYY-MM-DD without time → parse as local midnight to avoid UTC shift.
                u.lastActive = new Date(`${userLastActive}T00:00:00`);
              }
            } catch { /* best effort per user */ }
          })
        );

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
