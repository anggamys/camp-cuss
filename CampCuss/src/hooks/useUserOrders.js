// ✅ src/hooks/useUserOrders.js
import {useState, useEffect} from 'react';
import {getListOrder} from '../api/orderApi';

export const useUserOrders = () => {
  // Semua Hook dipanggil di atas — TANPA KONDISI
  const [pendingOrder, setPendingOrder] = useState(null);
  const [acceptedOrder, setAcceptedOrder] = useState(null);
  const [completedOrders, setCompletedOrders] = useState([]); // ← selalu array!
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch logic di sini
    const fetch = async () => {
      try {
        const res = await getListOrder();
        const orders = Array.isArray(res?.data) ? res.data : [];

        setPendingOrder(orders.find(o => o.status === 'pending') || null);
        setAcceptedOrder(orders.find(o => o.status === 'accepted') || null);
        setCompletedOrders(
          orders
            .filter(o => ['completed', 'paid'].includes(o.status))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5),
        );
      } catch (err) {
        setError(err.message);
        setCompletedOrders([]); // jaga tetap array
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  return {
    pendingOrder,
    acceptedOrder,
    completedOrders,
    loading,
    error,
  };
};
