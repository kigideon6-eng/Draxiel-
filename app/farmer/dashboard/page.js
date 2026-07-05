'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '../../../components/DashboardShell';
import FarmsPanel from '../../../components/farmer/FarmsPanel';
import ListingsPanel from '../../../components/farmer/ListingsPanel';
import ExpensesPanel from '../../../components/farmer/ExpensesPanel';
import OrdersPanel from '../../../components/OrdersPanel';
import AgronomistPanel from '../../../components/AgronomistPanel';
import DirectMessagesPanel from '../../../components/DirectMessagesPanel';
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
    { key: 'expenses', label: 'Expenses', onClick: () => setActiveTab('expenses') },
    { key: 'orders', label: 'Orders', onClick: () => setActiveTab('orders') },
    { key: 'messages', label: 'Contacts & messages', onClick: () => setActiveTab('messages') },
    { key: 'agronomist', label: 'AI advisor', onClick: () => setActiveTab('agronomist') },
  ];

  return (
    <DashboardShell profile={profile} tabs={tabs} activeTab={activeTab}>
      {activeTab === 'listings' && <ListingsPanel profile={profile} />}
      {activeTab === 'farms' && <FarmsPanel profile={profile} />}
      {activeTab === 'expenses' && <ExpensesPanel profile={profile} />}
      {activeTab === 'orders' && <OrdersPanel profile={profile} viewerRole="farmer" />}
      {activeTab === 'messages' && <DirectMessagesPanel profile={profile} />}
      {activeTab === 'agronomist' && <AgronomistPanel profile={profile} />}
    </DashboardShell>
  );
    }
