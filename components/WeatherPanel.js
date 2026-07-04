'use client';

import { useEffect, useState } from 'react';

export default function WeatherPanel({ profile }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadWeather() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `/api/weather?state=${encodeURIComponent(profile.state)}&lga=${encodeURIComponent(profile.lga)}`
        );
        if (!res.ok) throw new Error('Could not load weather right now.');
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (profile?.state) loadWeather();
  }, [profile?.state, profile?.lga]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Weather</h2>
      <p className="text-sm text-charcoal/70 mb-4">
        {profile.lga}, {profile.state}
      </p>

      {loading && <p className="text-sm text-charcoal/60">Loading weather...</p>}
      {error && (
        <p className="text-sm text-red-700">
          {error} Make sure WEATHER_API_KEY is set — see the README.
        </p>
      )}

      {weather && !error && (
        <div className="card p-5 max-w-sm">
          <p className="text-3xl font-bold">{Math.round(weather.temperature)}°C</p>
          <p className="text-sm text-charcoal/70 mt-1">{weather.description}</p>
          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div>
              <p className="text-charcoal/50">Humidity</p>
              <p className="font-bold">{weather.humidity}%</p>
            </div>
            <div>
              <p className="text-charcoal/50">Rain chance</p>
              <p className="font-bold">{weather.rainChance ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-charcoal/50">Wind</p>
              <p className="font-bold">{weather.windSpeed} m/s</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
