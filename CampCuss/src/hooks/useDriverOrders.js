// src/hooks/useDriverOrders.js
import {useEffect, useRef, useState} from 'react';
import {Alert} from 'react-native';
import {getAccessToken} from '../utils/tokenStorage';
import {io} from 'socket.io-client';
import {acceptDriverOrder} from '../api/driverOrderApi';
import {getListOrder} from '../api/orderApi';

export const useDriverOrders = isDriverActive => {
  const [activeOrder, setActiveOrder] = useState(null);
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [acceptedOrder, setAcceptedOrder] = useState(null);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      console.log('🔌 Socket.IO: Koneksi diputus karena driver nonaktif');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const manageConnection = async () => {
      if (!isDriverActive) {
        // Jika nonaktif → pastikan socket diputus
        disconnectSocket();
        setActiveOrder(null); // bersihkan order
        return;
      }

      // Jika aktif → buat koneksi
      const token = await getAccessToken();
      if (!token || !isMounted) {
        return;
      }

      // Hindari koneksi ganda
      if (socketRef.current?.connected) {
        return;
      }

      disconnectSocket(); // pastikan tidak ada koneksi lama

      const url = `https://camp-cuss.craftbytes.space/orders?token=${encodeURIComponent(
        token,
      )}`;
      console.log('📡 Membuka koneksi Socket.IO ke:', url);

      const socketInstance = io(url, {
        path: '/socket.io',
        transports: ['websocket'],
        reconnection: false,
        timeout: 5000,
      });

      socketInstance.on('connect', () => {
        console.log('✅ Socket.IO connected');
        socketInstance.emit('toggleOrderSubscription', {
          active: isDriverActive,
        });
      });

      socketInstance.on('newOrderNotification', data => {
        console.log('📥 New Order:', data);
        if (
          isMounted &&
          data?.event === 'newOrderNotification' &&
          data?.status === 'success'
        ) {
          setActiveOrder(data.data);
        }
      });

      socketInstance.on('disconnect', reason => {
        console.log('🔌 Socket.IO disconnected:', reason);
      });

      socketInstance.on('connect_error', e => {
        console.error('❌ Socket.IO connection error:', e.message || e);
        if (isMounted) {
          Alert.alert('Error', 'Gagal terhubung ke notifikasi pesanan.');
        }
      });

      if (isMounted) {
        socketRef.current = socketInstance;
      }
    };

    manageConnection();

    return () => {
      isMounted = false;
      disconnectSocket();
    };
  }, [isDriverActive]); // ✅ Hanya bergantung pada isDriverActive

  useEffect(() => {
    const socket = socketRef.current;
    if (socket?.connected) {
      console.log('📤 Mengirim ulang status aktif:', isDriverActive);
      socket.emit('toggleOrderSubscription', {active: isDriverActive});
      if (!isDriverActive) {
        setActiveOrder(null);
      }
    }
  }, [isDriverActive]);

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

  // --- Fungsi accept & reject ---
  const acceptOrder = async () => {
    if (!activeOrder) {
      return null;
    }

    const token = await getAccessToken();
    if (!token) {
      Alert.alert('Error', 'Sesi habis. Silakan login ulang.');
      return null;
    }

    setLoadingAccept(true);
    try {
      const res = await acceptDriverOrder(activeOrder.id);

      setLoadingAccept(false);

      if (res?.ok) {
        setActiveOrder(null);
        return res;
      } else {
        Alert.alert('Gagal', res?.message || 'Tidak bisa menerima pesanan.');
        return null;
      }
    } catch (err) {
      setLoadingAccept(false);
      console.error('Accept order error:', err);
      Alert.alert('Error', 'Gagal terhubung ke server.');
      return null;
    }
  };

  const rejectOrder = () => {
    setActiveOrder(null);
  };

  return {
    activeOrder,
    loadingAccept,
    acceptOrder,
    rejectOrder,
    pendingOrder,
    acceptedOrder,
    completedOrders,
    loading,
    error,
  };
};
