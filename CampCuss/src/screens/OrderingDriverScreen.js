import React, {useRef, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
  // Alert,
  Image,
} from 'react-native';
import MapView, {Marker, Polyline} from 'react-native-maps';

import {useSocket} from '../hooks/useSocket';
import {useGeolocation} from '../hooks/useGeolocation';
import {useModalAnimation} from '../hooks/useModalAnimation';
// import {getPaymentStatusText, formatDateTime} from '../utils/formatters';
import FloatingInput from '../components/FloatingInput';
import IconWA from 'react-native-vector-icons/Fontisto';
import IconPhone from 'react-native-vector-icons/Fontisto';
import {useDestinationById} from '../hooks/useDestinationById';
import {useUserById} from '../hooks/useUserById';
import IconUser from 'react-native-vector-icons/FontAwesome6';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

const OrderingDriverScreen = ({route}) => {
  const {order} = route.params || {};
  const {destination} = useDestinationById(order?.destination_id);
  const {user} = useUserById(order?.user_id);
  const mapRef = useRef(null);
  const [retryCount, setRetryCount] = useState(0);
  const [driverToPickupRoute, setDriverToPickupRoute] = useState([]);
  const [pickupToDestinationRoute, setPickupToDestinationRoute] = useState([]);

  const {
    isConnected,
    isConnecting,
    sendDriverLocation,
    startSendingLocation,
    stopSendingLocation,
    reconnectSocket,
  } = useSocket(order?.id);

  const {
    driverLocation,
    isLoading,
    isTracking,
    startLocationTracking,
    stopLocationTracking,
  } = useGeolocation(sendDriverLocation, startSendingLocation, isConnected);

  const {
    modalY,
    isModalVisible,
    openModalFull,
    openModalPartial,
    MODAL_MIN_HEIGHT,
  } = useModalAnimation();

  // Koordinat menggunakan useMemo
  const pickupLocation = useMemo(
    () => ({
      latitude: order?.pick_up_latitude || -7.290293,
      longitude: order?.pick_up_longitude || 112.792812,
    }),
    [order?.pick_up_latitude, order?.pick_up_longitude],
  );

  const destinationLocation = useMemo(
    () => ({
      latitude: -7.332303,
      longitude: 112.788273,
    }),
    [],
  );

  // FUNGSI BARU: Fetch rute dari OSRM
  const fetchRouteFromOSRM = async (startCoords, endCoords) => {
    try {
      const {latitude: startLat, longitude: startLng} = startCoords;
      const {latitude: endLat, longitude: endLng} = endCoords;

      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

      console.log('🔄 Fetching route from OSRM:', url);

      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const routeCoordinates = data.routes[0].geometry.coordinates.map(
          coord => ({
            latitude: coord[1],
            longitude: coord[0],
          }),
        );

        console.log(
          '✅ Route fetched successfully, coordinates:',
          routeCoordinates.length,
        );
        return routeCoordinates;
      } else {
        console.log('❌ No route found from OSRM');
        return [];
      }
    } catch (error) {
      console.log('❌ Error fetching route from OSRM:', error);
      return [];
    }
  };

  // EFFECT BARU: Load rute ketika driver location atau koordinat berubah
  useEffect(() => {
    const loadRoutes = async () => {
      if (!driverLocation || !pickupLocation || !destinationLocation) {
        return;
      }

      console.log('🗺️ Loading routes...');

      try {
        // Rute dari driver ke pickup location
        const driverToPickup = await fetchRouteFromOSRM(
          driverLocation,
          pickupLocation,
        );
        setDriverToPickupRoute(driverToPickup);

        // Rute dari pickup ke destination
        const pickupToDestination = await fetchRouteFromOSRM(
          pickupLocation,
          destinationLocation,
        );
        setPickupToDestinationRoute(pickupToDestination);

        console.log('✅ All routes loaded successfully');
      } catch (error) {
        console.log('❌ Error loading routes:', error);
      }
    };

    loadRoutes();
  }, [driverLocation, pickupLocation, destinationLocation]);

  useEffect(() => {
    if (order?.id && !isLoading && !isTracking) {
      console.log('🎯 Starting location tracking with order:', order.id);
      startLocationTracking();
    }
  }, [order?.id, startLocationTracking, isLoading, isTracking]);

  useEffect(() => {
    if (isConnected) {
      console.log('✅ Socket connected - ready to send locations');
      setRetryCount(0);
    } else if (isConnecting) {
      console.log('🔄 Socket connecting...');
    } else {
      console.log('❌ Socket disconnected');

      const retryTimer = setTimeout(() => {
        if (retryCount < 3) {
          console.log(`🔄 Retry attempt ${retryCount + 1}/3`);
          setRetryCount(prev => prev + 1);
          reconnectSocket();
        }
      }, 5000);

      return () => clearTimeout(retryTimer);
    }
  }, [isConnected, isConnecting, reconnectSocket, retryCount]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up OrderingDriverScreen');
      stopLocationTracking();
      stopSendingLocation();
    };
  }, [stopLocationTracking, stopSendingLocation]);

  // PanResponder untuk drag modal
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
        if (newY >= 0 && newY <= SCREEN_HEIGHT - MODAL_MIN_HEIGHT) {
          modalY.setValue(newY);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const currentY = modalY._value;
        const swipeDistance = gestureState.dy;
        const swipeVelocity = gestureState.vy;

        // Threshold untuk menentukan swipe
        const SWIPE_THRESHOLD = 50;
        const VELOCITY_THRESHOLD = 0.5;

        // Logika untuk menentukan posisi akhir modal
        if (
          swipeDistance < -SWIPE_THRESHOLD ||
          swipeVelocity < -VELOCITY_THRESHOLD
        ) {
          // Swipe up cepat atau jarak cukup - buka full
          openModalFull();
        } else if (
          swipeDistance > SWIPE_THRESHOLD ||
          swipeVelocity > VELOCITY_THRESHOLD
        ) {
          // Swipe down cepat atau jarak cukup - tutup partial
          openModalPartial();
        } else {
          // Tap biasa - toggle antara partial dan full
          if (currentY > SCREEN_HEIGHT * 0.3) {
            openModalFull();
          } else {
            openModalPartial();
          }
        }
      },
    }),
  ).current;

  // Effect untuk mulai tracking location
  useEffect(() => {
    console.log('🚀 Starting location tracking');
    startLocationTracking();

    return () => {
      console.log('🛑 Stopping location tracking');
      stopLocationTracking();
      stopSendingLocation();
    };
  }, [startLocationTracking, stopLocationTracking, stopSendingLocation]);

  // Fit map untuk menampilkan semua marker dan rute
  useEffect(() => {
    if (driverLocation && mapRef.current) {
      const coordinates = [driverLocation, pickupLocation, destinationLocation];

      // Tambahkan semua koordinat rute untuk fitToCoordinates
      const allCoordinates = [
        ...coordinates,
        ...driverToPickupRoute,
        ...pickupToDestinationRoute,
      ];

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          allCoordinates.length > 0 ? allCoordinates : coordinates,
          {
            edgePadding: {top: 0, right: 50, bottom: 200, left: 50},
            animated: true,
          },
        );
      }, 1000);
    }
  }, [
    driverLocation,
    pickupLocation,
    destinationLocation,
    driverToPickupRoute,
    pickupToDestinationRoute,
  ]);

  // Handler untuk klik map - buka modal ke atas
  const handleMapPress = () => {
    if (!isModalVisible) {
      // Jika modal tidak terlihat, buka modal
      openModalPartial();
    } else {
      // Jika modal terlihat, buka ke posisi full
      openModalFull();
    }
  };

  // Handler untuk overlay - jangan tutup modal, tapi ke posisi partial
  const handleOverlayPress = () => {
    openModalPartial();
  };

  // Action handlers
  // const handleStartTrip = () => {
  //   Alert.alert(
  //     'Mulai Perjalanan',
  //     'Apakah Anda yakin ingin memulai perjalanan?',
  //     [
  //       {text: 'Batal', style: 'cancel'},
  //       {
  //         text: 'Mulai',
  //         onPress: () => {
  //           console.log('Memulai perjalanan...');
  //         },
  //       },
  //     ],
  //   );
  // };

  // const handleContactCustomer = () => {
  //   if (order?.customer?.phone) {
  //     console.log('Menghubungi customer:', order.customer.phone);
  //   } else {
  //     Alert.alert('Info', 'Nomor telepon customer tidak tersedia');
  //   }
  // };

  // if (isLoading) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <Text style={styles.loadingText}>Mengaktifkan GPS...</Text>
  //     </View>
  //   );
  // }

  return (
    <View style={styles.container}>
      {/* TouchableOpacity untuk menangani klik map */}
      <TouchableOpacity
        style={styles.mapTouchable}
        activeOpacity={1}
        onPress={handleMapPress}>
        <MapView
          ref={mapRef}
          provider="google"
          style={styles.map}
          initialRegion={{
            latitude: driverLocation?.latitude || -7.290293,
            longitude: driverLocation?.longitude || 112.792812,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={false}
          toolbarEnabled={false}>
          {/* Marker Driver */}
          {driverLocation && (
            <Marker
              coordinate={driverLocation}
              pinColor="blue"
              title="Posisi Anda"
              description="Lokasi driver saat ini"
            />
          )}

          {/* Marker Pickup */}
          <Marker
            coordinate={pickupLocation}
            pinColor="green"
            title="Lokasi Penjemputan"
            description={order?.pick_up_location || 'Lokasi penjemputan'}
          />

          {/* Marker Destination */}
          <Marker
            coordinate={destinationLocation}
            pinColor="red"
            title="Lokasi Tujuan"
            description={order?.destination_location || 'Tujuan perjalanan'}
          />

          {/* RUTE BARU: Driver ke Pickup Location */}
          {driverToPickupRoute.length > 0 && (
            <Polyline
              coordinates={driverToPickupRoute}
              strokeColor="#3498db" // Biru untuk rute driver ke pickup
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* RUTE BARU: Pickup ke Destination */}
          {pickupToDestinationRoute.length > 0 && (
            <Polyline
              coordinates={pickupToDestinationRoute}
              strokeColor="#e74c3c" // Merah untuk rute pickup ke destination
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </MapView>
      </TouchableOpacity>

      {/* Status Indicator */}
      <View style={styles.floatingStatus}>
        <View
          style={[
            styles.statusDot,
            isConnected ? styles.statusConnected : styles.statusDisconnected,
          ]}
        />
        <Text style={styles.statusText}>
          {isConnected ? 'Mengirim lokasi' : 'Menghubungkan...'}
        </Text>
      </View>

      {/* Modal */}
      <>
        {/* Overlay - hanya tampil ketika modal di posisi full */}
        {isModalVisible && (
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleOverlayPress}
          />
        )}

        {/* Modal Content */}
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
            <Text style={styles.modalTitle}>Segera datang yaaa</Text>

            {/* Status Rute Loading */}
            {/* {isLoadingRoutes && (
              <View style={styles.routeLoadingBadge}>
                <Text style={styles.routeLoadingText}>📍 Memuat rute...</Text>
              </View>
            )} */}

            {/* <View style={styles.divider} /> */}

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
              {user?.photo_profile ? (
                <Image
                  source={{uri: user?.photo_profile}}
                  style={styles.avatar}
                />
              ) : (
                <IconUser
                  name="circle-user"
                  style={styles.avatar}
                  size={170}
                />
              )}

              <View>
                <FloatingInput
                  label="Nama Customer"
                  value={user?.username || '—'}
                  editable={false}
                  selectTextOnFocus={false}
                />
                <View style={styles.infoRowTwo}>
                  <IconWA
                    name="whatsapp"
                    size={40}
                    color="#4E1F1A"
                    style={styles.iconCall}
                  />
                  <IconPhone
                    name="phone"
                    size={40}
                    color="#4E1F1A"
                    style={styles.iconCall}
                  />
                </View>
              </View>
            </View>

            <View style={styles.infoRowThree}>
              <Text style={styles.infoLabel}>Harga:</Text>
              <Text style={styles.infoValue}>Rp. 7.000</Text>
            </View>

            {/* <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleContactCustomer}>
                <Text style={styles.secondaryButtonText}>Hubungi Customer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleStartTrip}>
                <Text style={styles.primaryButtonText}>Mulai Perjalanan</Text>
              </TouchableOpacity>
            </View> */}
          </View>
        </Animated.View>
      </>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#4E1F1A'},
  mapTouchable: {
    flex: 1,
  },
  map: {flex: 1},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4E1F1A',
    padding: 20,
  },
  loadingText: {fontSize: 18, color: '#FCEBD7', marginBottom: 10},
  errorText: {fontSize: 14, color: '#FF6B6B', textAlign: 'center'},
  warningText: {
    fontSize: 12,
    color: '#FFA500',
    textAlign: 'center',
    marginTop: 5,
  },
  // Floating Status
  floatingStatus: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    zIndex: 30,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusConnected: {
    backgroundColor: '#4CAF50',
  },
  statusDisconnected: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
  },
  routeLoadingText: {
    fontSize: 9,
    color: '#3498db',
    marginLeft: 5,
    fontStyle: 'italic',
  },
  // Modal Styles
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
    height: SCREEN_HEIGHT * 0.7,
    backgroundColor: '#BB8B6D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 50,
    paddingHorizontal: 35,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
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
    marginTop: 5,
    width: 40,
    height: 4,
    backgroundColor: '#F9F1E2',
    borderRadius: 2,
  },
  modalContent: {flex: 1},
  modalTitle: {
    fontSize: 20,
    color: '#F9F1E2',
    marginBottom: 30,
    marginTop: 10,
  },
  // Connection Badge
  connectionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 10,
  },
  connected: {
    backgroundColor: '#D4EDDA',
  },
  disconnected: {
    backgroundColor: '#FFF3CD',
  },
  connectionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#155724',
  },
  // Route Loading Badge
  routeLoadingBadge: {
    backgroundColor: '#D6EAF8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 10,
  },
  // Status Badge
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  statusAccepted: {
    backgroundColor: '#D4EDDA',
  },
  statusPending: {
    backgroundColor: '#FFF3CD',
  },
  statusTextActive: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#155724',
  },
  // Info Rows
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
  infoLabel: {fontSize: 20, color: '#F9F1E2'},
  infoValue: {fontSize: 20, color: '#A9F1F9'},
  divider: {height: 1, backgroundColor: '#E0E0E0', marginVertical: 12},
  // Route Info
  routeInfo: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  routeInfoTitle: {
    fontWeight: 'bold',
    color: '#4E1F1A',
    marginBottom: 8,
  },
  routeLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 4,
    borderRadius: 2,
    marginRight: 6,
    backgroundColor: '#3498db',
  },
  legendText: {
    fontSize: 10,
    color: '#666',
  },
  // Payment Status
  paymentStatus: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  paymentPaid: {
    color: '#28A745',
  },
  paymentPending: {
    color: '#DC3545',
  },
  // Total Price
  totalPrice: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#4E1F1A',
  },
  // Error Container
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4E1F1A',
  },
  secondaryButton: {
    backgroundColor: '#FCEBD7',
    borderWidth: 1,
    borderColor: '#4E1F1A',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#4E1F1A',
    fontWeight: 'bold',
  },
});

export default OrderingDriverScreen;
