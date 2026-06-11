import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, onSnapshot, documentId } from 'firebase/firestore';
import { doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import type { DayEntry, Status } from '../types';
import { toDateStr } from '../utils/dateHelpers';

function getStorageKey(disciplinerId: string) {
  return `discipliner_${disciplinerId}_days`;
}

function getDaysCollection(disciplinerId: string, uid: string | null) {
  if (!db || !uid) return null;
  return collection(db, 'users', uid, 'discipliners', disciplinerId, 'days');
}

function getAllLocal(disciplinerId: string): Record<string, DayEntry> {
  try {
    const raw = localStorage.getItem(getStorageKey(disciplinerId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveLocal(disciplinerId: string, dateStr: string, fieldId: string, status: Status) {
  const all = getAllLocal(disciplinerId);
  all[dateStr] = { ...all[dateStr], [fieldId]: status };
  localStorage.setItem(getStorageKey(disciplinerId), JSON.stringify(all));
}

function getLocalMonthData(disciplinerId: string, year: number, month: number): Map<string, DayEntry> {
  const allData = getAllLocal(disciplinerId);
  const prefix = toDateStr(year, month, 1).slice(0, 7);
  const monthData = new Map<string, DayEntry>();
  for (const [key, entry] of Object.entries(allData)) {
    if (key.startsWith(prefix)) {
      monthData.set(key, entry);
    }
  }
  return monthData;
}

function migrateLocalGymData() {
  if (localStorage.getItem('discipliner_ls_migrated')) return;
  const oldKey = 'gymDescipliner_days';
  const newKey = getStorageKey('gym');
  try {
    const old = localStorage.getItem(oldKey);
    if (old && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, old);
    }
  } catch { /* ignore */ }
  localStorage.setItem('discipliner_ls_migrated', '1');
}

async function migrateFirestoreGymMonth(uid: string, year: number, month: number) {
  if (!db) return;
  const flagKey = `discipliner_gym_migrated_${year}-${String(month + 1).padStart(2, '0')}`;
  if (localStorage.getItem(flagKey)) return;

  const startDate = toDateStr(year, month, 1);
  const endDate = toDateStr(year, month, 31);

  try {
    const oldColl = collection(db, 'users', uid, 'days');
    const newColl = collection(db, 'users', uid, 'discipliners', 'gym', 'days');

    const [oldSnap, newSnap] = await Promise.all([
      getDocs(query(oldColl, where(documentId(), '>=', startDate), where(documentId(), '<=', endDate))),
      getDocs(query(newColl, where(documentId(), '>=', startDate), where(documentId(), '<=', endDate))),
    ]);

    if (oldSnap.empty || !newSnap.empty) {
      localStorage.setItem(flagKey, '1');
      return;
    }

    const batch = writeBatch(db);
    oldSnap.docs.forEach((d) => {
      batch.set(doc(newColl, d.id), d.data());
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch { /* best effort */ }

  localStorage.setItem(flagKey, '1');
}

export function useMonthData(disciplinerId: string, year: number, month: number, uid: string | null) {
  if (disciplinerId === 'gym') migrateLocalGymData();

  const useFirestore = isFirebaseConfigured && getDaysCollection(disciplinerId, uid) != null;

  const [firestoreData, setFirestoreData] = useState<Map<string, DayEntry>>(new Map());
  const [firestoreLoading, setFirestoreLoading] = useState(useFirestore);
  const [firestoreKey, setFirestoreKey] = useState(`${disciplinerId}-${year}-${month}-${uid}`);
  const [localData, setLocalData] = useState<Map<string, DayEntry>>(() => getLocalMonthData(disciplinerId, year, month));
  const [localKey, setLocalKey] = useState(`${disciplinerId}-${year}-${month}`);

  const currentLocalKey = `${disciplinerId}-${year}-${month}`;
  if (currentLocalKey !== localKey) {
    setLocalKey(currentLocalKey);
    setLocalData(getLocalMonthData(disciplinerId, year, month));
  }

  const currentFirestoreKey = `${disciplinerId}-${year}-${month}-${uid}`;
  if (useFirestore && currentFirestoreKey !== firestoreKey) {
    setFirestoreKey(currentFirestoreKey);
    setFirestoreLoading(true);
    setFirestoreData(new Map());
  }

  useEffect(() => {
    const coll = getDaysCollection(disciplinerId, uid);
    if (!isFirebaseConfigured || !coll) return;

    let cancelled = false;

    const startDate = toDateStr(year, month, 1);
    const endDate = toDateStr(year, month, 31);

    if (disciplinerId === 'gym' && uid) {
      migrateFirestoreGymMonth(uid, year, month);
    }

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
        setFirestoreData(getLocalMonthData(disciplinerId, year, month));
        setFirestoreLoading(false);
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [disciplinerId, year, month, uid]);

  const data = useFirestore ? firestoreData : localData;
  const loading = useFirestore ? firestoreLoading : false;

  const updateStatus = useCallback(async (dateStr: string, fieldId: string, status: Status) => {
    saveLocal(disciplinerId, dateStr, fieldId, status);

    const updater = (prev: Map<string, DayEntry>) => {
      const next = new Map(prev);
      const existing = next.get(dateStr) ?? {};
      next.set(dateStr, { ...existing, [fieldId]: status });
      return next;
    };

    const coll = getDaysCollection(disciplinerId, uid);
    if (isFirebaseConfigured && coll) {
      setFirestoreData(updater);
      const ref = doc(coll, dateStr);
      await setDoc(ref, { [fieldId]: status }, { merge: true });
    } else {
      setLocalData(updater);
    }
  }, [disciplinerId, uid]);

  return { data, loading, updateStatus };
}
