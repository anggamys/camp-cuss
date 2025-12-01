// src/hooks/useSocketCustomer.js
import {useState, useEffect, useRef, useCallback} from 'react';
import io from 'socket.io-client';
import {getAccessToken} from '../utils/tokenStorage';

const SOCKET_IO_URL = 'https://camp-cuss.craftbytes.space';

export const useSocketCustomer = orderId => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [socketError, setSocketError] = useState(null);
  const socketRef = useRef(null);
  const updateCountRef = useRef(0);

  const initializeSocket = useCallback(async () => {
    try {
      setIsConnecting(true);
      setSocketError(null);

      const customerAccessToken = await getAccessToken();

      if (!customerAccessToken) {
        console.warn('Customer access token not available');
        setSocketError('Authentication token not found');
        setIsConnecting(false);
        return;
      }

      if (!orderId) {
        console.warn('Order ID is required for customer socket');
        setSocketError('Order ID is required');
        setIsConnecting(false);
        return;
      }

      console.log('🚀 Customer connecting to socket with order:', orderId);

      // Clean up existing socket connection
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // Gunakan URL dengan token di query parameter seperti di contoh
      const socketUrl = `${SOCKET_IO_URL}/driver-locations?token=${customerAccessToken}`;

      console.log('🔗 Connecting to:', socketUrl);

      const socketInstance = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 15000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      // Function untuk handle driver location data
      const handleDriverLocationData = (data, eventName) => {
        console.log(`🎯 ${eventName} EVENT RECEIVED:`, data);

        if (!data) {
          console.log('❌ No data received in event');
          return;
        }

        // Debug lengkap data yang diterima
        console.log('🔍 Data structure:', {
          keys: Object.keys(data),
          type: typeof data,
          isArray: Array.isArray(data),
          raw: JSON.stringify(data),
        });

        // Handle berbagai format data (array atau object)
        let locationData = data;
        if (Array.isArray(data) && data.length > 0) {
          locationData = data[0];
          console.log('📦 Using first item from array:', locationData);
        }

        // Cek berbagai kemungkinan nama property order_id
        const receivedOrderId =
          locationData.order_id || locationData.orderId || locationData.order;
        const expectedOrderId = Number(orderId);

        console.log('🔍 Order ID analysis:', {
          received: receivedOrderId,
          expected: expectedOrderId,
          typeReceived: typeof receivedOrderId,
          typeExpected: typeof expectedOrderId,
          looseEqual: receivedOrderId === expectedOrderId,
          strictEqual: receivedOrderId === expectedOrderId,
        });

        // Terima data jika order_id cocok atau jika tidak ada order_id (fallback)
        if (
          locationData.latitude !== undefined &&
          locationData.longitude !== undefined
        ) {
          if (!receivedOrderId || receivedOrderId === expectedOrderId) {
            updateCountRef.current += 1;

            console.log(
              `✅ DRIVER LOCATION UPDATE #${updateCountRef.current} from ${eventName}:`,
              {
                driver_id: locationData.driver_id,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                order_id: receivedOrderId,
                has_heading: !!locationData.heading,
                has_speed: !!locationData.speed,
              },
            );

            setDriverLocation({
              driver_id: locationData.driver_id,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              heading: locationData.heading || 0,
              speed: locationData.speed || 0,
              timestamp: locationData.timestamp || Date.now(),
              order_id: receivedOrderId,
            });

            setLastUpdateTime(Date.now());
            setSocketError(null);
          } else {
            console.log('⚠️ Ignoring data - order ID mismatch:', {
              received: receivedOrderId,
              expected: expectedOrderId,
              event: eventName,
            });
          }
        } else {
          console.log(
            '❌ Invalid location data - missing latitude/longitude:',
            locationData,
          );
        }
      };

      // Event handlers
      socketInstance.on('connect', () => {
        console.log('✅ Customer socket connected successfully');
        console.log('📡 Socket ID:', socketInstance.id);
        setIsConnected(true);
        setIsConnecting(false);
        setSocketError(null);

        // Multiple join attempts untuk memastikan berhasil
        const joinOrderRoom = () => {
          console.log(`📍 Emitting joinOrderRoom for order: ${orderId}`);
          socketInstance.emit('joinOrderRoom', {
            order_id: Number(orderId),
          });
        };

        // Immediate join
        joinOrderRoom();

        // Join lagi setelah delay untuk memastikan
        setTimeout(joinOrderRoom, 1000);
        setTimeout(joinOrderRoom, 3000);
      });

      socketInstance.on('disconnect', reason => {
        console.log('❌ Customer socket disconnected:', reason);
        setIsConnected(false);
        setIsConnecting(false);
        setSocketError(`Disconnected: ${reason}`);
      });

      socketInstance.on('error', error => {
        console.error('🚨 Customer socket error:', error);
        setSocketError(error.message || 'Socket error occurred');
        setIsConnecting(false);
      });

      socketInstance.on('connect_error', error => {
        console.error('🔌 Customer socket connection error:', error);
        setSocketError(`Connection failed: ${error.message}`);
        setIsConnecting(false);
      });

      // **LISTEN UNTUK BERBAGAI KEMUNGKINAN EVENT NAME**

      // Event utama berdasarkan data contoh
      socketInstance.on('driveractive:local', data => {
        handleDriverLocationData(data, 'driveractive:local');
      });

      // Event alternatif dengan colon
      socketInstance.on('driver:active:local', data => {
        handleDriverLocationData(data, 'driver:active:local');
      });

      // Event umum
      socketInstance.on('driver:active', data => {
        handleDriverLocationData(data, 'driver:active');
      });

      socketInstance.on('driver:location:update', data => {
        handleDriverLocationData(data, 'driver:location:update');
      });

      socketInstance.on('updateDriverLocation', data => {
        handleDriverLocationData(data, 'updateDriverLocation');
      });

      // Event konfirmasi
      socketInstance.on('joinedOrderRoom', data => {
        console.log('✅ Successfully joined order room:', data);
      });

      socketInstance.on('joinOrderRoom', data => {
        console.log('📨 joinOrderRoom confirmation:', data);
      });

      // Debug semua events untuk melihat event name sebenarnya
      socketInstance.onAny((eventName, ...args) => {
        console.log(`📢 ANY EVENT: "${eventName}"`, args);

        // Otomatis handle event yang mengandung kata kunci driver/location
        if (
          eventName.toLowerCase().includes('driver') ||
          eventName.toLowerCase().includes('location')
        ) {
          console.log(`🎯 AUTO-HANDLING driver-related event: ${eventName}`);
          handleDriverLocationData(args[0], `AUTO-${eventName}`);
        }
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);
    } catch (error) {
      console.error('💥 Customer socket initialization error:', error);
      setSocketError(`Initialization error: ${error.message}`);
      setIsConnecting(false);
    }
  }, [orderId]);

  // Reconnect logic
  const reconnectSocket = useCallback(() => {
    if (!isConnected && !isConnecting) {
      console.log('🔄 Attempting to reconnect socket...');
      setSocketError(null);
      if (socketRef.current) {
        socketRef.current.connect();
      } else {
        initializeSocket();
      }
    }
  }, [isConnected, isConnecting, initializeSocket]);

  // Disconnect socket manually
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Manually disconnecting customer socket');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setIsConnecting(false);
      setDriverLocation(null);
    }
  }, []);

  // Manual request function
  const requestDriverLocation = useCallback(() => {
    if (socketRef.current && socketRef.current.connected && orderId) {
      console.log('📡 Manually requesting driver location');
      socketRef.current.emit('joinOrderRoom', {
        order_id: Number(orderId),
      });
    }
  }, [orderId]);

  // Effect untuk periodic join room (keep alive)
  useEffect(() => {
    let joinInterval;

    if (isConnected && socketRef.current && orderId) {
      // Join room setiap 30 detik untuk maintain connection
      joinInterval = setInterval(() => {
        if (isConnected) {
          console.log('🔄 Periodic joinOrderRoom to maintain updates');
          socketRef.current.emit('joinOrderRoom', {
            order_id: Number(orderId),
          });
        }
      }, 30000);
    }

    return () => {
      if (joinInterval) {
        clearInterval(joinInterval);
      }
    };
  }, [isConnected, orderId]);

  // Effect untuk initialize socket
  useEffect(() => {
    if (orderId) {
      console.log('🎯 Initializing customer socket for order:', orderId);
      initializeSocket();
    }

    return () => {
      console.log('🧹 Cleaning up customer socket');
      disconnectSocket();
    };
  }, [orderId, initializeSocket, disconnectSocket]);

  return {
    socket,
    isConnected,
    isConnecting,
    driverLocation,
    socketError,
    reconnectSocket,
    disconnectSocket,
    requestDriverLocation,
    lastUpdateTime,
    updateCount: updateCountRef.current,
  };
};
