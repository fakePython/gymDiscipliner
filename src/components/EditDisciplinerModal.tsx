import { useEffect, useRef, useState } from 'react';
import type { Discipliner, DisciplinerField } from '../types';
import { MAX_FIELDS } from '../utils/constants';

interface EditDisciplinerModalProps {
  discipliner: Discipliner;
  onSave: (patch: Partial<Pick<Discipliner, 'name' | 'fields'>>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function EditDisciplinerModal({ discipliner, onSave, onDelete, onClose }: EditDisciplinerModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [name, setName] = useState(discipliner.name);
  const [fields, setFields] = useState<DisciplinerField[]>(discipliner.fields);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);


  const updateFieldLabel = (id: string, label: string) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, label } : f)));
  };

  const addField = () => {
    if (fields.length < MAX_FIELDS) {
      setFields((prev) => [...prev, { id: crypto.randomUUID(), label: '' }]);
    }
  };

  const removeField = (id: string) => {
    if (fields.length > 1) {
      setFields((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleSave = () => {
    const patch: Partial<Pick<Discipliner, 'name' | 'fields'>> = {};
    const trimmedName = name.trim();
    if (discipliner.nameEditable && trimmedName && trimmedName !== discipliner.name) {
      patch.name = trimmedName;
    }
    if (discipliner.fieldsEditable) {
      const cleaned = fields.map((f) => ({ ...f, label: f.label.trim() })).filter((f) => f.label.length > 0);
      if (cleaned.length > 0) patch.fields = cleaned;
    }
    if (Object.keys(patch).length > 0) onSave(patch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={ref}
        className="w-full sm:w-[420px] bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Edit {discipliner.name}
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
          {discipliner.nameEditable && (
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tab Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {discipliner.fieldsEditable && (
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                Fields <span className="text-slate-400">({fields.length}/{MAX_FIELDS})</span>
              </label>
              <div className="space-y-2">
                {fields.map((field) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateFieldLabel(field.id, e.target.value)}
                      maxLength={24}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField(field.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {fields.length < MAX_FIELDS && (
                <button
                  type="button"
                  onClick={addField}
                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  + Add field
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          {!discipliner.isPreset && (
            <button
              type="button"
              onClick={() => confirmDelete ? onDelete() : setConfirmDelete(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                confirmDelete
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
        {confirmDelete && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-3 text-center">
            This will delete all calendar data for this discipliner.
          </p>
        )}
      </div>
    </div>
  );
}
