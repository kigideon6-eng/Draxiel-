use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from '../lib/auth';
import { APP_NAME } from '../lib/config';

export default function DashboardShell({ profile, tabs, activeTab, children }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  const activeTabLabel = tabs.find((t) => t.key === activeTab)?.label || '';

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-forest text-white relative">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-lg tracking-wide">
            {APP_NAME}
          </Link>

          <div className="flex items-center gap-3" ref={menuRef}>
            <span className="opacity-90 hidden sm:inline text-sm">
              {profile?.full_name} · {profile?.lga}, {profile?.state}
            </span>

            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 bg-forest-light border border-white/20 rounded px-3 py-2 text-sm font-bold"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              {activeTabLabel}
              <svg
                className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-4 top-16 bg-white text-charcoal rounded shadow-lg border border-line w-56 overflow-hidden z-20">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      tab.onClick();
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm font-bold border-b border-line last:border-b-0 ${
                      activeTab === tab.key
                        ? 'bg-forest/10 text-forest'
                        : 'hover:bg-cream'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                <div className="border-t border-line">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 text-sm font-bold text-red-700 hover:bg-cream"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sm:hidden max-w-5xl mx-auto px-4 pb-3 text-xs opacity-90">
          {profile?.full_name} · {profile?.lga}, {profile?.state}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
    }
    
