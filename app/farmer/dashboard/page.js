'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '../../../components/DashboardShell';
import FarmsPanel from '../../../components/farmer/FarmsPanel';
import ListingsPanel from '../../../components/farmer/ListingsPanel';
import OrdersPanel from '../../../components/OrdersPanel';
import AgronomistPanel from '../../../components/AgronomistPanel';
import WeatherPanel from '../../../components/WeatherPanel';
import { getCurrentProfile } from '../../../lib/auth';

export default function FarmerDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings');

  useEffect(() => {
    async function load() {
      const p = await getCurrentProfile();
      if (!p) {
        router.push('/login');
        return;
      }
      if (p.role !== 'farmer') {
        router.push('/buyer/dashboard');
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
    { key: 'listings', label: 'Listings', onClick: () => setActiveTab('listings') },
    { key: 'farms', label: 'My farms', onClick: () => setActiveTab('farms') },
    { key: 'orders', label: 'Orders', onClick: () => setActiveTab('orders') },
    { key: 'agronomist', label: 'AI advisor', onClick: () => setActiveTab('agronomist') },
    { key: 'weather', label: 'Weather', onClick: () => setActiveTab('weather') },
  ];

  return (
    <DashboardShell profile={profile} tabs={tabs} activeTab={activeTab}>
      {activeTab === 'listings' && <ListingsPanel profile={profile} />}
      {activeTab === 'farms' && <FarmsPanel profile={profile} />}
      {activeTab === 'orders' && <OrdersPanel profile={profile} viewerRole="farmer" />}
      {activeTab === 'agronomist' && <AgronomistPanel profile={profile} />}
      {activeTab === 'weather' && <WeatherPanel profile={profile} />}
    </DashboardShell>
  );
    }
