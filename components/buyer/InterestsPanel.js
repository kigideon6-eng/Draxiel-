'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function InterestsPanel({ profile, onSaved }) {
  const [interests, setInterests] = useState(profile.product_interests || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const { error } = await supabase
      .from('profiles')
      .update({ product_interests: interests })
      .eq('id', profile.id);
    setSaving(false);
    if (!error) {
      setSaved(true);
      if (onSaved) onSaved(interests);
    }
  }

  return (
    <div className="card p-4 mb-5">
      <h3 className="font-bold mb-2">What are you looking to buy?</h3>
      <p className="text-sm text-charcoal/70 mb-3">
        Type the products you're interested in, separated by commas (e.g. "palm oil, cassava,
        maize"). Matching listings will be shown first.
      </p>
      <form onSubmit={handleSave} className="flex gap-2 flex-wrap">
        <input
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="e.g. palm oil, groundnut"
          className="flex-1 min-w-[200px] border border-line rounded px-3 py-2 text-sm"
        />
        <button type="submit" disabled={saving} className="btn-primary text-sm">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
      {saved && <p className="text-xs text-forest font-bold mt-2">Saved ✓</p>}
    </div>
  );
    }
