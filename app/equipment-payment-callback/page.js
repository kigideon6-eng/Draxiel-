'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { APP_NAME } from '../../lib/config';

function EquipmentPaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    const bookingId = searchParams.get('bookingId');

    async function verify() {
      if (!reference || !bookingId) {
        setStatus('error');
        setMessage('Missing payment details.');
        return;
      }

      try {
        const res = await fetch(
          `/api/verify-equipment-payment?reference=${reference}&bookingId=${bookingId}`
        );
        const data = await res.json();

        if (data.success) {
          setStatus('success');
        } else {
          setStatus('failed');
          setMessage(data.message || 'Payment could not be confirmed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Something went wrong checking your payment.');
      }
    }

    verify();
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="card p-8 max-w-md w-full text-center">
        <Link href="/" className="font-display text-xl font-bold text-forest block mb-6">
          {APP_NAME}
        </Link>

        {status === 'checking' && (
          <p className="text-charcoal/70">Confirming your payment...</p>
        )}

        {status === 'success' && (
          <>
            <p className="text-2xl mb-2">✓</p>
            <h1 className="text-xl font-bold mb-2">Payment confirmed</h1>
            <p className="text-charcoal/70 mb-6">
              Your equipment booking is confirmed. Contact the owner to arrange the details.
            </p>
            <button onClick={() => router.push('/farmer/dashboard')} className="btn-primary">
              Go to my bookings
            </button>
          </>
        )}

        {(status === 'failed' || status === 'error') && (
          <>
            <h1 className="text-xl font-bold mb-2">Payment not confirmed</h1>
            <p className="text-charcoal/70 mb-6">{message}</p>
            <button onClick={() => router.push('/farmer/dashboard')} className="btn-secondary">
              Back to my bookings
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function EquipmentPaymentCallbackPage() {
  return (
    <Suspense fallback={null}>
      <EquipmentPaymentCallbackContent />
    </Suspense>
  );
    }
