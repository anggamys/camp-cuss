// src/hooks/useSocket.js (FIXED VERSION)
import {useState, useEffect, useRef, useCallback} from 'react';
import io from 'socket.io-client';
import {getAccessToken} from '../utils/tokenStorage';
import {useAuth} from './useAuth';

const SOCKET_IO_URL = 'https://camp-cuss.craftbytes.space';

export const useSocket = orderId => {
  const {profile} = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  const lastLocationRef = useRef(null);
  const pendingLocationsRef = useRef([]);

  // Fungsi untuk menghentikan pengiriman lokasi
  const stopSendingLocation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const initializeSocket = useCallback(async () => {
    try {
      setIsConnecting(true);

      // Gunakan getAccessToken() sebagai function, bukan property
      const driverAccessToken = await getAccessToken();

      if (!driverAccessToken) {
        console.warn('Driver access token not available');
        setIsConnecting(false);
        return;
      }

      const socketUrl = `${SOCKET_IO_URL}/driver-locations?token=${driverAccessToken}`;

      const socketInstance = io(socketUrl, {
        transports: ['websocket', 'polling'], // Tambahkan polling sebagai fallback
        forceNew: true,
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Event handlers
      socketInstance.on('connect', () => {
        setIsConnected(true);
        setIsConnecting(false);

        if (orderId) {
          socketInstance.emit('joinOrderRoom', {order_id: orderId});
        }

        // Kirim pending locations jika ada
        if (pendingLocationsRef.current.length > 0) {
          pendingLocationsRef.current.forEach(location => {
            socketInstance.emit('updateDriverLocation', location);
          });
          pendingLocationsRef.current = [];
        }
      });

      socketInstance.on('disconnect', reason => {
        setIsConnected(false);
        setIsConnecting(false);
        stopSendingLocation();
      });

      socketInstance.on('error', error => {
        console.error('🚨 Driver socket error:', error);
        setIsConnecting(false);
      });

      socketInstance.on('connect_error', error => {
        setIsConnecting(false);
      });

      // Event untuk konfirmasi dari server
      socketInstance.on('locationAcknowledged', data => {});

      // Event untuk reconnect
      socketInstance.on('reconnect', attemptNumber => {
        setIsConnected(true);

        // Re-join room setelah reconnect
        if (orderId) {
          socketInstance.emit('joinOrderRoom', {order_id: orderId});
        }
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);
    } catch (error) {
      console.error('💥 Driver socket initialization error:', error);
      setIsConnecting(false);
    }
  }, [orderId, stopSendingLocation]); // Hapus driverAccessToken dari dependencies

  const sendDriverLocation = useCallback(
    locationData => {
      if (!orderId) {
        console.warn('🚫 No order ID available');
        return;
      }

      const locationPayload = {
        driver_id: profile?.id,
        order_id: orderId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        heading: locationData.heading || 0,
        speed: locationData.speed || 0,
        timestamp: Date.now(),
      };

      // Simpan lokasi terakhir
      lastLocationRef.current = locationPayload;

      if (socketRef.current && isConnected) {
        socketRef.current.emit(
          'updateDriverLocation',
          locationPayload,
          response => {
            if (response) {
              console.log('✅ Server response:', response);
            }
          },
        );

        socketRef.current.emit('broadcastLocation', {
          ...locationPayload,
          room: `order_${orderId}`,
        });
      } else {
        // Simpan di pending queue
        pendingLocationsRef.current.push(locationPayload);

        // Batasi queue maksimal 10 locations
        if (pendingLocationsRef.current.length > 10) {
          pendingLocationsRef.current = pendingLocationsRef.current.slice(-10);
        }

        // Coba reconnect jika tidak connected
        if (!isConnected && !isConnecting) {
          initializeSocket();
        }
      }
    },
    [isConnected, isConnecting, orderId, profile?.id, initializeSocket],
  );

  // Fungsi untuk mulai mengirim lokasi setiap 3 detik
  const startSendingLocation = useCallback(
    locationData => {
      // Hentikan interval sebelumnya jika ada
      stopSendingLocation();

      // Kirim lokasi pertama kali jika ada data
      if (locationData) {
        sendDriverLocation(locationData);
      }

      // Set interval untuk mengirim setiap 3 detik
      intervalRef.current = setInterval(() => {
        if (lastLocationRef.current) {
          sendDriverLocation(lastLocationRef.current);
        } else if (locationData) {
          sendDriverLocation(locationData);
        }
      }, 3000);
    },
    [sendDriverLocation, stopSendingLocation],
  );

  // Reconnect logic
  const reconnectSocket = useCallback(() => {
    if (!isConnected && !isConnecting) {
      if (socketRef.current) {
        socketRef.current.connect();
      } else {
        initializeSocket();
      }
    }
  }, [isConnected, isConnecting, initializeSocket]);

  // Effect untuk initialize socket
  useEffect(() => {
    if (orderId) {
      initializeSocket();
    } else {
    }

    return () => {
      stopSendingLocation();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [orderId, initializeSocket, stopSendingLocation]);

  // Auto-reconnect effect
  useEffect(() => {
    let reconnectInterval;

    if (!isConnected && !isConnecting) {
      reconnectInterval = setInterval(() => {
        reconnectSocket();
      }, 5000);
    }

    return () => {
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
      }
    };
  }, [isConnected, isConnecting, reconnectSocket]);

  return {
    socket,
    isConnected,
    isConnecting,
    sendDriverLocation,
    startSendingLocation,
    stopSendingLocation,
    reconnectSocket,
  };
};
