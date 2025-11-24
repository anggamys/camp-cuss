import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import MapView, {Marker, Polyline} from 'react-native-maps';
import Icons from 'react-native-vector-icons/MaterialIcons';

const {width, height} = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const OrderingUserScreen = ({route, navigation}) => {
  const {order} = route.params;

  const [driverLocation, setDriverLocation] = useState({
    latitude: -7.2575,
    longitude: 112.7521,
  });
  const [userLocation, setUserLocation] = useState({
    latitude: -7.25,
    longitude: 112.76,
  });
  const [destinationLocation, setDestinationLocation] = useState({
    latitude: -7.245,
    longitude: 112.77,
  });

  const [isDriverModalVisible, setIsDriverModalVisible] = useState(false);

  const mapRef = useRef(null);

  // Simulasi gerak driver
  useEffect(() => {
    const interval = setInterval(() => {
      setDriverLocation(prev => ({
        ...prev,
        latitude: prev.latitude + 0.0002,
        longitude: prev.longitude - 0.0001,
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fitMapToMarkers = () => {
    if (mapRef.current) {
      const locations = [driverLocation, userLocation, destinationLocation];
      const latitudes = locations.map(loc => loc.latitude);
      const longitudes = locations.map(loc => loc.longitude);

      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);

      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const latDelta = maxLat - minLat + 0.005;
      const lngDelta = maxLng - minLng + 0.005;

      mapRef.current.animateToRegion({
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: latDelta > 0.01 ? latDelta : 0.01,
        longitudeDelta: lngDelta > 0.01 ? lngDelta : 0.01,
      });
    }
  };

  useEffect(() => {
    fitMapToMarkers();
  }, [driverLocation]);

  const driverInfo = {
    name: 'Jing Sabin',
    rating: 4.8,
    vehicle: 'Yen VIP - Ban Mulla 2',
    plateNumber: 'L 1234 XYZ',
    phone: '+62 812-3456-7890',
    avatar: 'https://via.placeholder.com/80',
    eta: '36 min',
    distance: '18 km',
  };

  const handleCallDriver = () => {
    console.log('Memanggil driver:', driverInfo.phone);
  };

  const handleMessageDriver = () => {
    console.log('Mengirim pesan ke driver:', driverInfo.phone);
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Batalkan Order',
      'Apakah Anda yakin ingin membatalkan order?',
      [
        {text: 'Tidak', style: 'cancel'},
        {
          text: 'Ya, Batalkan',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  const openDriverModal = () => setIsDriverModalVisible(true);
  const closeDriverModal = () => setIsDriverModalVisible(false);

  const polylineCoordinates = [
    driverLocation,
    userLocation,
    destinationLocation,
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4E1F1A" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icons name="arrow-back" size={24} color="#FCEBD7" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver Ditemukan</Text>
        <TouchableOpacity onPress={openDriverModal} style={styles.infoButton}>
          <Icons name="info-outline" size={24} color="#FCEBD7" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Peta */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            }}
            showsUserLocation={false}
            followsUserLocation={false}>
            <Marker
              coordinate={driverLocation}
              pinColor="blue"
              title="Driver Anda"
            />
            <Marker
              coordinate={userLocation}
              pinColor="green"
              title="Lokasi Anda"
            />
            <Marker
              coordinate={destinationLocation}
              pinColor="red"
              title="Tujuan"
            />
            <Polyline
              coordinates={polylineCoordinates}
              strokeColor="#4E1F1A"
              strokeWidth={3}
              lineDashPattern={[5, 5]}
            />
          </MapView>
        </View>

        {/* UI Utama */}
        <View style={styles.driverCard}>
          <View style={styles.driverHeader}>
            <View style={styles.driverProfile}>
              <Image
                source={{uri: driverInfo.avatar}}
                style={styles.driverAvatar}
              />
              <View style={styles.driverTextInfo}>
                <Text style={styles.driverName}>{driverInfo.name}</Text>
                <View style={styles.ratingContainer}>
                  <Icons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>{driverInfo.rating}</Text>
                </View>
              </View>
            </View>
            <View style={styles.etaContainer}>
              <Text style={styles.etaTime}>{driverInfo.eta}</Text>
              <Text style={styles.etaLabel}>Perkiraan</Text>
            </View>
          </View>

          <View style={styles.vehicleInfo}>
            <Icons name="directions-bike" size={20} color="#4E1F1A" />
            <Text style={styles.vehicleText}>{driverInfo.vehicle}</Text>
            <Text style={styles.plateText}>{driverInfo.plateNumber}</Text>
          </View>

          <View style={styles.distanceInfo}>
            <Text style={styles.distanceText}>{driverInfo.distance}</Text>
            <Text style={styles.distanceLabel}>Jarak driver</Text>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Icons name="location-on" size={24} color="#4E1F1A" />
            <Text style={styles.statusTitle}>Driver akan segera datang</Text>
          </View>
          <View style={styles.statusProgress}>
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, styles.activeDot]} />
              <Text style={styles.progressText}>Driver Menuju Lokasi</Text>
            </View>
            <View style={styles.progressLine} />
            <View style={styles.progressStep}>
              <View style={styles.progressDot} />
              <Text style={styles.progressText}>Penjemputan</Text>
            </View>
            <View style={styles.progressLine} />
            <View style={styles.progressStep}>
              <View style={styles.progressDot} />
              <Text style={styles.progressText}>Perjalanan</Text>
            </View>
            <View style={styles.progressLine} />
            <View style={styles.progressStep}>
              <View style={styles.progressDot} />
              <Text style={styles.progressText}>Sampai Tujuan</Text>
            </View>
          </View>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationSection}>
            <Text style={styles.sectionLabel}>Lokasi tujuan</Text>
            <Text style={styles.locationText}>
              {order?.destination?.name || 'Fakultas Ilmu Komputer 2'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.locationSection}>
            <Text style={styles.sectionLabel}>Alamat Rumah</Text>
            <Text style={styles.locationText}>
              {order?.pick_up_location || 'Rungkut Mapan OG SA No. 2'}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={handleCallDriver}>
            <Icons name="call" size={24} color="#FCEBD7" />
            <Text style={styles.actionButtonText}>Telepon</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.messageButton]}
            onPress={handleMessageDriver}>
            <Icons name="chat" size={24} color="#FCEBD7" />
            <Text style={styles.actionButtonText}>Pesan</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelOrder}>
          <Text style={styles.cancelButtonText}>Batalkan Perjalanan</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* === DRIVER MODAL DARI BAWAH === */}
      <Modal
        visible={isDriverModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeDriverModal}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={closeDriverModal}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Driver</Text>
              <TouchableOpacity onPress={closeDriverModal}>
                <Icons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.driverInfoRow}>
                <Image
                  source={{uri: driverInfo.avatar}}
                  style={styles.driverAvatar}
                />
                <View>
                  <Text style={styles.driverName}>{driverInfo.name}</Text>
                  <View style={styles.ratingRow}>
                    <Icons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>{driverInfo.rating}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Kendaraan</Text>
                <Text style={styles.infoValue}>{driverInfo.vehicle}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Plat Nomor</Text>
                <Text style={styles.infoValue}>{driverInfo.plateNumber}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Jarak dari Anda</Text>
                <Text style={styles.infoValue}>{driverInfo.distance}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Estimasi Tiba</Text>
                <Text style={styles.infoValue}>{driverInfo.eta}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Nomor Telepon</Text>
                <Text style={styles.infoValue}>{driverInfo.phone}</Text>
              </View>

              <TouchableOpacity
                style={styles.callDriverButton}
                onPress={() => {
                  closeDriverModal();
                  handleCallDriver();
                }}>
                <Text style={styles.callDriverButtonText}>Hubungi Driver</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F1E2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#4E1F1A',
  },
  backButton: {padding: 8},
  infoButton: {padding: 8},
  headerTitle: {fontSize: 20, fontWeight: 'bold', color: '#FCEBD7'},
  content: {
    flex: 1,
    padding: 20,
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#eee',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  driverProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4E1F1A',
    marginBottom: 4,
  },
  ratingContainer: {flexDirection: 'row', alignItems: 'center'},
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  etaContainer: {alignItems: 'flex-end'},
  etaTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4E1F1A',
  },
  etaLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCEBD7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  vehicleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#4E1F1A',
    marginLeft: 8,
  },
  plateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4E1F1A',
    backgroundColor: '#E8D5C4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  distanceInfo: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  distanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4E1F1A',
  },
  distanceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 20},
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4E1F1A',
    marginLeft: 8,
  },
  statusProgress: {alignItems: 'flex-start'},
  progressStep: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8E8E8',
    marginRight: 12,
  },
  activeDot: {backgroundColor: '#4E1F1A'},
  progressLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E8E8E8',
    marginLeft: 5,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#4E1F1A',
    fontWeight: '500',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationSection: {marginBottom: 16},
  sectionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  locationText: {
    fontSize: 16,
    color: '#4E1F1A',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  callButton: {backgroundColor: '#4E1F1A'},
  messageButton: {backgroundColor: '#BB8B6D'},
  actionButtonText: {
    color: '#FCEBD7',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },

  // === MODAL STYLES ===
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F9F1E2',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4E1F1A',
  },
  modalScrollView: {
    padding: 20,
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4E1F1A',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callDriverButton: {
    backgroundColor: '#4E1F1A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  callDriverButtonText: {
    color: '#FCEBD7',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderingUserScreen;
