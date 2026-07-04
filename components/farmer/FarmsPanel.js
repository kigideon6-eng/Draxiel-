'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import StateLgaSelect from '../StateLgaSelect';

export default function FarmsPanel({ profile }) {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [state, setState] = useState(profile?.state || '');
  const [lga, setLga] = useState(profile?.lga || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadFarms() {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('farms')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false });
    if (!fetchError) setFarms(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (profile?.id) loadFarms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  async function handleAddFarm(e) {
    e.preventDefault();
    setError('');
    if (!state || !lga) {
      setError('Select the state and LGA for this farm.');
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase.from('farms').insert({
      owner_id: profile.id,
      name,
      state,
      lga,
      size_hectares: size ? Number(size) : null,
    });
    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setName('');
    setSize('');
    setShowForm(false);
    loadFarms();
  }

  async function handleDelete(id) {
    await supabase.from('farms').delete().eq('id', id);
    loadFarms();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Your farms</h2>
        <button onClick={() => setShowForm((s) => !s)} className="btn-secondary text-sm">
          {showForm ? 'Cancel' : 'Add a farm'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddFarm} className="card p-4 mb-5 space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Farm name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Family cassava plot"
              className="w-full border border-line rounded px-3 py-2"
            />
          </div>
          <StateLgaSelect state={state} lga={lga} onStateChange={setState} onLgaChange={setLga} />
          <div>
            <label className="block text-sm font-bold mb-1">Size (hectares, optional)</label>
            <input
              type="number"
              step="0.1"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full border border-line rounded px-3 py-2"
            />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving...' : 'Save farm'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-charcoal/60">Loading...</p>
      ) : farms.length === 0 ? (
        <p className="text-sm text-charcoal/60">
          No farms added yet. Add a farm to start creating listings from it.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {farms.map((farm) => (
            <div key={farm.id} className="card p-4">
              <h3 className="font-bold">{farm.name}</h3>
              <p className="text-sm text-charcoal/70">
                {farm.lga}, {farm.state}
              </p>
              {farm.size_hectares && (
                <p className="text-sm text-charcoal/70">{farm.size_hectares} hectares</p>
              )}
              <button
                onClick={() => handleDelete(farm.id)}
                className="text-sm text-red-700 font-bold mt-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
    }
