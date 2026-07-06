'use client';

import { useState } from 'react';

export default function PasswordInput({ id, value, onChange, required, minLength }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        required={required}
        minLength={minLength}
        value={value}
        onChange={onChange}
        className="w-full border border-line rounded px-3 py-2 pr-16"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-forest"
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
          }
