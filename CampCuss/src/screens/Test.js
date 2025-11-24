// src/screens/AddressScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icons from 'react-native-vector-icons/MaterialIcons';
import { useUserLocation } from '../hooks/useUserLocation';

const DESTINATION_COORDS = {
  latitude: -7.332303,
  longitude: 112.788273,
};

const AddressScreen = ({ route, navigation }) => {
  const { destination } = route.params;

  if (!route?.params?.destination) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: '#FCEBD7', padding: 20 }}>
          Destinasi tidak ditemukan.
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#F9F1E2' }}>Kembali</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const [address, setAddress] = useState('');
  const [routes, setRoutes] = useState([]); // Array rute: [rute_utama, rute_alternatif]
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [instructions, setInstructions] = useState([]);
  const mapRef = useRef(null);

  const { location: userLocation, loading: locationLoading } = useUserLocation({
    fallbackLocation: { latitude: -7.33, longitude: 112.79 },
  });

  // Fetch rute dengan alternatif
  useEffect(() => {
    if (userLocation) {
      fetchRoutes(userLocation, DESTINATION_COORDS);
    }
  }, [userLocation]);

  const fetchRoutes = async (origin, dest) => {
    try {
      // ✅ Tambahkan alternatives=true
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${dest.longitude},${dest.latitude}?alternatives=true&steps=true&geometries=geojson`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok') {
        const parsedRoutes = data.routes.map(route => ({
          coordinates: route.geometry.coordinates.map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
          })),
          distance: route.distance,
          duration: route.duration,
          instructions: route.legs[0].steps.map(step => ({
            instruction: step.maneuver.instruction || step.maneuver.type,
            distance: step.distance,
            duration: step.duration,
          })),
        }));
        setRoutes(parsedRoutes);
        setInstructions(parsedRoutes[0].instructions);
      }
    } catch (err) {
      console.error('OSRM error:', err);
    }
  };

  // Zoom ke rute aktif
  useEffect(() => {
    if (routes.length > 0 && mapRef.current) {
      const activeRoute = routes[activeRouteIndex];
      if (activeRoute?.coordinates?.length > 0) {
        mapRef.current.fitToCoordinates(activeRoute.coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 200, left: 50 },
          animated: true,
        });
      }
    }
  }, [activeRouteIndex, routes]);

  const handleNext = () => {
    if (!address.trim()) {
      alert('Silakan isi alamat asal Anda.');
      return;
    }

    navigation.navigate('Booking', {
      destination: { ...destination, ...DESTINATION_COORDS },
      origin: {
        address,
        latitude: userLocation?.latitude || -7.33,
        longitude: userLocation?.longitude || 112.79,
      },
      route: routes[activeRouteIndex], // Kirim rute yang dipilih
    });
  };

  const initialRegion = {
    latitude: userLocation 
      ? (userLocation.latitude + DESTINATION_COORDS.latitude) / 2 
      : -7.3323,
    longitude: userLocation 
      ? (userLocation.longitude + DESTINATION_COORDS.longitude) / 2 
      : 112.7883,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  // Format durasi menjadi "X menit"
  const formatDuration = (seconds) => {
    const mins = Math.ceil(seconds / 60);
    return `${mins} menit`;
  };

  // Format jarak menjadi "X km" atau "X m"
  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Icons name="chevron-right" size={40} color="#FCEBD7" />
        </TouchableOpacity>
      </View>

      {/* Peta */}
      {userLocation ? (
        <MapView
          ref={mapRef}
          provider="google"
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
          toolbarEnabled={false}
        >
          <Marker coordinate={userLocation} pinColor="black" />
          <Marker coordinate={DESTINATION_COORDS} pinColor="red" />

          {/* Rute Utama (biru) */}
          {routes[0]?.coordinates && (
            <Polyline
              coordinates={routes[0].coordinates}
              strokeColor="#0000FF"
              strokeWidth={5}
              onPress={() => setActiveRouteIndex(0)}
            />
          )}

          {/* Rute Alternatif (hijau) */}
          {routes[1]?.coordinates && (
            <Polyline
              coordinates={routes[1].coordinates}
              strokeColor="#00AA00"
              strokeWidth={5}
              onPress={() => setActiveRouteIndex(1)}
            />
          )}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {locationLoading ? 'Mencari lokasi...' : 'Lokasi tidak tersedia'}
          </Text>
        </View>
      )}

      {/* Panel Instruksi */}
      <View style={styles.instructionsPanel}>
        <View style={styles.routeOptions}>
          {routes.map((route, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.routeButton,
                activeRouteIndex === index && styles.activeRouteButton,
              ]}
              onPress={() => {
                setActiveRouteIndex(index);
                setInstructions(route.instructions);
              }}
            >
              <Text
                style={[
                  styles.routeButtonText,
                  activeRouteIndex === index && styles.activeRouteButtonText,
                ]}
              >
                Rute {index + 1} • {formatDistance(route.distance)} •{' '}
                {formatDuration(route.duration)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Panel Bawah */}
      {/* <View style={styles.bottomPanel}>
        <Text style={styles.panelTitle}>Mau dijemput dimana hari ini?</Text>
        <TextInput
          style={styles.input}
          placeholder="Ketik alamatmu disini..."
          value={address}
          onChangeText={setAddress}
          multiline
        />
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next →</Text>
        </TouchableOpacity>
      </View> */}
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
    position: 'relative',
  },
  button:{
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    zIndex: 10,
    color: '#FCEBD7',
    backgroundColor: '#BB8B6D',
    borderRadius: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FCEBD7',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FCEBD7',
    textAlign: 'center',
  },
  instructionsPanel: {
    backgroundColor: '#FCEBD7',
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  routeOptions: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  routeButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeRouteButton: {
    backgroundColor: '#4E1F1A',
  },
  routeButtonText: {
    fontSize: 12,
    color: '#4E1F1A',
    textAlign: 'center',
  },
  activeRouteButtonText: {
    color: '#FCEBD7',
    fontWeight: 'bold',
  },
  instructionsList: {
    maxHeight: 150,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4E1F1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumberText: {
    color: '#FCEBD7',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  instructionText: {
    fontSize: 14,
    color: '#4E1F1A',
    marginBottom: 4,
  },
  stepMeta: {
    fontSize: 12,
    color: '#888',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FCEBD7',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 'semibold',
    color: '#4E1F1A',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    textAlignVertical: 'top',
    height: 80,
    color: '#4E1F1A',
  },
  nextButton: {
    backgroundColor: '#F9F1E2',
    paddingVertical: 15,
    borderRadius: 100,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4E1F1A',
  },
});