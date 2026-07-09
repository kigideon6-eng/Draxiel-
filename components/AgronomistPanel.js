'use client';

import { useState } from 'react';

export default function AgronomistPanel({ profile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isFarmer = profile.role === 'farmer';

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const nextMessages = [...messages, { role: 'user', content: input }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/agronomist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          state: profile.state,
          lga: profile.lga,
          role: profile.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'The assistant did not respond.');
      setMessages([...nextMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">{isFarmer ? 'Help & advisor' : 'Help'}</h2>
      <p className="text-sm text-charcoal/70 mb-4">
        {isFarmer
          ? `Ask how to use any part of FairHarvest, or about planting, pests, disease, or market timing for ${profile.lga}, ${profile.state}.`
          : 'Ask how to use any part of FairHarvest — finding produce, placing an order, or tracking a delivery.'}
      </p>

      <div className="card p-4 mb-4 min-h-[200px] max-h-[400px] overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-charcoal/50">No questions asked yet.</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm p-3 rounded max-w-[85%] ${
              m.role === 'user' ? 'bg-forest text-white ml-auto' : 'bg-cream border border-line'
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <p className="text-sm text-charcoal/50">Thinking...</p>}
      </div>

      {error && <p className="text-sm text-red-700 mb-2">{error}</p>}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isFarmer ? 'e.g. How do I list equipment for hire?' : 'e.g. How do I track my order?'}
          className="flex-1 border border-line rounded px-3 py-2"
        />
        <button type="submit" disabled={loading} className="btn-primary text-sm">
          Send
        </button>
      </form>
    </div>
  );
}
