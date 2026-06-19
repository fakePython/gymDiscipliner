import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CalendarHeader } from './components/CalendarHeader';
import { Calendar } from './components/Calendar';
import { StatusModal } from './components/StatusModal';
import { UserMenu } from './components/UserMenu';
import { DisciplinerTabs } from './components/DisciplinerTabs';
import { CreateDisciplinerModal } from './components/CreateDisciplinerModal';
import { EditDisciplinerModal } from './components/EditDisciplinerModal';
import { AdminGuard } from './components/admin/AdminGuard';
import { AdminPage } from './pages/AdminPage';
import { useMonthData } from './hooks/useMonthData';
import { useNotes } from './hooks/useNotes';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useDiscipliners } from './hooks/useDiscipliners';
import { isFirebaseConfigured } from './firebase';
import type { Status } from './types';

function App() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<{ dateStr: string; day: number } | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [activeDisciplinerId, setActiveDisciplinerId] = useState('gym');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDisciplinerId, setEditingDisciplinerId] = useState<string | null>(null);

  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const { discipliners, createDiscipliner, updateDiscipliner, deleteDiscipliner } = useDiscipliners(user?.uid ?? null);
  const activeDiscipliner = discipliners.find((d) => d.id === activeDisciplinerId) ?? discipliners[0];
  const { data, loading, updateStatus } = useMonthData(activeDiscipliner.id, year, month, user?.uid ?? null);
  const { notes, updateNote } = useNotes(activeDiscipliner.id, year, month, user?.uid ?? null);
  const { theme, toggle } = useTheme();

  const handlePrev = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const handleNext = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const handleUpdate = (dateStr: string, fieldId: string, status: Status) => {
    updateStatus(dateStr, fieldId, status);
  };

  const handleDayClick = (dateStr: string, day: number) => {
    if (selectedDate?.dateStr === dateStr) {
      // same day — open status modal for color editing
      setShowStatusModal(true);
    } else {
      // new day — select it, show note panel, close any open modal
      setSelectedDate({ dateStr, day });
      setShowStatusModal(false);
    }
  };

  const handleTabSelect = (id: string) => {
    setActiveDisciplinerId(id);
    setSelectedDate(null);
    setShowStatusModal(false);
  };

  const handleDelete = async (id: string) => {
    await deleteDiscipliner(id);
    if (activeDisciplinerId === id) setActiveDisciplinerId('gym');
    setEditingDisciplinerId(null);
  };

  const editingDiscipliner = editingDisciplinerId
    ? discipliners.find((d) => d.id === editingDisciplinerId)
    : null;

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto py-4 px-2 sm:px-4 lg:px-6">
        <div className="text-center py-20 text-slate-400 dark:text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
      <Route path="*" element={
        <div className="max-w-7xl mx-auto py-4 px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between mb-1">
            <div className="w-24" />
            <h1 className="text-center text-2xl font-bold text-slate-800 dark:text-slate-100">
              Discipliner
            </h1>
            <div className="w-24 flex justify-end">
              {isFirebaseConfigured && (
                <UserMenu user={user} onSignIn={signIn} onSignOut={signOut} />
              )}
            </div>
          </div>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4">
            Track your daily habits
          </p>

          <DisciplinerTabs
            discipliners={discipliners}
            activeId={activeDiscipliner.id}
            onSelect={handleTabSelect}
            onAdd={() => setShowCreateModal(true)}
            onEdit={(id) => setEditingDisciplinerId(id)}
          />

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
              fields={activeDiscipliner.fields}
              data={data}
              selectedDateStr={selectedDate?.dateStr}
              onDayClick={handleDayClick}
            />
          )}

          {/* Day panel — shown below calendar when a date is selected */}
          <div className={`mt-4 transition-all ${selectedDate ? '' : 'opacity-0 pointer-events-none'}`}>
            {selectedDate && (() => {
              const [, monthStr] = selectedDate.dateStr.split('-');
              const monthLabel = monthNames[parseInt(monthStr) - 1];
              const note = notes.get(selectedDate.dateStr);
              return (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {monthLabel} {selectedDate.day}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowStatusModal(true)}
                      className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors"
                    >
                      Edit status
                    </button>
                  </div>
                  {note ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {note}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                      No note for this day. Open status editor to add one.
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {showStatusModal && selectedDate && (
            <StatusModal
              dateStr={selectedDate.dateStr}
              day={selectedDate.day}
              discipliner={activeDiscipliner}
              entry={data.get(selectedDate.dateStr)}
              note={notes.get(selectedDate.dateStr)}
              onUpdate={handleUpdate}
              onUpdateNote={updateNote}
              onClose={() => setShowStatusModal(false)}
            />
          )}

          {showCreateModal && (
            <CreateDisciplinerModal
              onConfirm={(name, fieldLabels) => createDiscipliner(name, fieldLabels)}
              onClose={() => setShowCreateModal(false)}
            />
          )}

          {editingDiscipliner && (
            <EditDisciplinerModal
              discipliner={editingDiscipliner}
              onSave={(patch) => updateDiscipliner(editingDiscipliner.id, patch)}
              onDelete={() => handleDelete(editingDiscipliner.id)}
              onClose={() => setEditingDisciplinerId(null)}
            />
          )}
        </div>
      } />
    </Routes>
  );
}

export default App;
