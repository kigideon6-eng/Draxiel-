'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(data || []);
  }

  useEffect(() => {
    if (!userId) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function handleOpen() {
    setOpen((o) => !o);
    if (!open && unreadCount > 0) {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
      loadNotifications();
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={handleOpen} className="relative p-2 text-white" aria-label="Notifications">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-gold text-forest text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 bg-white text-charcoal rounded shadow-lg border border-line w-72 max-h-80 overflow-y-auto z-50">
          {notifications.length === 0 ? (
            <p className="text-sm text-charcoal/60 p-4">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-3 border-b border-line last:border-b-0 text-sm">
                {n.message}
                <p className="text-xs text-charcoal/50 mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
  }
