'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function BuyerRecordsPanel({ profile }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [entryType, setEntryType] = useState('debit');
  const [category, setCategory] = useState('purchase');
  const [notes, setNotes] = useState('');
  const [entryProject, setEntryProject] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');

  async function loadProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('farmer_id', profile.id)
      .order('created_at', { ascending: false });
    setProjects(data || []);
  }

  async function loadEntries() {
    setLoading(true);
    let query = supabase
      .from('expenses')
      .select('*, projects(name)')
      .eq('farmer_id', profile.id)
      .order('created_at', { ascending: false });

    if (selectedProject !== 'all') {
      query = query.eq('project_id', selectedProject);
    }

    const { data } = await query;
    setEntries(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (profile?.id) loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, selectedProject]);

  const totalDebit = entries
    .filter((e) => e.entry_type === 'debit')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalCredit = entries
    .filter((e) => e.entry_type === 'credit')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const net = totalCredit - totalDebit;

  async function handleCreateProject(e) {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    await supabase.from('projects').insert({
      farmer_id: profile.id,
      name: newProjectName.trim(),
      project_type: 'trade',
    });
    setNewProjectName('');
    setShowNewProject(false);
    loadProjects();
  }

  async function handleUseAiRead(file) {
    setReading(true);
    setError('');
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/read-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDescription(data.description || '');
      setAmount(String(data.amount || ''));
    } catch (err) {
      setError('Could not auto-read that receipt. You can still type the details manually.');
    } finally {
      setReading(false);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setReceiptFile(file);
    handleUseAiRead(file);
  }

  async function handleSaveEntry(e) {
    e.preventDefault();
    setError('');
    if (!description.trim() || !amount) {
      setError('Enter a description and amount.');
      return;
    }

    setSaving(true);
    let receiptUrl = null;

    if (receiptFile) {
      const fileName = `${profile.id}/${Date.now()}-${receiptFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
        receiptUrl = urlData.publicUrl;
      }
    }

    const { error: insertError } = await supabase.from('expenses').insert({
      farmer_id: profile.id,
      project_id: entryProject || null,
      description: description.trim(),
      amount: Number(amount),
      entry_type: entryType,
      category,
      notes: notes.trim() || null,
      receipt_url: receiptUrl,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setDescription('');
    setAmount('');
    setNotes('');
    setReceiptFile(null);
    setShowForm(false);
    loadEntries();
  }

  async function handleDelete(id) {
    await supabase.from('expenses').delete().eq('id', id);
    loadEntries();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Trading records</h2>
      <p className="text-sm text-charcoal/70 mb-4">
        Track what you buy and what you resell, per trade venture. Upload a receipt for the
        AI to auto-fill details, or type it in yourself.
      </p>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="border border-line rounded px-3 py-2 text-sm bg-white"
        >
          <option value="all">All ventures</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button onClick={() => setShowNewProject((s) => !s)} className="btn-secondary text-xs">
          {showNewProject ? 'Cancel' : 'New venture'}
        </button>
      </div>

      {showNewProject && (
        <form onSubmit={handleCreateProject} className="card p-4 mb-4 flex gap-2 flex-wrap items-end">
          <div>
            <label className="block text-xs font-bold mb-1">Venture name</label>
            <input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Palm oil resale, Lagos market run"
              className="border border-line rounded px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="btn-primary text-sm">Create</button>
        </form>
      )}

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card p-3 text-center">
          <p className="text-xs text-charcoal/60">Total bought</p>
          <p className="font-bold text-red-700">₦{totalDebit.toLocaleString()}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-charcoal/60">Total resold</p>
          <p className="font-bold text-forest">₦{totalCredit.toLocaleString()}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-charcoal/60">Net</p>
          <p className={`font-bold ${net >= 0 ? 'text-forest' : 'text-red-700'}`}>
            ₦{net.toLocaleString()}
          </p>
        </div>
      </div>

      <button onClick={() => setShowForm((s) => !s)} className="btn-primary text-sm mb-4">
        {showForm ? 'Cancel' : '+ Add entry'}
      </button>

      {showForm && (
        <form onSubmit={handleSaveEntry} className="card p-4 mb-5 space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEntryType('debit');
                setCategory('purchase');
              }}
              className={`flex-1 py-2 text-sm font-bold rounded border ${
                entryType === 'debit' ? 'bg-red-700 text-white border-red-700' : 'border-line'
              }`}
            >
              Money out (bought)
            </button>
            <button
              type="button"
              onClick={() => {
                setEntryType('credit');
                setCategory('resale');
              }}
              className={`flex-1 py-2 text-sm font-bold rounded border ${
                entryType === 'credit' ? 'bg-forest text-white border-forest' : 'border-line'
              }`}
            >
              Money in (resold)
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Attach a receipt (optional)</label>
            <input type="file" accept="image/*" onChange={handleFileSelect} className="text-sm" />
            {reading && <p className="text-xs text-charcoal/60 mt-1">Reading receipt...</p>}
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">What was this for?</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Bought 50kg cassava, Resold 30kg to shop"
              className="w-full border border-line rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Amount (₦)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-line rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Venture</label>
              <select
                value={entryProject}
                onChange={(e) => setEntryProject(e.target.value)}
                className="w-full border border-line rounded px-3 py-2 text-sm bg-white"
              >
                <option value="">No venture</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any extra detail — who you bought from or sold to"
              className="w-full border border-line rounded px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-xs text-red-700">{error}</p>}

          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving...' : 'Save entry'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-charcoal/60">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-charcoal/60">No records yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="card p-4 flex items-start justify-between">
              <div>
                <p className="font-bold">{entry.description}</p>
                <p className="text-xs text-charcoal/60">
                  {entry.projects?.name || 'No venture'}
                </p>
                {entry.notes && <p className="text-xs text-charcoal/60 mt-1">{entry.notes}</p>}
                {entry.receipt_url && (
                  <a
                    href={entry.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-forest underline"
                  >
                    View receipt
                  </a>
                )}
              </div>
              <div className="text-right">
                <p className={`font-bold ${entry.entry_type === 'credit' ? 'text-forest' : 'text-red-700'}`}>
                  {entry.entry_type === 'credit' ? '+' : '-'}₦{Number(entry.amount).toLocaleString()}
                </p>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-xs text-red-700 font-bold mt-1"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
      }
