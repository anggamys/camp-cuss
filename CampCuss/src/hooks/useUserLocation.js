import {useState, useEffect} from 'react';
import Geolocation from '@react-native-community/geolocation';
import {PermissionsAndroid, Platform} from 'react-native';

export const useUserLocation = (options = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 10000,
    fallbackLocation = {latitude: -7.33, longitude: 112.79},
  } = options;

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check Android permissions
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Izin Lokasi',
            message:
              'Aplikasi membutuhkan akses lokasi untuk menampilkan peta dan rute.',
            buttonNeutral: 'Tanya Nanti',
            buttonNegative: 'Tolak',
            buttonPositive: 'Izinkan',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  };

  useEffect(() => {
    let isMounted = true; // Flag untuk prevent state update pada unmounted component

    const getLocation = async () => {
      if (!isMounted) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Request permission first
        const hasPermission = await requestLocationPermission();

        if (!hasPermission) {
          throw new Error('Izin lokasi ditolak');
        }

        Geolocation.getCurrentPosition(
          position => {
            if (!isMounted) {
              return;
            }

            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            };
            console.log('📍 Location obtained:', coords);
            setLocation(coords);
            setLoading(false);
          },
          err => {
            if (!isMounted) {
              return;
            }

            console.error('❌ Geolocation error:', err);
            let errorMessage = 'Gagal mendapatkan lokasi';

            switch (err.code) {
              case 1:
                errorMessage =
                  'Izin lokasi ditolak. Silakan berikan izin di pengaturan.';
                break;
              case 2:
                errorMessage = 'Lokasi tidak tersedia. Pastikan GPS aktif.';
                break;
              case 3:
                errorMessage = 'Timeout mendapatkan lokasi. Coba lagi.';
                break;
              default:
                errorMessage = err.message || 'Gagal mendapatkan lokasi';
            }

            setError(errorMessage);

            // Gunakan fallback location sebagai backup
            console.log('🔄 Using fallback location:', fallbackLocation);
            setLocation(fallbackLocation);
            setLoading(false);
          },
          {
            enableHighAccuracy,
            timeout,
            maximumAge,
          },
        );
      } catch (err) {
        if (!isMounted) {
          return;
        }

        console.error('🚨 Location setup error:', err);
        setError(err.message || 'Error setup lokasi');
        setLocation(fallbackLocation);
        setLoading(false);
      }
    };

    getLocation();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return {location, loading, error};
};
