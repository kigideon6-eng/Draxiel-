'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, getCurrentProfile } from '../../lib/auth';
import { APP_NAME } from '../../lib/config';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await signIn({ email, password });

    if (signInError) {
      setLoading(false);
      setError(signInError.message || 'Could not sign in. Check your details and try again.');
      return;
    }

    const profile = await getCurrentProfile();
    setLoading(false);

    if (!profile) {
      setError('Signed in, but no profile was found for this account.');
      return;
    }

    router.push(profile.role === 'farmer' ? '/farmer/dashboard' : '/buyer/dashboard');
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center font-display text-xl font-bold text-forest mb-6">
          {APP_NAME}
        </Link>
        <div className="card p-6">
          <h1 className="text-xl font-bold mb-5">Sign in</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-line rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-line rounded px-3 py-2"
              />
            </div>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="text-sm text-center mt-5">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-bold text-forest">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
    }
