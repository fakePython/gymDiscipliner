import type { Discipliner, Status } from '../types';

export const STATUS_COLORS: Record<Status, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
  none: 'bg-slate-600',
};

export const STATUS_LABELS: Record<Status, string> = {
  green: 'Done',
  yellow: 'Partial',
  red: 'Skipped',
  none: 'Not set',
};

export const MAX_DISCIPLINERS = 5;
export const MAX_FIELDS = 5;

export const GYM_PRESET: Discipliner = {
  id: 'gym',
  name: 'Gym',
  fields: [
    { id: 'gym', label: 'Gym' },
    { id: 'diet', label: 'Diet' },
    { id: 'sleep', label: 'Sleep' },
  ],
  isPreset: true,
  nameEditable: false,
  fieldsEditable: false,
};

export const LEARNING_PRESET: Discipliner = {
  id: 'learning',
  name: 'Learning',
  fields: [
    { id: 'dsa', label: 'DSA' },
    { id: 'systemDesign', label: 'System Design' },
    { id: 'selfProject', label: 'Self Project' },
  ],
  isPreset: true,
  nameEditable: true,
  fieldsEditable: true,
};
