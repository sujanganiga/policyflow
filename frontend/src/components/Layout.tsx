import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  title: string;
  children: React.ReactNode;
}

export const Layout = ({ title, children }: LayoutProps) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <Link to="/" className="text-xl font-bold text-brand-700">
              PolicyFlow
            </Link>
            <p className="text-sm text-slate-500">{title}</p>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-slate-600 sm:inline">
                {user.name} ({user.role})
              </span>
              <button
                onClick={() => logout()}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
};
