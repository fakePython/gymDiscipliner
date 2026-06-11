import type { DayEntry, DisciplinerField, Status } from '../types';
import { isToday } from '../utils/dateHelpers';

interface DayCellProps {
  day: number;
  year: number;
  month: number;
  fields: DisciplinerField[];
  entry?: DayEntry;
  onClick: () => void;
}

const STATUS_BG: Record<Status, string> = {
  green: 'bg-emerald-400/80 dark:bg-emerald-500/70',
  yellow: 'bg-amber-300/80 dark:bg-yellow-400/60',
  red: 'bg-red-400/80 dark:bg-red-500/60',
  none: '',
};

export function DayCell({ day, year, month, fields, entry, onClick }: DayCellProps) {
  const today = isToday(year, month, day);

  return (
    <button
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-lg min-h-[60px] md:min-h-[90px]
        transition-all cursor-pointer select-none
        hover:ring-2 hover:ring-blue-400/50
        ${today
          ? 'ring-2 ring-blue-500 dark:ring-blue-400'
          : 'ring-1 ring-slate-200 dark:ring-slate-700/50'
        }
        bg-white dark:bg-slate-800/40
      `}
    >
      <div className="absolute inset-0 flex">
        {fields.map((f) => (
          <div key={f.id} className={`flex-1 ${STATUS_BG[entry?.[f.id] ?? 'none']}`} />
        ))}
      </div>
      <span
        className={`
          relative z-10 flex items-center justify-center w-full h-full
          text-lg md:text-xl font-bold
          ${today
            ? 'text-blue-600 dark:text-blue-300'
            : 'text-slate-700 dark:text-slate-200'
          }
        `}
      >
        {day}
      </span>
    </button>
  );
}
