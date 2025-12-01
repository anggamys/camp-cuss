import React, {useEffect, useRef, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  PanResponder,
  Image,
} from 'react-native';
import MapView, {Marker, Polyline} from 'react-native-maps';

// Icons
import Icons from 'react-native-vector-icons/MaterialIcons';
import IconWA from 'react-native-vector-icons/Fontisto';
import IconPhone from 'react-native-vector-icons/Fontisto';

// Hooks
import {useSocketCustomer} from '../hooks/useSocketCustomer';
import {useDestinationById} from '../hooks/useDestinationById';
import {useUserById} from '../hooks/useUserById';
import FloatingInput from '../components/FloatingInput';

const {width, height: SCREEN_HEIGHT} = Dimensions.get('window');
const MODAL_MIN_HEIGHT = SCREEN_HEIGHT * 0.3;

const OrderingUserScreen = ({route: navigationRoute}) => {
  const {order} = navigationRoute.params;
  const {destination} = useDestinationById(order?.id);
  const {user} = useUserById(order?.driver_id);

  // Socket hook untuk tracking user
  const {isConnected, isConnecting, driverLocation, reconnectSocket} =
    useSocketCustomer(order?.id);

  // Modal animation state
  const [modalY] = useState(new Animated.Value(SCREEN_HEIGHT * 0.8));
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [mapPadding, setMapPadding] = useState({bottom: SCREEN_HEIGHT * 0.2});

  // Lokasi user (pickup) dan destination
  const userLocation = useMemo(
    () => ({
      latitude: order?.pick_up_latitude || -7.321656,
      longitude: order?.pick_up_longitude || 112.796317,
    }),
    [order],
  );

  const destinationLocation = useMemo(() => {
    return {
      latitude: -7.332303,
      longitude: 112.788273,
    };
  }, []);

  const [driverToUserRoute, setDriverToUserRoute] = useState([]);
  const [userToDestinationRoute, setUserToDestinationRoute] = useState([]);

  const mapRef = useRef(null);

  // Modal animation functions
  const openModalFull = useCallback(() => {
    setIsModalVisible(true);
    setMapPadding({bottom: SCREEN_HEIGHT * 0.3});
    Animated.spring(modalY, {
      toValue: MODAL_MIN_HEIGHT,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, [modalY]);

  const openModalPartial = useCallback(() => {
    setIsModalVisible(true);
    setMapPadding({bottom: SCREEN_HEIGHT * 0.2});
    Animated.spring(modalY, {
      toValue: SCREEN_HEIGHT * 0.8,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, [modalY]);

  // Set posisi awal saat komponen pertama render
  useEffect(() => {
    openModalPartial();
  }, [openModalPartial]);

  // Helper function untuk Haversine distance
  const calculateHaversineDistance = useCallback((coord1, coord2) => {
    const toRad = x => (x * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(coord2.latitude - coord1.latitude);
    const dLon = toRad(coord2.longitude - coord1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(coord1.latitude)) *
        Math.cos(toRad(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Helper function untuk menghitung distance route OSRM
  const calculateRouteDistance = useCallback(
    routeCoordinates => {
      if (routeCoordinates.length < 2) {
        return 0;
      }

      let totalDistance = 0;
      for (let i = 1; i < routeCoordinates.length; i++) {
        totalDistance += calculateHaversineDistance(
          routeCoordinates[i - 1],
          routeCoordinates[i],
        );
      }
      return totalDistance;
    },
    [calculateHaversineDistance],
  );

  // Fetch routes function dengan OSRM
  const fetchRouteFromOSRM = useCallback(async (startCoords, endCoords) => {
    try {
      const {latitude: startLat, longitude: startLng} = startCoords;
      const {latitude: endLat, longitude: endLng} = endCoords;

      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes?.[0]) {
        const routeCoordinates = data.routes[0].geometry.coordinates.map(
          coord => ({
            latitude: coord[1],
            longitude: coord[0],
          }),
        );
        return routeCoordinates;
      } else {
        return [startCoords, endCoords];
      }
    } catch (error) {
      console.log('❌ Error fetching OSRM route:', error);
      return [startCoords, endCoords];
    }
  }, []);

  // Load routes ketika user location atau locations berubah
  useEffect(() => {
    const loadRoutes = async () => {
      if (!userLocation.latitude || !destinationLocation.latitude) {
        return;
      }

      try {
        const userToDestination = await fetchRouteFromOSRM(
          userLocation,
          destinationLocation,
        );
        setUserToDestinationRoute(userToDestination);

        if (driverLocation?.latitude) {
          const driverToUser = await fetchRouteFromOSRM(
            driverLocation,
            userLocation,
          );
          setDriverToUserRoute(driverToUser);
        } else {
          setDriverToUserRoute([]);
        }
      } catch (error) {
        console.log('❌ Error loading OSRM routes:', error);
      }
    };

    loadRoutes();
  }, [driverLocation, userLocation, destinationLocation, fetchRouteFromOSRM]);

  // Fit map untuk menampilkan semua marker dan rute
  useEffect(() => {
    if (mapRef.current) {
      const coordinates = [userLocation, destinationLocation];

      if (driverLocation?.latitude) {
        coordinates.push(driverLocation);
      }

      // Tambahkan semua koordinat rute untuk fitToCoordinates
      const allCoordinates = [
        ...coordinates,
        ...driverToUserRoute,
        ...userToDestinationRoute,
      ];

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          allCoordinates.length > 0 ? allCoordinates : coordinates,
          {
            edgePadding: {
              top: 100,
              right: 50,
              bottom: 80,
              left: 50,
            },
            animated: true,
          },
        );
      }, 1000);
    }
  }, [
    driverLocation,
    userLocation,
    destinationLocation,
    driverToUserRoute,
    userToDestinationRoute,
    mapPadding.bottom,
  ]);

  // Calculate real-time info - Driver ke User
  const driverToUserInfo = useMemo(() => {
    if (!driverLocation?.latitude) {
      return {eta: '-- min', distance: '-- km'};
    }

    let distance;

    if (driverToUserRoute.length > 1) {
      distance = calculateRouteDistance(driverToUserRoute);
    } else {
      distance = calculateHaversineDistance(driverLocation, userLocation);
    }

    const eta = Math.max(Math.round(distance * 10), 3);

    return {
      eta: `${eta} min`,
      distance: `${distance.toFixed(1)} km`,
    };
  }, [
    driverLocation,
    userLocation,
    driverToUserRoute,
    calculateRouteDistance,
    calculateHaversineDistance,
  ]);

  // PanResponder untuk modal
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (evt, gestureState) => {
        const currentYValue = modalY._value;
        const newY = currentYValue + gestureState.dy;

        // Batasi pergerakan modal
        if (newY >= MODAL_MIN_HEIGHT && newY <= SCREEN_HEIGHT * 0.8) {
          modalY.setValue(newY);
          // Update map padding secara real-time saat modal di-drag
          setMapPadding({bottom: SCREEN_HEIGHT - newY});
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const currentY = modalY._value;
        const swipeDistance = gestureState.dy;
        const swipeVelocity = gestureState.vy;

        const SWIPE_THRESHOLD = 50;
        const VELOCITY_THRESHOLD = 0.5;

        if (
          swipeDistance < -SWIPE_THRESHOLD ||
          swipeVelocity < -VELOCITY_THRESHOLD
        ) {
          openModalFull();
        } else if (
          swipeDistance > SWIPE_THRESHOLD ||
          swipeVelocity > VELOCITY_THRESHOLD
        ) {
          openModalPartial();
        } else {
          if (currentY > SCREEN_HEIGHT * 0.65) {
            openModalPartial();
          } else {
            openModalFull();
          }
        }
      },
    }),
  ).current;

  // Handlers
  const handleManualReconnect = () => {
    reconnectSocket();
  };

  const handleMapPress = () => {
    if (!isModalVisible) {
      openModalPartial();
    } else {
      openModalFull();
    }
  };

  const handleOverlayPress = () => {
    openModalPartial();
  };

  const handleCallDriver = () => {
    if (user?.phone) {
      Alert.alert(
        'Hubungi Driver',
        `Apakah Anda ingin menghubungi ${user?.username || 'Driver'}?`,
        [
          {text: 'Batal', style: 'cancel'},
          {
            text: 'Telepon',
            onPress: () => console.log('Memanggil user:', user.phone),
          },
        ],
      );
    } else {
      Alert.alert('Info', 'Nomor telepon user tidak tersedia');
    }
  };

  const handleMessageDriver = () => {
    if (user?.phone) {
      console.log('Mengirim pesan ke user:', user.phone);
    } else {
      Alert.alert('Info', 'Nomor telepon user tidak tersedia');
    }
  };

  return (
    <View style={styles.container}>
      {/* Map View dengan padding dinamis */}
      <TouchableOpacity
        style={styles.mapTouchable}
        activeOpacity={1}
        onPress={handleMapPress}>
        <MapView
          ref={mapRef}
          provider="google"
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02 * (width / SCREEN_HEIGHT),
          }}
          mapPadding={{
            top: 50,
            right: 10,
            bottom: mapPadding.bottom + 80,
            left: 10,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          rotateEnabled={true}
          toolbarEnabled={false}>
          {/* Driver Marker */}
          {driverLocation?.latitude && (
            <Marker
              coordinate={driverLocation}
              pinColor="blue"
              title="Driver Anda"
              description={`${driverToUserInfo.distance} dari lokasi Anda`}
            />
          )}

          {/* User/Pickup Marker */}
          <Marker
            coordinate={userLocation}
            title="Lokasi Penjemputan"
            pinColor="green"
            description="Titik penjemputan Anda"
          />

          {/* Destination Marker */}
          <Marker
            coordinate={destinationLocation}
            title="Tujuan"
            pinColor="red"
            description={destination?.name || 'Lokasi tujuan'}
          />

          {/* Routes dari OSRM */}
          {driverToUserRoute.length > 0 && (
            <Polyline
              coordinates={driverToUserRoute}
              strokeColor="#3498db"
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {userToDestinationRoute.length > 0 && (
            <Polyline
              coordinates={userToDestinationRoute}
              strokeColor="#e74c3c"
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </MapView>
      </TouchableOpacity>

      {/* Connection Status Banner */}
      <View style={styles.topBanner}>
        {!isConnected && (
          <View style={[styles.statusBanner, styles.disconnectedBanner]}>
            <Icons name="wifi-off" size={16} color="#FFF" />
            <Text style={styles.statusBannerText}>
              {isConnecting ? 'Menghubungkan...' : 'Koneksi terputus'}
            </Text>
            <TouchableOpacity onPress={handleManualReconnect}>
              <Icons name="refresh" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {isConnected && driverLocation && (
          <View style={[styles.statusBanner, styles.connectedBanner]}>
            <Icons name="directions-bike" size={16} color="#FFF" />
            <Text style={styles.statusBannerText}>
              Driver {driverToUserInfo.distance} dari Anda • ETA:{' '}
              {driverToUserInfo.eta}
            </Text>
          </View>
        )}

        {isConnected && !driverLocation && (
          <View style={[styles.statusBanner, styles.waitingBanner]}>
            <Icons name="schedule" size={16} color="#FFF" />
            <Text style={styles.statusBannerText}>
              Menunggu lokasi driver...
            </Text>
          </View>
        )}
      </View>

      {/* Modal */}
      <>
        {isModalVisible && (
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleOverlayPress}
          />
        )}

        <Animated.View
          style={[
            styles.modal,
            {
              transform: [{translateY: modalY}],
            },
          ]}>
          <View style={styles.modalHandle} {...panResponder.panHandlers}>
            <View style={styles.handleBar} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Driver akan segera datang</Text>

            {/* Informasi Pesanan */}
            <View style={styles.row}>
              <FloatingInput
                label="Lokasi Tujuan"
                value={destination?.name || '—'}
                editable={false}
                selectTextOnFocus={false}
              />
            </View>

            <View style={styles.row}>
              <FloatingInput
                label="Alamat Rumah"
                value={order?.pick_up_location || '—'}
                editable={false}
                selectTextOnFocus={false}
              />
            </View>

            <View style={styles.infoRow}>
              <Image
                source={{uri: user?.photo_profile}}
                style={styles.avatar}
              />
              <View>
                <FloatingInput
                  label="Nama Driver"
                  value={user?.username || '—'}
                  editable={false}
                  selectTextOnFocus={false}
                />
                <View style={styles.infoRowTwo}>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={handleMessageDriver}>
                    <IconWA
                      name="whatsapp"
                      size={40}
                      color="#4E1F1A"
                      style={styles.iconCall}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={handleCallDriver}>
                    <IconPhone
                      name="phone"
                      size={40}
                      color="#4E1F1A"
                      style={styles.iconCall}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.infoRowThree}>
              <Text style={styles.infoLabel}>Harga:</Text>
              <Text style={styles.infoValue}>Rp. 7.000</Text>
            </View>
          </View>
        </Animated.View>
      </>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4E1F1A',
  },
  mapTouchable: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  topBanner: {
    position: 'absolute',
    top: 30,
    left: 20,
    right: 20,
    zIndex: 90,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disconnectedBanner: {
    backgroundColor: '#FF9800',
  },
  connectedBanner: {
    backgroundColor: '#4CAF50',
  },
  waitingBanner: {
    backgroundColor: '#2196F3',
  },
  statusBannerText: {
    flex: 1,
    color: '#FFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 40,
  },
  modal: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: '#BB8B6D',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    zIndex: 50,
    paddingHorizontal: 30,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
  },
  modalHandle: {
    paddingVertical: 10,
    paddingHorizontal: '40%',
    alignSelf: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#F9F1E2',
    borderRadius: 2,
  },
  modalContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    color: '#F9F1E2',
    marginBottom: 30,
    marginTop: 10,
    fontWeight: '600',
  },
  row: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 15,
    width: '100%',
  },
  infoRowTwo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 30,
  },
  infoRowThree: {
    flexDirection: 'row',
    marginTop: 25,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  iconCall: {
    backgroundColor: '#F9F1E2',
    padding: 15,
    borderRadius: 50,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 40,
  },
  infoLabel: {
    fontSize: 20,
    color: '#F9F1E2',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 20,
    color: '#A9F1F9',
    fontWeight: 'bold',
  },
});

export default OrderingUserScreen;
