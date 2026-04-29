import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, onSnapshot, documentId } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import type { DayEntry, Category, Status } from '../types';
import { toDateStr } from '../utils/dateHelpers';

const STORAGE_KEY = 'gymDescipliner_days';

function getAllLocal(): Record<string, DayEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveLocal(dateStr: string, category: Category, status: Status) {
  const all = getAllLocal();
  all[dateStr] = { ...({ gym: 'none', diet: 'none', sleep: 'none' }), ...all[dateStr], [category]: status };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function useMonthData(year: number, month: number) {
  const [data, setData] = useState<Map<string, DayEntry>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadFromLocal = useCallback(() => {
    const allData = getAllLocal();
    const prefix = toDateStr(year, month, 1).slice(0, 7);
    const monthData = new Map<string, DayEntry>();
    for (const [key, entry] of Object.entries(allData)) {
      if (key.startsWith(prefix)) {
        monthData.set(key, entry);
      }
    }
    setData(monthData);
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    setLoading(true);

    if (!isFirebaseConfigured || !db) {
      loadFromLocal();
      return;
    }

    const startDate = toDateStr(year, month, 1);
    const endDate = toDateStr(year, month, 31);

    const q = query(
      collection(db, 'days'),
      where(documentId(), '>=', startDate),
      where(documentId(), '<=', endDate)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entries = new Map<string, DayEntry>();
        snapshot.forEach((d) => {
          entries.set(d.id, d.data() as DayEntry);
        });
        setData(entries);
        setLoading(false);
      },
      () => {
        loadFromLocal();
      }
    );

    return unsubscribe;
  }, [year, month, loadFromLocal]);

  const updateStatus = useCallback(async (dateStr: string, category: Category, status: Status) => {
    saveLocal(dateStr, category, status);

    setData((prev) => {
      const next = new Map(prev);
      const existing = next.get(dateStr) ?? { gym: 'none', diet: 'none', sleep: 'none' };
      next.set(dateStr, { ...existing, [category]: status });
      return next;
    });

    if (isFirebaseConfigured && db) {
      const ref = doc(db, 'days', dateStr);
      await setDoc(ref, { [category]: status }, { merge: true });
    }
  }, []);

  return { data, loading, updateStatus };
}
