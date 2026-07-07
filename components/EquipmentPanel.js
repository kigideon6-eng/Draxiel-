'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import StateLgaSelect from './StateLgaSelect';

export default function EquipmentPanel({ profile }) {
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('browse'); // 'browse' | 'mine' | 'bookings'

  const [filterState, setFilterState] = useState(profile?.state || '');
  const [filterLga, setFilterLga] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('per_day');
  const [listingState, setListingState] = useState(profile?.state || '');
  const [listingLga, setListingLga] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [booking, setBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  async function loadListings() {
    setLoading(true);
    let query = supabase
      .from('equipment_listings')
      .select('*, profiles(full_name, phone)')
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (filterState) query = query.eq('state', filterState);
    if (filterLga) query = query.eq('lga', filterLga);

    const { data } = await query;
    setListings(data || []);
    setLoading(false);
  }

  async function loadMyListings() {
    const { data } = await supabase
      .from('equipment_listings')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false });
    setMyListings(data || []);
  }

  async function loadMyBookings() {
    const { data } = await supabase
      .from('equipment_bookings')
      .select('*, equipment_listings(item_name, price_unit), owner:profiles!equipment_bookings_owner_id_fkey(full_name, phone)')
      .eq('renter_id', profile.id)
      .order('created_at', { ascending: false });
    setMyBookings(data || []);
  }

  useEffect(() => {
    if (profile?.id) {
      loadListings();
      loadMyListings();
      loadMyBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, filterState, filterLga]);

  async function handleCreateListing(e) {
    e.preventDefault();
    setError('');
    if (!itemName.trim() || !price || !listingState || !listingLga) {
      setError('Please fill in the item name, price, state, and LGA.');
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase.from('equipment_listings').insert({
      owner_id: profile.id,
      item_name: itemName.trim(),
      description: description.trim() || null,
      price: Number(price),
      price_unit: priceUnit,
      state: listingState,
      lga: listingLga,
    });
    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setItemName('');
    setDescription('');
    setPrice('');
    setShowForm(false);
    loadMyListings();
    loadListings();
  }

  async function handleDeleteListing(id) {
    await supabase.from('equipment_listings').delete().eq('id', id);
    loadMyListings();
    loadListings();
  }

  async function handleStartBooking(listing) {
    setBooking(listing);
    setBookingError('');
  }

  async function handleConfirmBooking() {
    if (!booking) return;
    setBookingLoading(true);
    setBookingError('');

    try {
      const { data: newBooking, error: bookingInsertError } = await supabase
        .from('equipment_bookings')
        .insert({
          listing_id: booking.id,
          renter_id: profile.id,
          owner_id: booking.owner_id,
          amount: booking.price,
        })
        .select()
        .single();

      if (bookingInsertError) throw new Error(bookingInsertError.message);

      const { data: authUser } = await supabase.auth.getUser();
      const email = authUser?.user?.email;

      if (!email) throw new Error('Could not find your account email.');

      const res = await fetch('/api/equipment-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: newBooking.id,
          amount: booking.price,
          email,
        }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      window.location.href = data.authorizationUrl;
    } catch (err) {
      setBookingError(err.message || 'Could not start payment.');
      setBookingLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Equipment for hire</h2>
      <p className="text-sm text-charcoal/70 mb-4">
        Rent a tractor, plough, sprayer, or other equipment from someone nearby — or list your
        own for other farmers to hire.
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setView('browse')}
          className={`text-sm font-bold px-4 py-2 rounded ${
            view === 'browse' ? 'bg-forest text-white' : 'btn-secondary'
          }`}
        >
          Browse
        </button>
        <button
          onClick={() => setView('mine')}
          className={`text-sm font-bold px-4 py-2 rounded ${
            view === 'mine' ? 'bg-forest text-white' : 'btn-secondary'
          }`}
        >
          My listings
        </button>
        <button
          onClick={() => setView('bookings')}
          className={`text-sm font-bold px-4 py-2 rounded ${
            view === 'bookings' ? 'bg-forest text-white' : 'btn-secondary'
          }`}
        >
          My bookings
        </button>
      </div>

      {view === 'browse' && (
        <div>
          <div className="card p-4 mb-4">
            <StateLgaSelect
              state={filterState}
              lga={filterLga}
              onStateChange={setFilterState}
              onLgaChange={setFilterLga}
            />
          </div>

          {loading ? (
            <p className="text-sm text-charcoal/60">Loading...</p>
          ) : listings.length === 0 ? (
            <p className="text-sm text-charcoal/60">
              No equipment listed for this area yet. Try a different state or LGA, or list your
              own equipment under &quot;My listings&quot;.
            </p>
          ) : (
            <div className="space-y-3">
              {listings.map((item) => (
                <div key={item.id} className="card p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-bold">{item.item_name}</p>
                      {item.description && (
                        <p className="text-sm text-charcoal/70 mt-1">{item.description}</p>
                      )}
                      <p className="text-xs text-charcoal/60 mt-1">
                        {item.lga}, {item.state} · Owner: {item.profiles?.full_name || 'Unknown'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-forest">
                        ₦{Number(item.price).toLocaleString()}
                      </p>
                      <p className="text-xs text-charcoal/60 mb-2">
                        {item.price_unit === 'per_day' ? 'per day' : 'per acre'}
                      </p>
                      <button
                        onClick={() => handleStartBooking(item)}
                        className="btn-primary text-xs"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'mine' && (
        <div>
          <button onClick={() => setShowForm((s) => !s)} className="btn-primary text-sm mb-4">
            {showForm ? 'Cancel' : '+ List equipment'}
          </button>

          {showForm && (
            <form onSubmit={handleCreateListing} className="card p-4 mb-6 space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Equipment name</label>
                <input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Tractor with plough attachment"
                  className="w-full border border-line rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Condition, capacity, anything a renter should know"
                  className="w-full border border-line rounded px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Price (₦)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full border border-line rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Price unit</label>
                  <select
                    value={priceUnit}
                    onChange={(e) => setPriceUnit(e.target.value)}
                    className="w-full border border-line rounded px-3 py-2 text-sm bg-white"
                  >
                    <option value="per_day">Per day</option>
                    <option value="per_acre">Per acre</option>
                  </select>
                </div>
              </div>

              <StateLgaSelect
                state={listingState}
                lga={listingLga}
                onStateChange={setListingState}
                onLgaChange={setListingLga}
              />

              {error && <p className="text-xs text-red-700">{error}</p>}

              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? 'Saving...' : 'List equipment'}
              </button>
            </form>
          )}

          {myListings.length === 0 ? (
            <p className="text-sm text-charcoal/60">You haven&apos;t listed any equipment yet.</p>
          ) : (
            <div className="space-y-3">
              {myListings.map((item) => (
                <div key={item.id} className="card p-4 flex justify-between items-start gap-3">
                  <div>
                    <p className="font-bold">{item.item_name}</p>
                    <p className="text-xs text-charcoal/60 mt-1">
                      {item.lga}, {item.state} · ₦{Number(item.price).toLocaleString()}{' '}
                      {item.price_unit === 'per_day' ? '/ day' : '/ acre'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteListing(item.id)}
                    className="text-xs font-bold text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'bookings' && (
        <div>
          {myBookings.length === 0 ? (
            <p className="text-sm text-charcoal/60">
              You haven&apos;t booked any equipment yet. Browse available equipment to get
              started.
            </p>
          ) : (
            <div className="space-y-3">
              {myBookings.map((b) => (
                <div key={b.id} className="card p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-bold">
                        {b.equipment_listings?.item_name || 'Equipment'}
                      </p>
                      <p className="text-xs text-charcoal/60 mt-1">
                        Owner: {b.owner?.full_name || 'Unknown'}
                        {b.owner?.phone ? ` · ${b.owner.phone}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-forest">
                        ₦{Number(b.amount).toLocaleString()}
                      </p>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded inline-block mt-1 ${
                          b.escrow_status === 'paid'
                            ? 'bg-forest/10 text-forest'
                            : 'bg-gold/10 text-gold'
                        }`}
                      >
                        {b.escrow_status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {booking && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2">Confirm booking</h3>
            <p className="text-sm text-charcoal/70 mb-1">{booking.item_name}</p>
            <p className="text-sm text-charcoal/70 mb-4">
              Price: ₦{Number(booking.price).toLocaleString()}{' '}
              {booking.price_unit === 'per_day' ? '/ day' : '/ acre'}
            </p>
            <p className="text-xs text-charcoal/60 mb-4">
              A 3% platform fee will be added at checkout.
            </p>
            {bookingError && <p className="text-xs text-red-700 mb-3">{bookingError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setBooking(null)}
                className="btn-secondary text-sm flex-1"
                disabled={bookingLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                className="btn-primary text-sm flex-1"
                disabled={bookingLoading}
              >
                {bookingLoading ? 'Starting...' : 'Pay & book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
