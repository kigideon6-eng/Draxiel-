'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ListingsPanel({ profile }) {
  const [listings, setListings] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('crop');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [quantity, setQuantity] = useState('');
  const [farmId, setFarmId] = useState('');

  async function loadData() {
    setLoading(true);
    const [{ data: listingData }, { data: farmData }] = await Promise.all([
      supabase
        .from('market_listings')
        .select('*')
        .eq('farmer_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase.from('farms').select('*').eq('owner_id', profile.id),
    ]);
    setListings(listingData || []);
    setFarms(farmData || []);
    setLoading(false);
  }

  useEffect(() => {
    if (profile?.id) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  async function handleAddListing(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const selectedFarm = farms.find((f) => f.id === farmId);

    const { error: insertError } = await supabase.from('market_listings').insert({
      farmer_id: profile.id,
      farm_id: farmId || null,
      item_name: itemName,
      category,
      description,
      price_per_unit: Number(price),
      unit,
      quantity_available: Number(quantity),
      state: selectedFarm ? selectedFarm.state : profile.state,
      lga: selectedFarm ? selectedFarm.lga : profile.lga,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setItemName('');
    setDescription('');
    setPrice('');
    setQuantity('');
    setShowForm(false);
    loadData();
  }

  async function handleCloseListing(id) {
    await supabase.from('market_listings').update({ status: 'closed' }).eq('id', id);
    loadData();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Your listings</h2>
        <button onClick={() => setShowForm((s) => !s)} className="btn-secondary text-sm">
          {showForm ? 'Cancel' : 'New listing'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddListing} className="card p-4 mb-5 space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Item name</label>
            <input
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Fresh cassava tubers"
              className="w-full border border-line rounded px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-line rounded px-3 py-2 bg-white"
              >
                <option value="crop">Crop</option>
                <option value="livestock">Livestock</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">From farm (optional)</label>
              <select
                value={farmId}
                onChange={(e) => setFarmId(e.target.value)}
                className="w-full border border-line rounded px-3 py-2 bg-white"
              >
                <option value="">Use my profile location</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-line rounded px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Price / unit (₦)</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-line rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full border border-line rounded px-3 py-2 bg-white"
              >
                <option value="kg">kg</option>
                <option value="bag">bag</option>
                <option value="basket">basket</option>
                <option value="unit">unit (animal/item)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Quantity available</label>
              <input
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border border-line rounded px-3 py-2"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? 'Publishing...' : 'Publish listing'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-charcoal/60">Loading...</p>
      ) : listings.length === 0 ? (
        <p className="text-sm text-charcoal/60">No listings yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {listings.map((listing) => (
            <div key={listing.id} className="card p-4">
              <div className="flex items-start justify-between">
                <h3 className="font-bold">{listing.item_name}</h3>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    listing.status === 'active'
                      ? 'bg-forest/10 text-forest'
                      : 'bg-gray-200 text-charcoal/60'
                  }`}
                >
                  {listing.status}
                </span>
              </div>
              <p className="text-sm text-charcoal/70 mt-1">
                ₦{Number(listing.price_per_unit).toLocaleString()} / {listing.unit} ·{' '}
                {listing.quantity_available} {listing.unit} available
              </p>
              <p className="text-xs text-charcoal/50 mt-1">
                {listing.lga}, {listing.state}
              </p>
              {listing.status === 'active' && (
                <button
                  onClick={() => handleCloseListing(listing.id)}
                  className="text-sm text-red-700 font-bold mt-2"
                >
                  Close listing
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
