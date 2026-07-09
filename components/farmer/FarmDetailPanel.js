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

  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [pastItemNames, setPastItemNames] = useState([]);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetQuantity, setAssetQuantity] = useState('');
  const [assetUnit, setAssetUnit] = useState('');
  const [savingAsset, setSavingAsset] = useState(false);
  const [assetError, setAssetError] = useState('');

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
    const { data: farmProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('farm_id', farm.id);

    const projectIds = (farmProjects || []).map((p) => p.id);

    if (projectIds.length === 0) {
      setEntries([]);
      setLoadingEntries(false);
      return;
    }

    const { data } = await supabase
      .from('expenses')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });
    setEntries(data || []);
    setLoadingEntries(false);
  }

  async function loadAssets() {
    setLoadingAssets(true);
    const { data } = await supabase
      .from('farm_assets')
      .select('*')
      .eq('farm_id', farm.id)
      .order('created_at', { ascending: false });
    setAssets(data || []);
    setLoadingAssets(false);
  }

  async function loadPastItemNames() {
    const { data } = await supabase
      .from('farm_assets')
      .select('item_name')
      .eq('owner_id', profile.id);
    const unique = Array.from(new Set((data || []).map((a) => a.item_name)));
    setPastItemNames(unique);
  }

  useEffect(() => {
    loadListings();
    loadEntries();
    loadAssets();
    loadPastItemNames();
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

  async function handleAddAsset(e) {
    e.preventDefault();
    setAssetError('');
    if (!assetName.trim()) {
      setAssetError('Enter what it is (e.g. Rice, Sheep, Storage shed).');
      return;
    }
    setSavingAsset(true);
    const { error: insertError } = await supabase.from('farm_assets').insert({
      farm_id: farm.id,
      owner_id: profile.id,
      item_name: assetName.trim(),
      quantity: assetQuantity ? Number(assetQuantity) : null,
      unit: assetUnit.trim() || null,
    });
    setSavingAsset(false);

    if (insertError) {
      setAssetError(insertError.message);
      return;
    }

    setAssetName('');
    setAssetQuantity('');
    setAssetUnit('');
    setShowAssetForm(false);
    loadAssets();
    loadPastItemNames();
  }

  async function handleDeleteAsset(id) {
    await supabase.from('farm_assets').delete().eq('id', id);
    loadAssets();
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
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold">What&apos;s on this farm</h3>
          <button
            onClick={() => setShowAssetForm((s) => !s)}
            className="btn-secondary text-xs"
          >
            {showAssetForm ? 'Cancel' : '+ Add'}
          </button>
        </div>
        <p className="text-xs text-charcoal/60 mb-3">
          Crops planted, livestock, equipment, structures — anything on this farm.
        </p>

        {showAssetForm && (
          <form onSubmit={handleAddAsset} className="bg-cream border border-line rounded p-3 mb-4 space-y-3">
            <div>
              <label className="block text-xs font-bold mb-1">What is it</label>
              <input
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="e.g. Rice, Sheep, Storage shed"
                list="past-asset-names"
                className="w-full border border-line rounded px-3 py-2 text-sm bg-white"
              />
              <datalist id="past-asset-names">
                {pastItemNames.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Quantity</label>
                <input
                  type="number"
                  step="0.1"
                  value={assetQuantity}
                  onChange={(e) => setAssetQuantity(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full border border-line rounded px-3 py-2 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Unit</label>
                <input
                  value={assetUnit}
                  onChange={(e) => setAssetUnit(e.target.value)}
                  placeholder="e.g. acres, heads"
                  className="w-full border border-line rounded px-3 py-2 text-sm bg-white"
                />
              </div>
            </div>
            {assetError && <p className="text-xs text-red-700">{assetError}</p>}
            <button type="submit" disabled={savingAsset} className="btn-primary text-xs">
              {savingAsset ? 'Saving...' : 'Save'}
            </button>
          </form>
        )}

        {loadingAssets ? (
          <p className="text-xs text-charcoal/50">Loading...</p>
        ) : assets.length === 0 ? (
          <p className="text-xs text-charcoal/50">Nothing added yet.</p>
        ) : (
          <div className="space-y-2">
            {assets.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between bg-cream border border-line rounded px-3 py-2"
              >
                <p className="text-sm">
                  <span className="font-bold">{a.item_name}</span>
                  {a.quantity != null && (
                    <span className="text-charcoal/70">
                      {' '}
                      · {a.quantity} {a.unit || ''}
                    </span>
                  )}
                </p>
                <button
                  onClick={() => handleDeleteAsset(a.id)}
                  className="text-xs text-red-700 font-bold"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-4 mb-5">
        <h3 className="font-bold mb-2">This farm&apos;s money in and out</h3>
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
