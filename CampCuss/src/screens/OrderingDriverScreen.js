// src/screens/OrderingDriverScreen.js
import React, {useRef, useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import MapView, {Marker, Polyline} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const MODAL_MIN_HEIGHT = SCREEN_HEIGHT * 0.35; // posisi terbuka sebagian
const MODAL_MAX_HEIGHT = SCREEN_HEIGHT * 0.8; // posisi terbuka penuh

const OrderingDriverScreen = ({route}) => {
  const {order} = route.params || {};

  const [driverLocation, setDriverLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);

  // Animated value untuk posisi modal
  const modalY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Koordinat menggunakan useMemo untuk menghindari re-render tidak perlu
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

  // Format status pesanan
  const getStatusText = useCallback(status => {
    const statusMap = {
      accepted: 'Diterima',
      pending: 'Menunggu',
      on_the_way: 'Dalam Perjalanan',
      picked_up: 'Penumpang Diambil',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    return statusMap[status] || status;
  }, []);

  // Format payment status
  const getPaymentStatusText = useCallback(status => {
    const statusMap = {
      pending: 'Belum Bayar',
      paid: 'Sudah Bayar',
      failed: 'Gagal Bayar',
    };
    return statusMap[status] || status;
  }, []);

  // Format price
  const formatPrice = useCallback(price => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(price || 0);
  }, []);

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

        if (newY >= MODAL_MAX_HEIGHT * 0.3 && newY <= SCREEN_HEIGHT) {
          modalY.setValue(newY);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const swipeDistance = gestureState.dy;

        if (swipeDistance > 50) {
          closeModal();
        } else if (swipeDistance < -50) {
          openModalFull();
        } else {
          openModalPartial();
        }
      },
    }),
  ).current;

  // Fungsi untuk mengatur posisi modal
  const openModalPartial = useCallback(() => {
    setIsModalVisible(true);
    Animated.spring(modalY, {
      toValue: MODAL_MIN_HEIGHT,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [modalY]);

  const openModalFull = useCallback(() => {
    setIsModalVisible(true);
    Animated.spring(modalY, {
      toValue: MODAL_MAX_HEIGHT * 0.3,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [modalY]);

  const closeModal = useCallback(() => {
    Animated.spring(modalY, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setIsModalVisible(false);
    });
  }, [modalY]);

  // --- Geolocation Logic ---
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

      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude} = position.coords;
          setDriverLocation({latitude, longitude});
          setLocationError(null);
          setIsLoading(false);

          setTimeout(() => {
            openModalPartial();
          }, 500);
        },
        positionError => {
          console.warn('Get current position error:', positionError);
          setLocationError(
            'Gagal mendapatkan lokasi: ' + positionError.message,
          );
          setIsLoading(false);
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );

      watchIdRef.current = Geolocation.watchPosition(
        position => {
          const {latitude, longitude} = position.coords;
          setDriverLocation({latitude, longitude});
          setLocationError(null);
        },
        watchError => {
          console.warn('Watch position error:', watchError);
          setLocationError('Error melacak lokasi: ' + watchError.message);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10,
          interval: 5000,
          timeout: 10000,
        },
      );
    } catch (err) {
      console.warn('Start tracking error:', err);
      setLocationError('Error memulai pelacakan lokasi');
      setIsLoading(false);
    }
  }, [requestLocationPermission, openModalPartial]);

  useEffect(() => {
    startLocationTracking();

    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startLocationTracking]);

  // Fit map untuk menampilkan semua marker
  useEffect(() => {
    if (driverLocation && mapRef.current) {
      const coordinates = [driverLocation, pickupLocation, destinationLocation];

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: {top: 50, right: 50, bottom: 50, left: 50},
          animated: true,
        });
      }, 1000);
    }
  }, [driverLocation, pickupLocation, destinationLocation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Mengaktifkan GPS...</Text>
        {locationError && <Text style={styles.errorText}>{locationError}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            pinColor="blue"
            title="Posisi Anda"
            description="Lokasi driver saat ini"
          />
        )}
        <Marker
          coordinate={pickupLocation}
          pinColor="green"
          title="Lokasi Penjemputan"
          description={order?.pick_up_location || 'Lokasi penjemputan'}
        />
        <Marker
          coordinate={destinationLocation}
          pinColor="red"
          title="Lokasi Tujuan"
          description="Tujuan perjalanan"
        />

        {driverLocation && (
          <Polyline
            coordinates={[driverLocation, pickupLocation, destinationLocation]}
            strokeColor="#4E1F1A"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* Overlay untuk klik luar - hanya ditampilkan ketika modal visible */}
      {isModalVisible && (
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: modalY.interpolate({
                inputRange: [MODAL_MAX_HEIGHT * 0.3, SCREEN_HEIGHT],
                outputRange: [0.5, 0],
                extrapolate: 'clamp',
              }),
            },
          ]}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={closeModal}
          />
        </Animated.View>
      )}

      {/* Modal yang bisa di-drag */}
      <Animated.View
        style={[
          styles.modal,
          {
            height: SCREEN_HEIGHT * 0.5,
            transform: [{translateY: modalY}],
          },
        ]}>
        {/* Handle untuk drag */}
        <View style={styles.modalHandle} {...panResponder.panHandlers}>
          <View style={styles.handleBar} />
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Detail Pesanan</Text>

          {/* Status Pesanan */}
          <View
            style={[
              styles.statusBadge,
              order?.status === 'accepted'
                ? styles.statusAccepted
                : styles.statusPending,
            ]}>
            <Text style={styles.statusText}>
              Status: {getStatusText(order?.status)}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Informasi Pesanan */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kode Pesanan:</Text>
            <Text style={styles.infoValue}>{order?.order_code || '—'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lokasi Penjemputan:</Text>
            <Text style={styles.infoValue}>
              {order?.pick_up_location || '—'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status Pembayaran:</Text>
            <Text
              style={[
                styles.infoValue,
                styles.paymentStatus,
                order?.payment_status === 'paid'
                  ? styles.paymentPaid
                  : styles.paymentPending,
              ]}>
              {getPaymentStatusText(order?.payment_status)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Biaya:</Text>
            <Text style={[styles.infoValue, styles.totalPrice]}>
              {formatPrice(order?.total_price)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Metode Pembayaran:</Text>
            <Text style={styles.infoValue}>
              {order?.payment_method || 'Belum dipilih'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dibuat Pada:</Text>
            <Text style={styles.infoValue}>
              {order?.created_at
                ? new Date(order.created_at).toLocaleString('id-ID')
                : '—'}
            </Text>
          </View>

          {locationError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{locationError}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
              <Text style={styles.secondaryButtonText}>Hubungi Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.primaryButton]}>
              <Text style={styles.primaryButtonText}>Mulai Perjalanan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#4E1F1A'},
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
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  overlayTouchable: {
    flex: 1,
  },
  modal: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F9F1E2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHandle: {
    paddingVertical: 10,
    paddingHorizontal: '40%',
    alignSelf: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
  modalContent: {flex: 1},
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4E1F1A',
    textAlign: 'center',
    marginBottom: 15,
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
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#155724',
  },
  // Info Rows
  infoRow: {flexDirection: 'row', marginBottom: 10},
  infoLabel: {fontWeight: '600', color: '#4E1F1A', width: 140},
  infoValue: {flex: 1, color: '#555', fontSize: 14},
  divider: {height: 1, backgroundColor: '#E0E0E0', marginVertical: 12},
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
