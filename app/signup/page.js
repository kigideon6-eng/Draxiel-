'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import StateLgaSelect from '../../components/StateLgaSelect';
import PasswordInput from '../../components/PasswordInput';
import { signUp } from '../../lib/auth';
import { APP_NAME } from '../../lib/config';

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'buyer' ? 'buyer' : 'farmer';

  const [role, setRole] = useState(initialRole);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!state || !lga) {
      setError('Please select your state and LGA.');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp({
      email,
      password,
      role,
      fullName,
      phone,
      state,
      lga,
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message || 'Something went wrong. Please try again.');
      return;
    }

    router.push(role === 'farmer' ? '/farmer/dashboard' : '/buyer/dashboard');
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center font-display text-xl font-bold text-forest mb-6">
          {APP_NAME}
        </Link>
        <div className="card p-6">
          <h1 className="text-xl font-bold mb-1">Create your account</h1>
          <p className="text-sm text-charcoal/70 mb-5">
            Your state and LGA are used to connect you with people and information near you.
          </p>

          <div className="flex mb-5 border border-line rounded overflow-hidden">
            <button
              type="button"
              onClick={() => setRole('farmer')}
              className={`flex-1 py-2 text-sm font-bold ${
                role === 'farmer' ? 'bg-forest text-white' : 'bg-white text-charcoal'
              }`}
            >
              I am a farmer
            </button>
            <button
              type="button"
              onClick={() => setRole('buyer')}
              className={`flex-1 py-2 text-sm font-bold ${
                role === 'buyer' ? 'bg-forest text-white' : 'bg-white text-charcoal'
              }`}
            >
              I am a buyer
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1" htmlFor="fullName">
                Full name
              </label>
              <input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-line rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1" htmlFor="phone">
                Phone number
              </label>
              <input
                id="phone"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-line rounded px-3 py-2"
                placeholder="080..."
              />
            </div>

            <StateLgaSelect
              state={state}
              lga={lga}
              onStateChange={setState}
              onLgaChange={setLga}
            />

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
              <PasswordInput
                id="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-700">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-center mt-5">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-forest">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
      }
