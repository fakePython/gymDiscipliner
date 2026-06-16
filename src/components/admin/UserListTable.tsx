import type { AdminUser } from '../../hooks/useAdminData';

interface Props {
  users: AdminUser[];
  onSelect: (user: AdminUser) => void;
  selectedUid: string | null;
}

export function UserListTable({ users, onSelect, selectedUid }: Props) {
  function fmt(d: Date | null) {
    if (!d) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Users ({users.length})</h2>
      </div>
      {users.length === 0 ? (
        <p className="px-5 py-8 text-sm text-center text-slate-400">No users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-5 py-2 font-medium">Email</th>
                <th className="px-5 py-2 font-medium">Joined</th>
                <th className="px-5 py-2 font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.uid}
                  onClick={() => onSelect(u)}
                  className={`cursor-pointer border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors ${
                    selectedUid === u.uid ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <td className="px-5 py-3 text-slate-800 dark:text-slate-100">{u.displayName ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{u.email ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{fmt(u.createdAt)}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{fmt(u.lastActive)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
