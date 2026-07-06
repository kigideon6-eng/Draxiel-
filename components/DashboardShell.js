'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from '../lib/auth';
import { APP_NAME } from '../lib/config';
import Logo from './Logo';
import WeatherWidget from './WeatherWidget';
import NotificationBell from './NotificationBell';
import NotificationBell from './NotificationBell';

export default function DashboardShell({ profile, tabs, activeTab, children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed sm:sticky sm:top-0 z-40 top-0 left-0 h-screen w-64 flex-shrink-0 bg-forest text-white flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg">
            <Logo size={30} />
            {APP_NAME}
          </Link>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                tab.onClick();
                setSidebarOpen(false);
              }}
              className={`w-full text-left px-5 py-3 text-sm sm:text-base font-bold flex items-center gap-3 border-l-4 ${
                activeTab === tab.key
                  ? 'border-gold bg-white/10 text-white'
                  : 'border-transparent text-white/70 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-5 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="text-sm sm:text-base font-bold text-white/80 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="bg-forest text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest-light to-forest opacity-90" />
          <div className="relative px-4 sm:px-8 py-5 sm:py-7 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="sm:hidden p-1 text-white"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Logo size={34} />
              <div>
                <p className="text-xs sm:text-sm uppercase tracking-wide text-gold font-bold">{APP_NAME}</p>
                <h1 className="text-xl sm:text-2xl font-bold font-display">Welcome, {profile?.full_name}</h1>
                <p className="text-sm sm:text-base text-white/70">{profile?.state}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <NotificationBell userId={profile?.id} />
              <div className="flex flex-col items-end gap-2">
              <NotificationBell userId={profile?.id} />
              <WeatherWidget state={profile?.state} lga={profile?.lga} />
            </div>
            </div>
                  <NotificationBell userId={profile?.id} />
          </div>
          <div className="h-1 bg-gold" />
        </header>

        <main className="px-4 sm:px-8 py-6 sm:py-10 max-w-6xl">{children}</main>
      </div>
    </div>
  );
    }
