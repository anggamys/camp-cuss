// src/screens/AddressScreen.js
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, {Marker, Polyline} from 'react-native-maps';
import Icons from 'react-native-vector-icons/MaterialIcons';
import {useUserLocation} from '../hooks/useUserLocation';
import FloatingInput from '../components/FloatingInput';
import {useEffect, useRef, useState} from 'react';
import {useOrder} from '../hooks/useOrder';

const DESTINATION_COORDS = {
  latitude: -7.332303,
  longitude: 112.788273,
};

// Fallback coordinates jika ada masalah
const FALLBACK_COORDS = {
  latitude: -7.33,
  longitude: 112.79,
};

const AddressScreen = ({route, navigation}) => {
  const {destination} = route.params;

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const [routes, setRoutes] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const mapRef = useRef(null);

  const {
    location: userLocation,
    loading: locationLoading,
    error: locationError,
  } = useUserLocation({
    fallbackLocation: FALLBACK_COORDS,
  });

  const {submitOrder, loading: orderLoading} = useOrder();

  // Safe coordinates untuk menghindari null/undefined
  const safeUserLocation = userLocation || FALLBACK_COORDS;

  // Fetch rute dengan error handling
  useEffect(() => {
    if (safeUserLocation) {
      fetchRoutes(safeUserLocation, DESTINATION_COORDS);
    }
  }, [safeUserLocation]);

  const fetchRoutes = async (origin, dest) => {
    if (!origin || !dest) {
      console.error('❌ Invalid coordinates for route fetching');
      return;
    }

    setRouteLoading(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${dest.longitude},${dest.latitude}?alternatives=false&steps=true&geometries=geojson`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes.length > 0) {
        const r = data.routes[0];

        const parsedRoute = {
          coordinates: r.geometry.coordinates.map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
          })),
          distance: r.distance,
          duration: r.duration,
        };

        setRoutes([parsedRoute]);
      } else {
        setRoutes([]);
      }
    } catch (err) {
      console.error('❌ OSRM error:', err);
      setRoutes([]);
    } finally {
      setRouteLoading(false);
    }
  };

  // Zoom ke rute dengan safety check
  useEffect(() => {
    if (routes.length > 0 && mapRef.current && routes[0]?.coordinates) {
      try {
        const coords = routes[0].coordinates;
        const padding =
          step === 1
            ? {top: 25, right: 75, bottom: 200, left: 75}
            : {top: 150, right: 75, bottom: 500, left: 75};

        mapRef.current.fitToCoordinates(coords, {
          edgePadding: padding,
          animated: true,
        });
      } catch (err) {
        console.error('❌ Error zooming to route:', err);
      }
    }
  }, [routes, step]);

  const handleNext = async () => {
    if (step === 1) {
      // Validasi step 1
      if (!address.trim()) {
        Alert.alert('Peringatan', 'Silakan isi alamat asal Anda.');
        return;
      }
      if (routes.length === 0 && routeLoading) {
        Alert.alert('Peringatan', 'Sedang memuat rute, tunggu sebentar...');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Submit order
      const bookingData = {
        destination_id: destination.id,
        pick_up_location: address.trim(),
        pick_up_latitude: safeUserLocation.latitude,
        pick_up_longitude: safeUserLocation.longitude,
      };

      try {
        const response = await submitOrder(bookingData);
        navigation.navigate('SearchingDriver', {order: response.data});
      } catch (e) {
        Alert.alert(
          'Gagal',
          e.message || 'Terjadi kesalahan saat membuat pesanan.',
        );
      }
    }
  };

  const calculatePrice = () => {
    return 7000; // Fixed price untuk sekarang
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigation.goBack();
    }
  };

  // Safe initial region
  const initialRegion = {
    latitude: (safeUserLocation.latitude + DESTINATION_COORDS.latitude) / 2,
    longitude: (safeUserLocation.longitude + DESTINATION_COORDS.longitude) / 2,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  const price = calculatePrice();

  // === RENDER FUNCTIONS ===
  const renderStep1 = () => (
    <View style={styles.bottomPanel}>
      <Text style={styles.panelTitle}>Mau dijemput dimana hari ini?</Text>
      <Text style={styles.panelSubtitle}>Ketik alamatmu yaa...</Text>
      <FloatingInput
        label=""
        value={address}
        onChangeText={setAddress}
        placeHolder="Alamat Rumah"
        placeholderTextColor="#F9F1E2"
        autoCapitalize="none"
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.panel}>
      <Text style={styles.headerTitle}>Detail Pemesanan</Text>
      <Text style={styles.spanTitle}>Pastikan sudah benar yaa..</Text>

      <View style={styles.inputContainer}>
        <FloatingInput
          label="Lokasi Tujuan"
          value={destination?.name || 'Tidak diketahui'}
          editable={false}
          placeholderTextColor="#F9F1E2"
        />
      </View>
      <FloatingInput
        label="Rumah Asal"
        value={address}
        editable={false}
        placeholderTextColor="#F9F1E2"
      />

      <View style={styles.priceRow}>
        <Text style={styles.totalLabel}>Harga:</Text>
        <Text style={styles.totalPrice}>
          Rp {price.toLocaleString('id-ID')}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          (orderLoading || routeLoading) && styles.disabledButton,
        ]}
        onPress={handleNext}
        disabled={orderLoading || routeLoading}>
        {orderLoading ? (
          <ActivityIndicator size="small" color="#4E1F1A" />
        ) : (
          <Text style={styles.confirmButtonText}>Pesan Ojek Camp-Cuss</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderMap = () => {
    if (locationLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FCEBD7" />
          <Text style={styles.loadingText}>Mencari lokasi...</Text>
        </View>
      );
    }

    if (locationError) {
      return (
        <View style={styles.loadingContainer}>
          <Icons name="location-off" size={50} color="#FCEBD7" />
          <Text style={styles.loadingText}>{locationError}</Text>
          <Text style={styles.loadingSubtext}>Menggunakan lokasi default</Text>
        </View>
      );
    }

    return (
      <MapView
        ref={mapRef}
        provider="google"
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        toolbarEnabled={false}>
        <Marker
          coordinate={safeUserLocation}
          pinColor="red"
          title="Lokasi Anda"
        />
        <Marker coordinate={DESTINATION_COORDS} pinColor="red" title="Tujuan" />
        {routes[0]?.coordinates && (
          <Polyline
            coordinates={routes[0].coordinates}
            strokeColor="#0000FF"
            strokeWidth={4}
          />
        )}
      </MapView>
    );
  };

  if (!destination) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Destinasi tidak ditemukan.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={step === 1 ? handleNext : handleBack}>
          <Icons name="chevron-right" size={30} color="#FCEBD7" />
        </TouchableOpacity>
      </View>

      {/* Peta */}
      {renderMap()}

      {/* Konten berdasarkan step */}
      {step === 1 ? renderStep1() : renderStep2()}
    </View>
  );
};

export default AddressScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4E1F1A',
  },
  header: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#BB8B6D',
    borderRadius: 100,
  },
  headerTitle: {
    color: '#FCEBD7',
    fontSize: 24,
    fontWeight: '600',
  },
  spanTitle: {
    color: '#FCEBD7',
    fontSize: 14,
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4E1F1A',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#FCEBD7',
    textAlign: 'center',
    marginTop: 10,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#F9F1E2',
    textAlign: 'center',
    marginTop: 5,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#BB8B6D',
    paddingTop: 35,
    paddingBottom: 40,
    paddingHorizontal: 40,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  panelTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#F9F1E2',
  },
  panelSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9F1E2',
    marginBottom: 20,
  },
  routeLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  routeLoadingText: {
    color: '#F9F1E2',
    marginLeft: 10,
    fontSize: 14,
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#BB8B6D',
    paddingTop: 35,
    paddingBottom: 50,
    paddingHorizontal: 40,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  inputContainer: {
    marginBottom: 15,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F9F1E2',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#A9F1F9',
  },
  confirmButton: {
    backgroundColor: '#FCEBD7',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 25,
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4E1F1A',
  },
  errorText: {
    color: '#FCEBD7',
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  backButtonText: {
    color: '#F9F1E2',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
  },
});
