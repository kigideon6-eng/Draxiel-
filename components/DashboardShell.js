'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from '../lib/auth';
import { APP_NAME } from '../lib/config';

export default function DashboardShell({ profile, tabs, activeTab, children }) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-forest text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-display font-bold">
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="opacity-90 hidden sm:inline">
              {profile?.full_name} · {profile?.lga}, {profile?.state}
            </span>
            <button onClick={handleSignOut} className="font-bold underline">
              Sign out
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <a
              key={tab.key}
              href={`#${tab.key}`}
              onClick={(e) => {
                e.preventDefault();
                tab.onClick();
              }}
              className={`text-sm font-bold px-3 py-2 whitespace-nowrap border-b-2 ${
                activeTab === tab.key
                  ? 'border-gold text-white'
                  : 'border-transparent text-white/70'
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
