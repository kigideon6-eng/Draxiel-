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

export default function ExpensesPanel({ profile }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  async function loadExpenses() {
    setLoading(true);
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('farmer_id', profile.id)
      .order('created_at', { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (profile?.id) loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setUploading(true);
    setPreview(URL.createObjectURL(file));

    try {
      const base64 = await fileToBase64(file);

      const readRes = await fetch('/api/read-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      const readData = await readRes.json();

      if (readData.error) throw new Error(readData.error);

      const fileName = `${profile.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      let receiptUrl = null;
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
        receiptUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase.from('expenses').insert({
        farmer_id: profile.id,
        description: readData.description || 'Untitled expense',
        amount: Number(readData.amount) || 0,
        category: readData.category || 'other',
        receipt_url: receiptUrl,
      });

      if (insertError) throw new Error(insertError.message);

      loadExpenses();
    } catch (err) {
      setError(err.message || 'Something went wrong reading that receipt.');
    } finally {
      setUploading(false);
      setPreview(null);
    }
  }

  async function handleDelete(id) {
    await supabase.from('expenses').delete().eq('id', id);
    loadExpenses();
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Farm expenses</h2>
      <p className="text-sm text-charcoal/70 mb-4">
        Upload a photo of any receipt — the AI reads it and logs the amount automatically.
      </p>

      <div className="card p-4 mb-5">
        <p className="font-bold mb-2">Total spent: ₦{total.toLocaleString()}</p>
        <label className="btn-primary text-sm inline-block cursor-pointer">
          {uploading ? 'Reading receipt...' : 'Upload a receipt photo'}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {preview && (
          <img src={preview} alt="Receipt preview" className="mt-3 max-h-40 rounded border border-line" />
        )}
        {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
      </div>

      {loading ? (
        <p className="text-sm text-charcoal/60">Loading...</p>
      ) : expenses.length === 0 ? (
        <p className="text-sm text-charcoal/60">No expenses logged yet.</p>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp) => (
            <div key={exp.id} className="card p-4 flex items-start justify-between">
              <div>
                <p className="font-bold">{exp.description}</p>
                <p className="text-xs text-charcoal/60 capitalize">{exp.category}</p>
                {exp.receipt_url && (
                  <a
                    href={exp.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-forest underline"
                  >
                    View receipt
                  </a>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold">₦{Number(exp.amount).toLocaleString()}</p>
                <button
                  onClick={() => handleDelete(exp.id)}
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
