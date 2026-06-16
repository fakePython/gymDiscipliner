import { useEffect, useState } from 'react';
import { collection, getDocs, collectionGroup } from 'firebase/firestore';
import { db } from '../../firebase';
import type { AdminUser } from '../../hooks/useAdminData';
import type { DayEntry, Discipliner } from '../../types';

interface Props {
  user: AdminUser | null;
  onClose: () => void;
}

interface FieldStats {
  disciplinerName: string;
  fieldLabel: string;
  green: number;
  yellow: number;
  red: number;
  streak: number;
}

export function UserDetailDrawer({ user, onClose }: Props) {
  const [stats, setStats] = useState<FieldStats[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !db) return;

    async function fetchUserStats() {
      if (!user || !db) return;
      setLoading(true);
      setStats([]);
      try {
        // Get all discipliners for this user from collectionGroup days
        const allDaysSnap = await getDocs(
          collectionGroup(db, 'days')
        );

        // Filter to this user's days
        const userDayDocs = allDaysSnap.docs.filter((d) =>
          d.ref.path.startsWith(`users/${user.uid}/`)
        );

        // Group by discipliner
        const byDiscipliner: Record<string, Record<string, DayEntry>> = {};
        for (const d of userDayDocs) {
          // path: users/{uid}/discipliners/{disciplinerId}/days/{dateStr}
          const parts = d.ref.path.split('/');
          const disciplinerId = parts[3];
          if (!byDiscipliner[disciplinerId]) byDiscipliner[disciplinerId] = {};
          byDiscipliner[disciplinerId][d.id] = d.data() as DayEntry;
        }

        // Get discipliner configs
        const configSnap = await getDocs(
          collection(db, 'users', user.uid, 'disciplinerConfig')
        );
        const configData = configSnap.docs[0]?.data() ?? {};
        const customDiscipliners: Discipliner[] = configData.custom ?? [];

        const PRESETS: Discipliner[] = [
          { id: 'gym', name: 'Gym', fields: [{ id: 'gym', label: 'Gym' }, { id: 'diet', label: 'Diet' }, { id: 'sleep', label: 'Sleep' }], isPreset: true, nameEditable: false, fieldsEditable: false },
          { id: 'learning', name: 'Learning', fields: (configData.learningOverride?.fields ?? [{ id: 'dsa', label: 'DSA' }, { id: 'systemDesign', label: 'System Design' }, { id: 'selfProject', label: 'Self Project' }]), isPreset: true, nameEditable: true, fieldsEditable: true },
        ];
        const allDiscipliners = [...PRESETS, ...customDiscipliners];

        const result: FieldStats[] = [];
        for (const [disciplinerId, dayMap] of Object.entries(byDiscipliner)) {
          const disc = allDiscipliners.find((d) => d.id === disciplinerId);
          if (!disc) continue;

          const sortedDates = Object.keys(dayMap).sort().reverse();

          for (const field of disc.fields) {
            let green = 0, yellow = 0, red = 0, streak = 0;
            for (const [, entry] of Object.entries(dayMap)) {
              const s = entry[field.id];
              if (s === 'green') green++;
              else if (s === 'yellow') yellow++;
              else if (s === 'red') red++;
            }
            // Compute streak (consecutive green/yellow from today back)
            for (const dateStr of sortedDates) {
              const s = dayMap[dateStr]?.[field.id];
              if (s === 'green' || s === 'yellow') streak++;
              else break;
            }
            result.push({ disciplinerName: disc.name, fieldLabel: field.label, green, yellow, red, streak });
          }
        }

        setStats(result);
      } catch (e) {
        console.error('Failed to fetch user stats', e);
      } finally {
        setLoading(false);
      }
    }

    fetchUserStats();
  }, [user]);

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{user.displayName ?? 'Unknown'}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">&times;</button>
        </div>

        <div className="flex-1 px-5 py-4">
          {loading && <p className="text-slate-400 text-sm">Loading...</p>}
          {!loading && stats.length === 0 && <p className="text-slate-400 text-sm">No activity data found.</p>}
          {!loading && stats.length > 0 && (
            <div className="space-y-3">
              {stats.map((s) => (
                <div key={`${s.disciplinerName}-${s.fieldLabel}`} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{s.disciplinerName} — {s.fieldLabel}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-emerald-600 dark:text-emerald-400">✓ {s.green}</span>
                    <span className="text-yellow-500">~ {s.yellow}</span>
                    <span className="text-red-500">✗ {s.red}</span>
                    <span className="ml-auto text-slate-500 dark:text-slate-400 text-xs">streak {s.streak}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
