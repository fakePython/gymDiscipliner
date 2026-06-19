import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, onSnapshot, documentId } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { toDateStr } from '../utils/dateHelpers';

function getNotesKey(disciplinerId: string) {
  return `discipliner_${disciplinerId}_notes`;
}

function getNotesCollection(disciplinerId: string, uid: string | null) {
  if (!db || !uid) return null;
  return collection(db, 'users', uid, 'discipliners', disciplinerId, 'notes');
}

function getAllLocalNotes(disciplinerId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(getNotesKey(disciplinerId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveLocalNote(disciplinerId: string, dateStr: string, note: string) {
  const all = getAllLocalNotes(disciplinerId);
  if (note) {
    all[dateStr] = note;
  } else {
    delete all[dateStr];
  }
  localStorage.setItem(getNotesKey(disciplinerId), JSON.stringify(all));
}

function getLocalMonthNotes(disciplinerId: string, year: number, month: number): Map<string, string> {
  const allData = getAllLocalNotes(disciplinerId);
  const prefix = toDateStr(year, month, 1).slice(0, 7);
  const monthNotes = new Map<string, string>();
  for (const [key, note] of Object.entries(allData)) {
    if (key.startsWith(prefix)) monthNotes.set(key, note);
  }
  return monthNotes;
}

export function useNotes(disciplinerId: string, year: number, month: number, uid: string | null) {
  const useFirestore = isFirebaseConfigured && getNotesCollection(disciplinerId, uid) != null;

  const [firestoreNotes, setFirestoreNotes] = useState<Map<string, string>>(new Map());
  const [firestoreKey, setFirestoreKey] = useState(`${disciplinerId}-${year}-${month}-${uid}`);
  const [localNotes, setLocalNotes] = useState<Map<string, string>>(() =>
    getLocalMonthNotes(disciplinerId, year, month)
  );
  const [localKey, setLocalKey] = useState(`${disciplinerId}-${year}-${month}`);

  const currentLocalKey = `${disciplinerId}-${year}-${month}`;
  if (currentLocalKey !== localKey) {
    setLocalKey(currentLocalKey);
    setLocalNotes(getLocalMonthNotes(disciplinerId, year, month));
  }

  const currentFirestoreKey = `${disciplinerId}-${year}-${month}-${uid}`;
  if (useFirestore && currentFirestoreKey !== firestoreKey) {
    setFirestoreKey(currentFirestoreKey);
    setFirestoreNotes(new Map());
  }

  useEffect(() => {
    const coll = getNotesCollection(disciplinerId, uid);
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
        const notes = new Map<string, string>();
        snapshot.forEach((d) => {
          const text = (d.data() as { text?: string }).text;
          if (text) notes.set(d.id, text);
        });
        setFirestoreNotes(notes);
      },
      () => {
        if (cancelled) return;
        setFirestoreNotes(getLocalMonthNotes(disciplinerId, year, month));
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [disciplinerId, year, month, uid]);

  const notes = useFirestore ? firestoreNotes : localNotes;

  const updateNote = useCallback(async (dateStr: string, note: string) => {
    saveLocalNote(disciplinerId, dateStr, note);

    const updater = (prev: Map<string, string>) => {
      const next = new Map(prev);
      if (note) {
        next.set(dateStr, note);
      } else {
        next.delete(dateStr);
      }
      return next;
    };

    const coll = getNotesCollection(disciplinerId, uid);
    if (isFirebaseConfigured && coll) {
      setFirestoreNotes(updater);
      const ref = doc(coll, dateStr);
      await setDoc(ref, { text: note }, { merge: false });
    } else {
      setLocalNotes(updater);
    }
  }, [disciplinerId, uid]);

  return { notes, updateNote };
}
