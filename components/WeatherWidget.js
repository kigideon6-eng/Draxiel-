'use client';

import { useEffect, useState } from 'react';

export default function WeatherWidget({ state, lga }) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/weather?state=${encodeURIComponent(state)}&lga=${encodeURIComponent(lga)}`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setWeather(data);
      } catch {
        setError(true);
      }
    }
    if (state) load();
  }, [state, lga]);

  if (error) return null;
  if (!weather) {
    return <p className="text-xs text-white/60">Loading weather...</p>;
  }

  return (
    <div className="flex items-center gap-2 bg-white/10 rounded px-3 py-1.5">
      <span className="text-lg font-bold">{Math.round(weather.temperature)}°C</span>
      <span className="text-xs text-white/70 capitalize hidden sm:inline">
        {weather.description}
      </span>
    </div>
  );
      }
