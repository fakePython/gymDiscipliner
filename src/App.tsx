import { useState } from 'react';
import { CalendarHeader } from './components/CalendarHeader';
import { Calendar } from './components/Calendar';
import { StatusModal } from './components/StatusModal';
import { useMonthData } from './hooks/useMonthData';
import { useTheme } from './hooks/useTheme';
import type { Category, Status } from './types';

function App() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<{ dateStr: string; day: number } | null>(null);

  const { data, loading, updateStatus } = useMonthData(year, month);
  const { theme, toggle } = useTheme();

  const handlePrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleDayClick = (dateStr: string, day: number) => {
    setSelectedDate({ dateStr, day });
  };

  const handleUpdate = (dateStr: string, category: Category, status: Status) => {
    updateStatus(dateStr, category, status);
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-2 sm:px-4 lg:px-6">
      <h1 className="text-center text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
        Gym Discipliner
      </h1>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4">
        Track your daily gym, diet & sleep
      </p>

      <CalendarHeader
        year={year}
        month={month}
        theme={theme}
        onPrev={handlePrev}
        onNext={handleNext}
        onToggleTheme={toggle}
      />

      {loading ? (
        <div className="text-center py-20 text-slate-400 dark:text-slate-500">Loading...</div>
      ) : (
        <Calendar
          year={year}
          month={month}
          data={data}
          onDayClick={handleDayClick}
        />
      )}

      {selectedDate && (
        <StatusModal
          dateStr={selectedDate.dateStr}
          day={selectedDate.day}
          entry={data.get(selectedDate.dateStr)}
          onUpdate={handleUpdate}
          onClose={() => setSelectedDate(null)}
        />
      )}

      <div className="mt-4 flex justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded-sm bg-emerald-400/80 dark:bg-emerald-500/70 inline-block" /> Gym
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded-sm bg-amber-300/80 dark:bg-yellow-400/60 inline-block" /> Diet
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded-sm bg-red-400/80 dark:bg-red-500/60 inline-block" /> Sleep
        </span>
      </div>
      <div className="mt-2 flex justify-center gap-4 text-[10px] text-slate-400 dark:text-slate-500">
        <span>Green = Done</span>
        <span>Yellow = Partial</span>
        <span>Red = Skipped</span>
      </div>
    </div>
  );
}

export default App;
