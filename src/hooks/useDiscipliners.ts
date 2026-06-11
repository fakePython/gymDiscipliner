import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import type { Discipliner, DisciplinerConfig, DisciplinerField } from '../types';
import { GYM_PRESET, LEARNING_PRESET, MAX_DISCIPLINERS } from '../utils/constants';

const CONFIG_STORAGE_KEY = 'discipliner_config';

function getConfigCollection(uid: string | null) {
  if (!db || !uid) return null;
  return doc(db, 'users', uid, 'disciplinerConfig', 'v1');
}

function loadLocalConfig(): DisciplinerConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DisciplinerConfig;
  } catch { /* ignore */ }
  return { custom: [] };
}

function saveLocalConfig(config: DisciplinerConfig) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

function mergeConfig(config: DisciplinerConfig): Discipliner[] {
  const learningOverride = config.learningOverride ?? {};
  const learning: Discipliner = {
    ...LEARNING_PRESET,
    ...(learningOverride.name ? { name: learningOverride.name } : {}),
    ...(learningOverride.fields ? { fields: learningOverride.fields } : {}),
  };
  return [GYM_PRESET, learning, ...config.custom];
}

export function useDiscipliners(uid: string | null) {
  const [config, setConfig] = useState<DisciplinerConfig>(() => loadLocalConfig());
  const shouldUseFirestore = isFirebaseConfigured && uid != null;
  const [loading, setLoading] = useState(shouldUseFirestore);

  useEffect(() => {
    if (!shouldUseFirestore) return;
    const ref = getConfigCollection(uid);
    if (!ref) return;

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const remote = snap.data() as DisciplinerConfig;
          setConfig(remote);
          saveLocalConfig(remote);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid, shouldUseFirestore]);

  const discipliners = mergeConfig(config);

  const persistConfig = useCallback(async (next: DisciplinerConfig) => {
    saveLocalConfig(next);
    setConfig(next);
    const ref = getConfigCollection(uid);
    if (isFirebaseConfigured && ref) {
      await setDoc(ref, next);
    }
  }, [uid]);

  const createDiscipliner = useCallback((name: string, fieldLabels: string[]) => {
    if (discipliners.length >= MAX_DISCIPLINERS) return;
    const fields: DisciplinerField[] = fieldLabels.map((label) => ({
      id: crypto.randomUUID(),
      label,
    }));
    const newDiscipliner: Discipliner = {
      id: crypto.randomUUID(),
      name,
      fields,
      isPreset: false,
      nameEditable: true,
      fieldsEditable: true,
    };
    const next: DisciplinerConfig = {
      ...config,
      custom: [...config.custom, newDiscipliner],
    };
    persistConfig(next);
  }, [config, discipliners.length, persistConfig]);

  const updateDiscipliner = useCallback((id: string, patch: Partial<Pick<Discipliner, 'name' | 'fields'>>) => {
    if (id === 'gym') return;

    if (id === 'learning') {
      const next: DisciplinerConfig = {
        ...config,
        learningOverride: {
          ...config.learningOverride,
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.fields !== undefined ? { fields: patch.fields } : {}),
        },
      };
      persistConfig(next);
      return;
    }

    const next: DisciplinerConfig = {
      ...config,
      custom: config.custom.map((d) =>
        d.id === id ? { ...d, ...patch } : d
      ),
    };
    persistConfig(next);
  }, [config, persistConfig]);

  const deleteDiscipliner = useCallback(async (id: string) => {
    const target = discipliners.find((d) => d.id === id);
    if (!target || target.isPreset) return;

    const next: DisciplinerConfig = {
      ...config,
      custom: config.custom.filter((d) => d.id !== id),
    };
    await persistConfig(next);

    if (isFirebaseConfigured && uid && db) {
      try {
        const daysRef = collection(db, 'users', uid, 'discipliners', id, 'days');
        const snap = await getDocs(daysRef);
        const deletions = snap.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletions);
      } catch { /* best effort */ }
    }

    const localKey = `discipliner_${id}_days`;
    localStorage.removeItem(localKey);
  }, [config, discipliners, persistConfig, uid]);

  return { discipliners, loading, createDiscipliner, updateDiscipliner, deleteDiscipliner };
}
