import { useAuth } from '../../hooks/useAuth';
import { useAdminRole } from '../../hooks/useAdminRole';
import { isFirebaseConfigured } from '../../firebase';

interface Props {
  children: React.ReactNode;
}

// In local dev without Firebase, ?admin=1 bypasses the auth guard so the UI can be tested.
const devBypass = !isFirebaseConfigured && new URLSearchParams(window.location.search).get('admin') === '1';

export function AdminGuard({ children }: Props) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole(user?.uid ?? null);

  if (devBypass) return <>{children}</>;

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400 dark:text-slate-500">
        Loading...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">403</h1>
        <p className="text-slate-500 dark:text-slate-400">
          {!user ? 'You must be signed in to access this page.' : 'You do not have permission to access this page.'}
        </p>
        <a href="/gymDiscipliner/" className="text-sm text-blue-500 underline">
          Go back to the app
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
