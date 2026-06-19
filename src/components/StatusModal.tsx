import { useEffect, useState } from 'react';
import type { Discipliner, DayEntry, Status } from '../types';

interface StatusModalProps {
  dateStr: string;
  day: number;
  discipliner: Discipliner;
  entry?: DayEntry;
  note?: string;
  onUpdate: (dateStr: string, fieldId: string, status: Status) => void;
  onUpdateNote: (dateStr: string, note: string) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: { status: Status; label: string; color: string; activeRing: string }[] = [
  { status: 'green', label: 'Done', color: 'bg-emerald-500', activeRing: 'ring-emerald-400' },
  { status: 'yellow', label: 'Partial', color: 'bg-yellow-400', activeRing: 'ring-yellow-300' },
  { status: 'red', label: 'Skipped', color: 'bg-red-500', activeRing: 'ring-red-400' },
];

const NOTE_MAX = 2000;
const NOTE_WARN = 1900;

export function StatusModal({ dateStr, day, discipliner, entry, note, onUpdate, onUpdateNote, onClose }: StatusModalProps) {
  const [noteText, setNoteText] = useState(note ?? '');

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const [, monthStr] = dateStr.split('-');
  const monthLabel = monthNames[parseInt(monthStr) - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:w-96 bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {monthLabel} {day}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {discipliner.fields.map((field) => {
            const current = entry?.[field.id] ?? 'none';
            return (
              <div key={field.id} className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300 w-28 truncate">
                  {field.label}
                </span>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map(({ status, label, color, activeRing }) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => onUpdate(dateStr, field.id, status === current ? 'none' : status)}
                      title={label}
                      className={`
                        w-10 h-10 rounded-full ${color} transition-all
                        ${current === status ? `ring-3 ${activeRing} scale-110` : 'opacity-40 hover:opacity-70'}
                      `}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Notes</label>
          <textarea
            rows={3}
            maxLength={NOTE_MAX}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onBlur={() => onUpdateNote(dateStr, noteText)}
            placeholder="How did today go…"
            className="w-full resize-none rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <p className={`text-right text-[10px] mt-0.5 ${noteText.length >= NOTE_WARN ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
            {noteText.length} / {NOTE_MAX}
          </p>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center">
          Tap a color to toggle. Tap again to clear.
        </p>
        <div className="mt-2 flex justify-center gap-4 text-[10px] text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Done</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Partial</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Skipped</span>
        </div>
      </div>
    </div>
  );
}
