'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '../../../components/DashboardShell';
import MarketplacePanel from '../../../components/MarketplacePanel';
import OrdersPanel from '../../../components/OrdersPanel';
import AgronomistPanel from '../../../components/AgronomistPanel';
import WeatherPanel from '../../../components/WeatherPanel';
import DirectMessagesPanel from '../../../components/DirectMessagesPanel';
import { getCurrentProfile } from '../../../lib/auth';

export default function BuyerDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('marketplace');

  useEffect(() => {
    async function load() {
      const p = await getCurrentProfile();
      if (!p) {
        router.push('/login');
        return;
      }
      if (p.role !== 'buyer') {
        router.push('/farmer/dashboard');
        return;
      }
      setProfile(p);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading || !profile) {
    return <div className="min-h-screen bg-cream flex items-center justify-center">Loading...</div>;
  }

  const tabs = [
    { key: 'marketplace', label: 'Marketplace', onClick: () => setActiveTab('marketplace') },
    { key: 'orders', label: 'My orders', onClick: () => setActiveTab('orders') },
    { key: 'messages', label: 'Contacts & messages', onClick: () => setActiveTab('messages') },
    { key: 'agronomist', label: 'AI advisor', onClick: () => setActiveTab('agronomist') },
    { key: 'weather', label: 'Weather', onClick: () => setActiveTab('weather') },
  ];

  return (
    <DashboardShell profile={profile} tabs={tabs} activeTab={activeTab}>
      {activeTab === 'marketplace' && (
        <MarketplacePanel profile={profile} onOrderPlaced={() => setActiveTab('orders')} />
      )}
      {activeTab === 'orders' && <OrdersPanel profile={profile} viewerRole="buyer" />}
      {activeTab === 'messages' && <DirectMessagesPanel profile={profile} />}
      {activeTab === 'agronomist' && <AgronomistPanel profile={profile} />}
      {activeTab === 'weather' && <WeatherPanel profile={profile} />}
    </DashboardShell>
  );
    }
