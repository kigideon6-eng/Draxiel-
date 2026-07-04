'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { NIGERIA_STATES } from '../lib/nigeriaStatesLgas';

export default function MarketplacePanel({ profile, onOrderPlaced }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState('');
  const [orderingId, setOrderingId] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadListings() {
    setLoading(true);
    let query = supabase
      .from('market_listings')
      .select('*, profiles!market_listings_farmer_id_fkey(full_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (stateFilter) query = query.eq('state', stateFilter);

    const { data } = await query;
    setListings(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateFilter]);

  async function handlePlaceOrder(listing) {
    setError('');
    if (!quantity || Number(quantity) <= 0) {
      setError('Enter a valid quantity.');
      return;
    }
    if (Number(quantity) > Number(listing.quantity_available)) {
      setError('That is more than what is available.');
      return;
    }

    setSaving(true);
    const { error: orderError } = await supabase.from('orders').insert({
      listing_id: listing.id,
      buyer_id: profile.id,
      farmer_id: listing.farmer_id,
      quantity: Number(quantity),
      agreed_price: listing.price_per_unit,
      delivery_address: address,
    });
    setSaving(false);

    if (orderError) {
      setError(orderError.message);
      return;
    }

    setOrderingId(null);
    setQuantity('');
    setAddress('');
    if (onOrderPlaced) onOrderPlaced();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold">Marketplace</h2>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="border border-line rounded px-3 py-2 text-sm bg-white"
        >
          <option value="">All states</option>
          {NIGERIA_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-charcoal/60">Loading...</p>
      ) : listings.length === 0 ? (
        <p className="text-sm text-charcoal/60">No active listings right now.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {listings.map((listing) => (
            <div key={listing.id} className="card p-4">
              <h3 className="font-bold">{listing.item_name}</h3>
              <p className="text-sm text-charcoal/70">
                by {listing.profiles?.full_name || 'Farmer'} · {listing.lga}, {listing.state}
              </p>
              {listing.description && (
                <p className="text-sm text-charcoal/70 mt-1">{listing.description}</p>
              )}
              <p className="text-sm font-bold mt-2">
                ₦{Number(listing.price_per_unit).toLocaleString()} / {listing.unit} ·{' '}
                {listing.quantity_available} {listing.unit} available
              </p>

              {orderingId === listing.id ? (
                <div className="mt-3 space-y-2 border-t border-line pt-3">
                  <input
                    type="number"
                    placeholder={`Quantity (${listing.unit})`}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full border border-line rounded px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Delivery address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-line rounded px-3 py-2 text-sm"
                  />
                  {error && <p className="text-xs text-red-700">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePlaceOrder(listing)}
                      disabled={saving}
                      className="btn-primary text-xs"
                    >
                      {saving ? 'Placing...' : 'Confirm order'}
                    </button>
                    <button
                      onClick={() => setOrderingId(null)}
                      className="btn-secondary text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setOrderingId(listing.id)}
                  className="btn-primary text-xs mt-3"
                >
                  Place order
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
      }
