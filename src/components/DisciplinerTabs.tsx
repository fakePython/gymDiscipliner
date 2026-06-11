import type { Discipliner } from '../types';
import { MAX_DISCIPLINERS } from '../utils/constants';

interface DisciplinerTabsProps {
  discipliners: Discipliner[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
}

export function DisciplinerTabs({ discipliners, activeId, onSelect, onAdd, onEdit }: DisciplinerTabsProps) {
  const canAdd = discipliners.length < MAX_DISCIPLINERS;

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-3 scrollbar-hide">
      {discipliners.map((d) => {
        const isActive = d.id === activeId;
        const canEdit = d.nameEditable || d.fieldsEditable;
        return (
          <div key={d.id} className="flex-shrink-0 flex items-center">
            <button
              type="button"
              onClick={() => onSelect(d.id)}
              className={`
                px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }
              `}
            >
              {d.name}
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit(d.id)}
                title={`Edit ${d.name}`}
                className="ml-1 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474ZM4.75 14.25h-2a.75.75 0 0 1 0-1.5h2a.75.75 0 0 1 0 1.5Z" />
                </svg>
              </button>
            )}
          </div>
        );
      })}
      {canAdd && (
        <button
          type="button"
          onClick={onAdd}
          title="Add discipliner"
          className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors ml-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
        </button>
      )}
    </div>
  );
}
