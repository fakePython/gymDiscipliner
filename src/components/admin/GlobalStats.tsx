import type { GlobalStats } from '../../hooks/useAdminData';

interface Props {
  stats: GlobalStats;
}

export function GlobalStatsCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <StatCard label="Total Users" value={stats.totalUsers} />
      <StatCard label="Total Day Entries" value={stats.totalEntries} />
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Top Custom Discipliners</p>
        {stats.topDiscipliners.length === 0 ? (
          <p className="text-sm text-slate-400">None yet</p>
        ) : (
          <ul className="space-y-1">
            {stats.topDiscipliners.map((d) => (
              <li key={d.name} className="flex justify-between text-sm text-slate-700 dark:text-slate-300">
                <span>{d.name}</span>
                <span className="text-slate-400">{d.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}
