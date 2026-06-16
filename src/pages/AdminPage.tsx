import { useState } from 'react';
import { useAdminData } from '../hooks/useAdminData';
import { GlobalStatsCards } from '../components/admin/GlobalStats';
import { UserListTable } from '../components/admin/UserListTable';
import { UserDetailDrawer } from '../components/admin/UserDetailDrawer';
import type { AdminUser } from '../hooks/useAdminData';
import { useAuth } from '../hooks/useAuth';

export function AdminPage() {
  const { users, globalStats, loading } = useAdminData();
  const { signOut } = useAuth();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm text-blue-500 hover:underline">← App</a>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Admin Dashboard</h1>
        </div>
        <button
          onClick={signOut}
          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading...</div>
        ) : (
          <>
            <GlobalStatsCards stats={globalStats} />
            <UserListTable
              users={users}
              onSelect={setSelectedUser}
              selectedUid={selectedUser?.uid ?? null}
            />
          </>
        )}
      </main>

      <UserDetailDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  );
}
