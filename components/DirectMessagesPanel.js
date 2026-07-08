'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function DirectMessagesPanel({ profile }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const bottomRef = useRef(null);

  async function loadConversations() {
    setLoading(true);
    const { data } = await supabase
      .from('conversations')
      .select('*, a:profiles!conversations_user_a_fkey(id,full_name,role), b:profiles!conversations_user_b_fkey(id,full_name,role)')
      .or(`user_a.eq.${profile.id},user_b.eq.${profile.id}`)
      .order('created_at', { ascending: false });
    setConversations(data || []);
    setLoading(false);
  }

  async function loadMessages(convoId) {
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  }

  useEffect(() => {
    if (profile?.id) loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => {
    if (!activeConvo) return;
    loadMessages(activeConvo.id);
    const interval = setInterval(() => loadMessages(activeConvo.id), 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvo]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || !activeConvo) return;
    await supabase.from('direct_messages').insert({
      conversation_id: activeConvo.id,
      sender_id: profile.id,
      content: input.trim(),
    });
    const otherId = activeConvo.a.id === profile.id ? activeConvo.b.id : activeConvo.a.id;
    await supabase.from('notifications').insert({
      user_id: otherId,
      message: 'You have a new message.',
    });
    setInput('');
    loadMessages(activeConvo.id);
  }

  function otherPerson(convo) {
    return convo.a.id === profile.id ? convo.b : convo.a;
  }

  async function handleSearch(e) {
    e.preventDefault();
    setSearchError('');
    setSearchResult(null);
    if (!searchPhone.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, phone')
      .eq('phone', searchPhone.trim())
      .maybeSingle();
    setSearching(false);
    if (!data) {
      setSearchError('No user found with that phone number.');
      return;
    }
    if (data.id === profile.id) {
      setSearchError('That is your own number.');
      return;
    }
    setSearchResult(data);
  }

  async function handleAddContact() {
    if (!searchResult) return;
    setAdding(true);
    const [a, b] = [profile.id, searchResult.id].sort();
    const { error } = await supabase.from('conversations').insert({ user_a: a, user_b: b });
    setAdding(false);
    if (!error || error.code === '23505') {
      setShowAddForm(false);
      setSearchPhone('');
      setSearchResult(null);
      loadConversations();
    } else {
      setSearchError(error.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Contacts & messages</h2>
        {!activeConvo && (
          <button onClick={() => setShowAddForm((s) => !s)} className="btn-secondary text-xs">
            {showAddForm ? 'Cancel' : 'Add contact'}
          </button>
        )}
      </div>

      {showAddForm && !activeConvo && (
        <form onSubmit={handleSearch} className="card p-4 mb-4 space-y-3">
          <label className="block text-sm font-bold">Find by phone number</label>
          <div className="flex gap-2">
            <input
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="080..."
              className="flex-1 border border-line rounded px-3 py-2 text-sm"
            />
            <button type="submit" disabled={searching} className="btn-secondary text-xs">
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          {searchError && <p className="text-xs text-red-700">{searchError}</p>}
          {searchResult && (
            <div className="flex items-center justify-between bg-cream border border-line rounded p-3">
              <div>
                <p className="font-bold text-sm">{searchResult.full_name}</p>
                <p className="text-xs text-charcoal/60 capitalize">{searchResult.role}</p>
              </div>
              <button
                onClick={handleAddContact}
                disabled={adding}
                className="btn-primary text-xs"
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>
          )}
        </form>
      )}

      {!activeConvo ? (
        <div>
          {loading ? (
            <p className="text-sm text-charcoal/60">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-charcoal/60">
              No saved contacts yet. Add one by phone number, or save a contact from an order's
              message thread.
            </p>
          ) : (
            <div className="space-y-2">
              {conversations.map((convo) => {
                const other = otherPerson(convo);
                return (
                  <button
                    key={convo.id}
                    onClick={() => setActiveConvo(convo)}
                    className="w-full text-left card p-4 hover:bg-cream"
                  >
                    <p className="font-bold">{other?.full_name}</p>
                    <p className="text-xs text-charcoal/60 capitalize">{other?.role}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setActiveConvo(null)}
            className="text-sm font-bold text-forest mb-3"
          >
            ← Back to contacts
          </button>
          <div className="card p-4">
            <p className="font-bold mb-3">{otherPerson(activeConvo)?.full_name}</p>
            <div className="max-h-80 overflow-y-auto space-y-2 mb-3">
              {messages.length === 0 ? (
                <p className="text-xs text-charcoal/50">No messages yet. Say hello.</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`text-sm p-2 rounded max-w-[80%] ${
                      m.sender_id === profile.id
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
              <button type="submit" className="btn-primary text-xs">
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
      }
