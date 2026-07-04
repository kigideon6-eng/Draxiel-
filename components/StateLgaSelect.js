'use client';

import { useState, useMemo } from 'react';
import { STATES_LGAS, NIGERIA_STATES } from '../lib/nigeriaStatesLgas';

export default function StateLgaSelect({ state, lga, onStateChange, onLgaChange }) {
  const lgas = useMemo(() => (state ? STATES_LGAS[state] || [] : []), [state]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-bold mb-1" htmlFor="state">
          State
        </label>
        <select
          id="state"
          required
          value={state}
          onChange={(e) => {
            onStateChange(e.target.value);
            onLgaChange('');
          }}
          className="w-full border border-line rounded px-3 py-2 bg-white"
        >
          <option value="">Select state</option>
          {NIGERIA_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold mb-1" htmlFor="lga">
          LGA
        </label>
        <select
          id="lga"
          required
          value={lga}
          onChange={(e) => onLgaChange(e.target.value)}
          disabled={!state}
          className="w-full border border-line rounded px-3 py-2 bg-white disabled:bg-gray-100"
        >
          <option value="">{state ? 'Select LGA' : 'Select a state first'}</option>
          {lgas.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
    }
