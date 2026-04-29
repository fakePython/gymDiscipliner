import type { DayEntry } from '../types';
import { getDaysInMonth, getFirstDayOfWeek, toDateStr } from '../utils/dateHelpers';
import { DayCell } from './DayCell';

interface CalendarProps {
  year: number;
  month: number;
  data: Map<string, DayEntry>;
  onDayClick: (dateStr: string, day: number) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Calendar({ year, month, data, onDayClick }: CalendarProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const blanks = Array.from({ length: firstDay }, (_, i) => (
    <div key={`blank-${i}`} />
  ));

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = toDateStr(year, month, day);
    return (
      <DayCell
        key={dateStr}
        day={day}
        year={year}
        month={month}
        entry={data.get(dateStr)}
        onClick={() => onDayClick(dateStr, day)}
      />
    );
  });

  return (
    <div className="px-1 sm:px-2">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 dark:text-slate-500 py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blanks}
        {days}
      </div>
    </div>
  );
}
