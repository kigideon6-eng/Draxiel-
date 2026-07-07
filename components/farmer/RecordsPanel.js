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

export default function RecordsPanel({ profile }) {
  const [projects, setProjects] = useState([]);
  const [farms, setFarms] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState('crop');
  const [newProjectFarm, setNewProjectFarm] = useState('');

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [entryType, setEntryType] = useState('debit');
  const [category, setCategory] = useState('other');
  const [notes, setNotes] = useState('');
  const [entryProject, setEntryProject] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');

  async function loadFarms() {
    const { data } = await supabase.from('farms').select('id, name').eq('owner_id', profile.id);
    setFarms(data || []);
  }
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
    if (profile?.id) {
      loadProjects();
      loadFarms();
    }
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
      project_type: newProjectType,
      farm_id: newProjectFarm || null,
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
      setCategory(data.category || 'other');
      if (data.entry_type === 'credit' || data.entry_type === 'debit') {
        setEntryType(data.entry_type);
      }
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
      <h2 className="text-xl font-bold mb-1">Farm records</h2>
      <p className="text-sm text-charcoal/70 mb-4">
        Track money in and out, per project.
      </p>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="border border-line rounded px-3 py-2 text-sm bg-white"
        >
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.project_type})
            </option>
          ))}
        </select>
        <button onClick={() => setShowNewProject((s) => !s)} className="btn-secondary text-xs">
          {showNewProject ? 'Cancel' : 'New project'}
        </button>
      </div>

      {showNewProject && (
        <form onSubmit={handleCreateProject} className="card p-4 mb-4 flex gap-2 flex-wrap items-end">
          <div>
            <label className="block text-xs font-bold mb-1">Project name</label>
            <input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Poultry 2026"
              className="border border-line rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Type</label>
            <select
              value={newProjectType}
              onChange={(e) => setNewProjectType(e.target.value)}
              className="border border-line rounded px-3 py-2 text-sm bg-white"
            >
              <option value="crop">Crop</option>
              <option value="livestock">Livestock</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button type="submit" className="btn-primary text-sm">Create</button>
        </form>
      )}

      <div className="card p-3 mb-5 inline-block">
        <div className="flex gap-6 flex-wrap text-xs">
          <div>
            <p className="text-charcoal/60">Spent</p>
            <p className="font-bold text-red-700">₦{totalDebit.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-charcoal/60">Earned</p>
            <p className="font-bold text-forest">₦{totalCredit.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-charcoal/60">{net >= 0 ? 'Profit' : 'Loss'}</p>
            <p className={`font-bold ${net >= 0 ? 'text-forest' : 'text-red-700'}`}>
              ₦{Math.abs(net).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <button onClick={() => setShowForm((s) => !s)} className="btn-primary text-sm mb-6">
        {showForm ? 'Cancel' : '+ Add entry'}
      </button>

      {showForm && (
        <form onSubmit={handleSaveEntry} className="card p-4 mb-6 space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEntryType('debit')}
              className={`flex-1 py-2 text-sm font-bold rounded border ${
                entryType === 'debit' ? 'bg-red-700 text-white border-red-700' : 'border-line'
              }`}
            >
              Money out (spent)
            </button>
            <button
              type="button"
              onClick={() => setEntryType('credit')}
              className={`flex-1 py-2 text-sm font-bold rounded border ${
                entryType === 'credit' ? 'bg-forest text-white border-forest' : 'border-line'
              }`}
            >
              Money in (earned)
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
              placeholder="e.g. Bought fertilizer, Sold 20kg cassava"
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
              <label className="block text-xs font-bold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-line rounded px-3 py-2 text-sm bg-white"
              >
                <option value="seeds">Seeds</option>
                <option value="fertilizer">Fertilizer</option>
                <option value="equipment">Equipment</option>
                <option value="labor">Labor</option>
                <option value="transport">Transport</option>
                <option value="feed">Feed</option>
                <option value="sales">Sales/income</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Which project?</label>
            <select
              value={entryProject}
              onChange={(e) => setEntryProject(e.target.value)}
              className="w-full border border-line rounded px-3 py-2 text-sm bg-white"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any extra detail — e.g. why you bought it, who you sold to"
              className="w-full border border-line rounded px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-xs text-red-700">{error}</p>}

          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving...' : 'Save entry'}
          </button>
        </form>
      )}

      <div className="border-t border-line pt-5">
        <h3 className="text-lg font-bold mb-3">All records</h3>

        {loading ? (
          <p className="text-sm text-charcoal/60">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-charcoal/60">No records yet.</p>
        ) : (
          <div className="overflow-x-auto card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-cream">
                  <th className="text-left p-3">What it was for</th>
                  <th className="text-left p-3 hidden sm:table-cell">Project</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-right p-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-line last:border-b-0">
                    <td className="p-3">
                      {entry.description}
                      {entry.receipt_url && (
                        <a
                          href={entry.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs text-forest underline"
                        >
                          View receipt
                        </a>
                      )}
                    </td>
                    <td className="p-3 hidden sm:table-cell text-charcoal/60">
                      {entry.projects?.name || '—'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          entry.entry_type === 'credit'
                            ? 'bg-forest/10 text-forest'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {entry.entry_type === 'credit' ? 'Money in' : 'Money out'}
                      </span>
                    </td>
                    <td
                      className={`p-3 text-right font-bold ${
                        entry.entry_type === 'credit' ? 'text-forest' : 'text-red-700'
                      }`}
                    >
                      {entry.entry_type === 'credit' ? '+' : '-'}₦
                      {Number(entry.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-cream font-bold">
                  <td className="p-3" colSpan={2}>
                    Total
                  </td>
                  <td className="p-3"></td>
                  <td className={`p-3 text-right ${net >= 0 ? 'text-forest' : 'text-red-700'}`}>
                    ₦{net.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
            }
