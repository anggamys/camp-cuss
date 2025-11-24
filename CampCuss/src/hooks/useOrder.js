  import {useState, useRef} from 'react';
  import {
    createOrder,
    getOrderStatus,
    cancelOrder as cancelOrderApi,
    getOrderById as getById,
  } from '../api/orderApi';

  export const useOrder = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [order, setOrder] = useState(null);
    const pollingRef = useRef(null);

    const submitOrder = async orderData => {
      setLoading(true);
      setError(null);

      try {
        const result = await createOrder(orderData);

        if (result.status === 'success') {
          setOrder(result.data);
          return result;
        } else {
          throw new Error(result.message || 'Gagal membuat pesanan');
        }
      } catch (e) {
        const message =
          e.response?.data?.message || e.message || 'Terjadi Kesalahan';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    };

    const pollOrderStatus = (orderId, onUpdate, onError) => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }

      const poll = async () => {
        try {
          const response = await getOrderStatus(orderId);

          if (response.status === 'success') {
            onUpdate(response.data);
          } else {
            throw new Error(response.message || 'Gagal mendapatkan status order');
          }
        } catch (e) {
          console.error('❌ Polling error:', e);
          onError?.(e);

          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      };

      pollingRef.current = setInterval(poll, 3000);

      poll();

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    };

    const getOrderById = (orderId, onUpdate, onError) => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }

      const poll = async () => {
        try {
          const response = await getById(orderId);

          if (response.status === 'success') {
            onUpdate(response.data);
          } else {
            throw new Error(response.message || 'Gagal mendapatkan status order');
          }
        } catch (e) {
          console.error('❌ Polling error:', e);
          onError?.(e);

          // Stop polling on error
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      };

      // Poll setiap 3 detik
      pollingRef.current = setInterval(poll, 3000);

      // Poll pertama kali
      poll();

      // Return cleanup function
      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    };

    const cancelOrder = async orderId => {
      setLoading(true);
      setError(null);

      try {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        const result = await cancelOrderApi(orderId);

        if (result.status === 'success') {
          setOrder(prev => (prev ? {...prev, status: 'cancelled'} : null));
          return result;
        } else {
          throw new Error(result.message || 'Gagal membatalkan pesanan');
        }
      } catch (e) {
        const message =
          e.response?.data?.message || e.message || 'Terjadi Kesalahan';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    };

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    const clearError = () => {
      setError(null);
    };

    const clearOrder = () => {
      setOrder(null);
    };

    return {
      submitOrder,
      pollOrderStatus,
      cancelOrder,
      stopPolling,
      clearError,
      clearOrder,
      loading,
      error,
      order,
      getOrderById,
    };
  };
