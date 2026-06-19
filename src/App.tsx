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

  const handleTabSelect = (id: string) => {
    setActiveDisciplinerId(id);
    setSelectedDate(null);
  };

  const handleDelete = async (id: string) => {
    await deleteDiscipliner(id);
    if (activeDisciplinerId === id) setActiveDisciplinerId('gym');
    setEditingDisciplinerId(null);
  };

  const editingDiscipliner = editingDisciplinerId
    ? discipliners.find((d) => d.id === editingDisciplinerId)
    : null;

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
          onDayClick={(dateStr, day) => setSelectedDate({ dateStr, day })}
        />
      )}

      {selectedDate && (
        <StatusModal
          dateStr={selectedDate.dateStr}
          day={selectedDate.day}
          discipliner={activeDiscipliner}
          entry={data.get(selectedDate.dateStr)}
          note={notes.get(selectedDate.dateStr)}
          onUpdate={handleUpdate}
          onUpdateNote={updateNote}
          onClose={() => setSelectedDate(null)}
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

      <div className="mt-4 flex justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
        {activeDiscipliner.fields.map((f) => (
          <span key={f.id} className="flex items-center gap-1.5">
            <span className="w-4 h-3 rounded-sm bg-slate-300 dark:bg-slate-600 inline-block" /> {f.label}
          </span>
        ))}
      </div>
      <div className="mt-2 flex justify-center gap-4 text-[10px] text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Done</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Partial</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Skipped</span>
      </div>
    </div>
      } />
    </Routes>
  );
}

export default App;
