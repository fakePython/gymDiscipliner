import type { Status, Category } from '../types';

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

export const CATEGORY_LABELS: Record<Category, string> = {
  gym: 'Gym',
  diet: 'Diet',
  sleep: 'Sleep',
};

export const CATEGORIES: Category[] = ['gym', 'diet', 'sleep'];
