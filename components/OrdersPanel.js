'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import MessageThread from './MessageThread';

const STATUS_LABELS = {
  pending: 'Pending payment',
  paid: 'Paid — held in escrow',
  in_delivery: 'Out for delivery',
  completed: 'Completed',
  disputed: 'Disputed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

const STATUS_COLORS = {
  pending: 'bg-gray-200 text-charcoal/70',
  paid: 'bg-gold/20 text-gold-dark',
  in_delivery: 'bg-blue-100 text-blue-800',
  completed: 'bg-forest/10 text-forest',
  disputed: 'bg-red-100 text-red-800',
  refunded: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-200 text-charcoal/50',
};

export default function OrdersPanel({ profile, viewerRole }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openThreadId, setOpenThreadId] = useState(null);

  async function loadOrders() {
    setLoading(true);
    const column = viewerRole === 'farmer' ? 'farmer_id' : 'buyer_id';
    const { data } = await supabase
      .from('orders')
      .select('*, market_listings(item_name, unit)')
      .eq(column, profile.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (profile?.id) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  async function advanceStatus(order, nextStatus) {
    await supabase.from('orders').update({ escrow_status: nextStatus }).eq('id', order.id);
    loadOrders();
  }

  const totalPaid = orders
    .filter((o) => ['paid', 'in_delivery', 'completed'].includes(o.escrow_status))
    .reduce((sum, o) => sum + Number(o.agreed_price) * Number(o.quantity), 0);

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">
        {viewerRole === 'farmer' ? 'Orders on your listings' : 'Your orders'}
      </h2>

      {viewerRole === 'buyer' && (
        <p className="text-sm text-charcoal/70 mb-4">
          Total paid across all orders: ₦{totalPaid.toLocaleString()}
        </p>
      )}

      <div className="bg-gold/10 border border-gold/40 text-sm text-charcoal/80 rounded p-3 mb-4">
        The buttons below move an order through its status. Real card/bank payment via
        Paystack is not connected yet — see the README for that step.
      </div>

      {loading ? (
        <p className="text-sm text-charcoal/60">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-charcoal/60">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold">{order.market_listings?.item_name}</h3>
                  <p className="text-sm text-charcoal/70">
                    {order.quantity} {order.market_listings?.unit} · ₦
                    {Number(order.agreed_price).toLocaleString()} / {order.market_listings?.unit}
                  </p>
                  <p className="text-sm font-bold mt-1">
                    Total: ₦{(Number(order.agreed_price) * Number(order.quantity)).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${STATUS_COLORS[order.escrow_status]}`}
                >
                  {STATUS_LABELS[order.escrow_status]}
                </span>
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                {viewerRole === 'buyer' && order.escrow_status === 'pending' && (
                  <button
                    onClick={() => advanceStatus(order, 'paid')}
                    className="btn-primary text-xs"
                  >
                    Pay into escrow
                  </button>
                )}
                {viewerRole === 'farmer' && order.escrow_status === 'paid' && (
                  <button
                    onClick={() => advanceStatus(order, 'in_delivery')}
                    className="btn-secondary text-xs"
                  >
                    Mark as out for delivery
                  </button>
                )}
                {viewerRole === 'buyer' && order.escrow_status === 'in_delivery' && (
                  <button
                    onClick={() => advanceStatus(order, 'completed')}
                    className="btn-primary text-xs"
                  >
                    Confirm delivery received
                  </button>
                )}
                <button
                  onClick={() => setOpenThreadId(openThreadId === order.id ? null : order.id)}
                  className="btn-secondary text-xs"
                >
                  {openThreadId === order.id ? 'Hide messages' : 'Message'}
                </button>
              </div>

              {openThreadId === order.id && (
                <MessageThread orderId={order.id} currentUserId={profile.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
             }
