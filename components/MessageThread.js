'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function MessageThread({ orderId, currentUserId, otherUserId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef(null);

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoading(false);
  }

  async function checkIfSaved() {
    const [a, b] = [currentUserId, otherUserId].sort();
    const { data } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_a', a)
      .eq('user_b', b)
      .maybeSingle();
    setSaved(!!data);
  }

  useEffect(() => {
    loadMessages();
    checkIfSaved();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      order_id: orderId,
      sender_id: currentUserId,
      content: input.trim(),
    });
    setSending(false);
    if (!error) {
      setInput('');
      loadMessages();
    }
  }

  async function handleSaveContact() {
    setSaving(true);
    const [a, b] = [currentUserId, otherUserId].sort();
    const { error } = await supabase.from('conversations').insert({
      user_a: a,
      user_b: b,
    });
    setSaving(false);
    if (!error) setSaved(true);
  }

  return (
    <div className="border-t border-line mt-3 pt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-charcoal/50">Order conversation</span>
        {saved ? (
          <span className="text-xs font-bold text-forest">Saved to contacts ✓</span>
        ) : (
          <button
            onClick={handleSaveContact}
            disabled={saving}
            className="text-xs font-bold text-forest underline"
          >
            {saving ? 'Saving...' : 'Save contact for later'}
          </button>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2 mb-3">
        {loading ? (
          <p className="text-xs text-charcoal/50">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-charcoal/50">No messages yet. Say hello.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`text-sm p-2 rounded max-w-[80%] ${
                m.sender_id === currentUserId
                  ? 'bg-forest text-white ml-auto'
                  : 'bg-cream border border-line'
              }`}
            >
              {m.content}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-line rounded px-3 py-2 text-sm"
        />
        <button type="submit" disabled={sending} className="btn-primary text-xs">
          Send
        </button>
      </form>
    </div>
  );
    }
