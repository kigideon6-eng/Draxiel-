'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '../../../components/DashboardShell';
import FarmsPanel from '../../../components/farmer/FarmsPanel';
import ListingsPanel from '../../../components/farmer/ListingsPanel';
import RecordsPanel from '../../../components/farmer/RecordsPanel';
import OrdersPanel from '../../../components/OrdersPanel';
import AgronomistPanel from '../../../components/AgronomistPanel';
import DirectMessagesPanel from '../../../components/DirectMessagesPanel';
import EquipmentPanel from '../../../components/EquipmentPanel';
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

      const params = new URLSearchParams(window.location.search);
      const tabFromUrl = params.get('tab');
      if (tabFromUrl) {
        setActiveTab(tabFromUrl);
      }

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
    { key: 'records', label: 'Farm records', onClick: () => setActiveTab('records') },
    { key: 'orders', label: 'Orders', onClick: () => setActiveTab('orders') },
    { key: 'messages', label: 'Contacts & messages', onClick: () => setActiveTab('messages') },
    { key: 'agronomist', label: 'Help & advisor', onClick: () => setActiveTab('agronomist') },
    { key: 'equipment', label: 'Equipment', onClick: () => setActiveTab('equipment') },
  ];

  return (
    <DashboardShell profile={profile} tabs={tabs} activeTab={activeTab}>
      {activeTab === 'listings' && <ListingsPanel profile={profile} />}
      {activeTab === 'farms' && <FarmsPanel profile={profile} />}
      {activeTab === 'records' && <RecordsPanel profile={profile} />}
      {activeTab === 'orders' && <OrdersPanel profile={profile} viewerRole="farmer" />}
      {activeTab === 'messages' && <DirectMessagesPanel profile={profile} />}
      {activeTab === 'agronomist' && <AgronomistPanel profile={profile} />}
       {activeTab === 'equipment' && <EquipmentPanel profile={profile} />}
    </DashboardShell>
  );
    }
