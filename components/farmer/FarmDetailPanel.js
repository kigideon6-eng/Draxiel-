'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function FarmDetailPanel({ farm, profile, onBack }) {
  const [photoUrl, setPhotoUrl] = useState(farm.photo_url);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  async function loadListings() {
    setLoadingListings(true);
    const { data } = await supabase
      .from('market_listings')
      .select('*')
      .eq('farm_id', farm.id)
      .order('created_at', { ascending: false });
    setListings(data || []);
    setLoadingListings(false);
  }

  async function loadEntries() {
    setLoadingEntries(true);
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('farm_id', farm.id)
      .order('created_at', { ascending: false });
    setEntries(data || []);
    setLoadingEntries(false);
  }

  useEffect(() => {
    loadListings();
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farm.id]);

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    const fileName = `${profile.id}/farm-${farm.id}-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, file);

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
      await supabase.from('farms').update({ photo_url: urlData.publicUrl }).eq('id', farm.id);
      setPhotoUrl(urlData.publicUrl);
    }

    setUploadingPhoto(false);
  }

  const totalDebit = entries
    .filter((e) => e.entry_type === 'debit')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalCredit = entries
    .filter((e) => e.entry_type === 'credit')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const net = totalCredit - totalDebit;

  async function handleDeleteFarm() {
    await supabase.from('farms').delete().eq('id', farm.id);
    onBack();
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm font-bold text-forest mb-4">
        ← Back to all farms
      </button>

      <div className="card p-4 mb-5">
        {photoUrl ? (
          <img src={photoUrl} alt={farm.name} className="w-full h-48 object-cover rounded mb-3" />
        ) : (
          <div className="w-full h-32 bg-cream border border-dashed border-line rounded mb-3 flex items-center justify-center text-sm text-charcoal/50">
            No photo yet
          </div>
        )}
        <label className="btn-secondary text-xs inline-block cursor-pointer">
          {uploadingPhoto ? 'Uploading...' : photoUrl ? 'Change photo' : 'Add a photo'}
          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
        </label>

        <h2 className="text-xl font-bold mt-4">{farm.name}</h2>
        <p className="text-sm text-charcoal/70">
          {farm.lga}, {farm.state}
        </p>
        {farm.size_hectares && (
          <p className="text-sm text-charcoal/70">{farm.size_hectares} hectares</p>
        )}
        <button onClick={handleDeleteFarm} className="text-xs text-red-700 font-bold mt-3">
          Delete this farm
        </button>
      </div>

      <div className="card p-4 mb-5">
        <h3 className="font-bold mb-2">This farm's money in and out</h3>
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
        {loadingEntries ? (
          <p className="text-xs text-charcoal/50 mt-3">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-xs text-charcoal/50 mt-3">
            No records tied to this farm yet. Add entries from Farm Records and pick a project
            linked to this farm.
          </p>
        ) : null}
      </div>

      <div>
        <h3 className="font-bold mb-2">Listings from this farm</h3>
        {loadingListings ? (
          <p className="text-sm text-charcoal/60">Loading...</p>
        ) : listings.length === 0 ? (
          <p className="text-sm text-charcoal/60">
            No listings created from this farm yet. When creating a listing, choose this farm to
            link it here.
          </p>
        ) : (
          <div className="space-y-2">
            {listings.map((listing) => (
              <div key={listing.id} className="card p-3">
                <p className="font-bold text-sm">{listing.item_name}</p>
                <p className="text-xs text-charcoal/60">
                  ₦{Number(listing.price_per_unit).toLocaleString()}/{listing.unit} ·{' '}
                  {listing.quantity_available} {listing.unit} available · {listing.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  }
