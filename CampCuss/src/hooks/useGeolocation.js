// src/hooks/useGeolocation.js (Fixed Version)
import {useState, useCallback, useRef, useEffect} from 'react';
import {PermissionsAndroid, Platform, Alert} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export const useGeolocation = (
  onLocationUpdate,
  onStartSending,
  isSocketReady,
) => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef(null);
  const locationQueueRef = useRef([]);

  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Izin Lokasi',
            message: 'Aplikasi butuh akses lokasi untuk melacak posisi Anda.',
            buttonNeutral: 'Tanya Nanti',
            buttonNegative: 'Batal',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true;
  }, []);

  const processLocationQueue = useCallback(() => {
    if (isSocketReady && locationQueueRef.current.length > 0) {
      console.log(
        `📤 Processing ${locationQueueRef.current.length} queued locations`,
      );
      locationQueueRef.current.forEach(location => {
        if (onLocationUpdate) {
          onLocationUpdate(location);
        }
      });
      locationQueueRef.current = [];
    }
  }, [isSocketReady, onLocationUpdate]);

  const startLocationTracking = useCallback(async () => {
    try {
      setIsLoading(true);
      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        Alert.alert('Izin Ditolak', 'Aplikasi membutuhkan akses lokasi.');
        setLocationError('Izin lokasi ditolak');
        setIsLoading(false);
        return;
      }

      console.log('🎯 Starting location tracking...');

      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude, heading, speed} = position.coords;
          const locationData = {latitude, longitude, heading, speed};

          setDriverLocation({latitude, longitude});
          setLocationError(null);
          setIsLoading(false);
          setIsTracking(true);

          console.log('📍 Got initial location:', locationData);

          // Process any queued locations first
          processLocationQueue();

          // Callback untuk update lokasi pertama kali
          if (onLocationUpdate) {
            onLocationUpdate(locationData);
          }

          // Mulai interval pengiriman setiap 3 detik jika socket ready
          if (onStartSending && isSocketReady) {
            console.log('🚀 Starting 3-second interval (socket ready)');
            onStartSending(locationData);
          } else {
            console.log('⏳ Queueing start sending (socket not ready)');
            locationQueueRef.current.push(locationData);
          }
        },
        positionError => {
          console.warn('❌ Get current position error:', positionError);
          setLocationError(
            'Gagal mendapatkan lokasi: ' + positionError.message,
          );
          setIsLoading(false);
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );

      // Watch position untuk update real-time
      watchIdRef.current = Geolocation.watchPosition(
        position => {
          const {latitude, longitude, heading, speed} = position.coords;
          const locationData = {latitude, longitude, heading, speed};

          setDriverLocation({latitude, longitude});
          setLocationError(null);

          console.log('📍 Location update:', locationData);

          // Callback untuk update lokasi realtime
          if (onLocationUpdate && isSocketReady) {
            onLocationUpdate(locationData);
          } else {
            console.log('💾 Queueing location update (socket not ready)');
            locationQueueRef.current.push(locationData);
          }
        },
        watchError => {
          console.warn('❌ Watch position error:', watchError);
          setLocationError('Error melacak lokasi: ' + watchError.message);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 5,
          interval: 5000,
          timeout: 10000,
        },
      );
    } catch (err) {
      console.warn('💥 Start tracking error:', err);
      setLocationError('Error memulai pelacakan lokasi');
      setIsLoading(false);
    }
  }, [
    requestLocationPermission,
    onLocationUpdate,
    onStartSending,
    isSocketReady,
    processLocationQueue,
  ]);

  const stopLocationTracking = useCallback(() => {
    console.log('🛑 Stopping location tracking');
    if (watchIdRef.current) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Process queue when socket becomes ready
  useEffect(() => {
    if (isSocketReady && isTracking) {
      console.log('🎉 Socket is ready, processing queue...');
      processLocationQueue();

      // Start interval if we have location data but interval hasn't started
      if (driverLocation && onStartSending) {
        console.log('🚀 Starting interval now that socket is ready');
        onStartSending(driverLocation);
      }
    }
  }, [
    isSocketReady,
    isTracking,
    driverLocation,
    onStartSending,
    processLocationQueue,
  ]);

  return {
    driverLocation,
    locationError,
    isLoading,
    isTracking,
    startLocationTracking,
    stopLocationTracking,
  };
};
