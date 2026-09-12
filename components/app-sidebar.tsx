import Link from 'next/link';
import { logoutUserAction } from '@/app/actions/auth';

interface AppSidebarProps {
  currentPath: string;
  displayName: string;
  email: string;
}

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Quizzes', href: '/quizzes' },
];

export function AppSidebar({ currentPath, displayName, email }: AppSidebarProps) {
  return (
    <aside className="w-full max-w-[280px] shrink-0 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/20">
          Q
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            QuizRand
          </p>
          <p className="text-sm font-semibold text-zinc-800">Learning hub</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-zinc-200 pt-4">
        <div className="mb-3 rounded-2xl bg-zinc-50 px-3 py-2">
          <p className="text-sm font-semibold text-zinc-800">{displayName}</p>
          <p className="text-xs text-zinc-500">{email}</p>
        </div>

        <form action={logoutUserAction}>
          <button
            type="submit"
            className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
