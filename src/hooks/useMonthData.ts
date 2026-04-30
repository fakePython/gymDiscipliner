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

function getDaysCollection(uid: string | null) {
  if (!db || !uid) return null;
  return collection(db, 'users', uid, 'days');
}

function getLocalMonthData(year: number, month: number): Map<string, DayEntry> {
  const allData = getAllLocal();
  const prefix = toDateStr(year, month, 1).slice(0, 7);
  const monthData = new Map<string, DayEntry>();
  for (const [key, entry] of Object.entries(allData)) {
    if (key.startsWith(prefix)) {
      monthData.set(key, entry);
    }
  }
  return monthData;
}

export function useMonthData(year: number, month: number, uid: string | null) {
  const useFirestore = isFirebaseConfigured && getDaysCollection(uid) != null;

  const [firestoreData, setFirestoreData] = useState<Map<string, DayEntry>>(new Map());
  const [firestoreLoading, setFirestoreLoading] = useState(useFirestore);
  const [firestoreKey, setFirestoreKey] = useState(`${year}-${month}-${uid}`);
  const [localData, setLocalData] = useState<Map<string, DayEntry>>(() => getLocalMonthData(year, month));
  const [localKey, setLocalKey] = useState(`${year}-${month}`);

  const currentLocalKey = `${year}-${month}`;
  if (currentLocalKey !== localKey) {
    setLocalKey(currentLocalKey);
    setLocalData(getLocalMonthData(year, month));
  }

  const currentFirestoreKey = `${year}-${month}-${uid}`;
  if (useFirestore && currentFirestoreKey !== firestoreKey) {
    setFirestoreKey(currentFirestoreKey);
    setFirestoreLoading(true);
    setFirestoreData(new Map());
  }

  useEffect(() => {
    const coll = getDaysCollection(uid);
    if (!isFirebaseConfigured || !coll) return;

    let cancelled = false;

    const startDate = toDateStr(year, month, 1);
    const endDate = toDateStr(year, month, 31);

    const q = query(
      coll,
      where(documentId(), '>=', startDate),
      where(documentId(), '<=', endDate)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (cancelled) return;
        const entries = new Map<string, DayEntry>();
        snapshot.forEach((d) => {
          entries.set(d.id, d.data() as DayEntry);
        });
        setFirestoreData(entries);
        setFirestoreLoading(false);
      },
      () => {
        if (cancelled) return;
        setFirestoreData(getLocalMonthData(year, month));
        setFirestoreLoading(false);
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [year, month, uid]);

  const data = useFirestore ? firestoreData : localData;
  const loading = useFirestore ? firestoreLoading : false;

  const updateStatus = useCallback(async (dateStr: string, category: Category, status: Status) => {
    saveLocal(dateStr, category, status);

    const updater = (prev: Map<string, DayEntry>) => {
      const next = new Map(prev);
      const existing = next.get(dateStr) ?? { gym: 'none', diet: 'none', sleep: 'none' };
      next.set(dateStr, { ...existing, [category]: status });
      return next;
    };

    const coll = getDaysCollection(uid);
    if (isFirebaseConfigured && coll) {
      setFirestoreData(updater);
      const ref = doc(coll, dateStr);
      await setDoc(ref, { [category]: status }, { merge: true });
    } else {
      setLocalData(updater);
    }
  }, [uid]);

  return { data, loading, updateStatus };
}
