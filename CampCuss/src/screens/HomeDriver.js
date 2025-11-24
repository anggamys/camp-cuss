import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Image,
  TextInput,
} from 'react-native';
import {useAuth} from '../hooks/useAuth';
import {useDriverOrders} from '../hooks/useDriverOrders';
import {useDriverStatus} from '../hooks/useDriverStatus';
import BottomNav from '../components/BottomNav';
import IconBell from 'react-native-vector-icons/MaterialCommunityIcons';
import Icons from 'react-native-vector-icons/Ionicons';
import IconUsers from 'react-native-vector-icons/FontAwesome';
import IconMotorcycle from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';

export default function HomeDriver() {
  const {profile} = useAuth();
  const navigation = useNavigation();
  const {isDriverActive} = useDriverStatus();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {activeOrder, loadingAccept, acceptOrder, rejectOrder, acceptedOrder} =
    useDriverOrders(isDriverActive);

  // Fungsi untuk navigasi ke OrderingDriver dengan useCallback
  const navigateToOrderScreen = useCallback(
    order => {
      navigation.navigate('OrderingDriver', {order});
    },
    [navigation],
  );
  const handleOrder = () => {
    navigateToOrderScreen(acceptedOrder);
  };

  const handleAccept = async () => {
    const accepted = await acceptOrder();

    if (accepted) {
      // Tidak perlu navigate di sini karena useEffect akan menangani
      console.log('Order accepted, waiting for navigation...');
    }
  };

  const handleReject = () => rejectOrder();

  // Fungsi untuk mendapatkan teks status order dengan useCallback
  const getOrderStatusText = useCallback(status => {
    const statusMap = {
      pending: 'Menunggu Konfirmasi',
      accepted: 'Pesanan Diterima',
      on_the_way: 'Dalam Perjalanan',
      picked_up: 'Penumpang Diambil',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    return statusMap[status] || status;
  }, []);

  return (
    <>
      <SafeAreaView style={styles.container}>
        {!isSearchActive && (
          <View style={styles.header}>
            <Text style={styles.greeting}>
              Halo, {profile?.username || 'Driver'} 👋
            </Text>
            <TouchableOpacity style={styles.notificationIcon}>
              <IconBell
                name="bell-ring-outline"
                size={28}
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>
        )}

        <View
          style={[
            styles.backgroundRounded,
            isSearchActive && styles.backgroundRoundedActive,
          ]}>
          <Image
            source={require('../assets/background-home.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </View>

        <View
          style={[styles.searchBox, isSearchActive && styles.searchBoxActive]}>
          <Text style={styles.searchTitle}>Mau ke sebelah mana hari ini?</Text>
          <View style={styles.searchInput}>
            <Icons
              name="search"
              size={18}
              color="#4E1F1A"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Cari lokasi mu"
              placeholderTextColor="#4E1F1A"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchActive(true)}
              onBlur={() => setIsSearchActive(false)}
            />
          </View>
        </View>

        {/* Banner untuk pesanan yang sudah diterima */}
        {acceptedOrder && (
          <TouchableOpacity
            style={styles.activeOrderBanner}
            onPress={handleOrder}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderStatus}>
                {acceptedOrder.status === 'pending'
                  ? 'Pesanan Tertunda'
                  : 'Pesanan Aktif'}
              </Text>
              <View style={styles.wrapper}>
                <IconMotorcycle name="motorcycle" size={40} color="#4E1F1A" />
                <Text style={styles.orderDetail}>
                  {getOrderStatusText(acceptedOrder.status)}
                </Text>
              </View>
            </View>
            <Icons name="chevron-forward" size={24} color="#FCEBD7" />
          </TouchableOpacity>
        )}

        {/* Card untuk pesanan baru */}
        {activeOrder && !acceptedOrder && (
          <>
            <View style={styles.statusBar}>
              <Text style={styles.textBar}>Pesanan baru untukmu</Text>
            </View>
            <View style={styles.orderCard}>
              <Text style={styles.orderTitle}>
                Ada pesanan baru nih yang masuk..
              </Text>
              <View style={styles.wrapper}>
                <IconUsers
                  name="users"
                  size={60}
                  color="#4E1F1A"
                  style={styles.usersIcon}
                />
                <View>
                  <Text style={styles.titleOrder}>Pesanan menuju alamat:</Text>
                  <Text style={styles.orderLocation}>
                    {activeOrder.pick_up_location}
                  </Text>
                </View>
              </View>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.rejectButton]}
                  onPress={handleReject}
                  disabled={loadingAccept}>
                  <Text style={styles.buttonTextTolak}>Tolak</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.acceptButton]}
                  onPress={handleAccept}
                  disabled={loadingAccept}>
                  <Text style={styles.buttonTextTerima}>
                    {loadingAccept ? 'Memproses...' : 'Terima'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </SafeAreaView>

      <BottomNav activeScreen="HomeDriver" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#4E1F1A'},
  header: {
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 10,
  },
  greeting: {fontSize: 28, fontWeight: 'semibold', color: '#FCEBD7'},
  notificationIcon: {
    width: 50,
    height: 50,
    borderRadius: 100,
    backgroundColor: '#FCEBD7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {tintColor: '#4E1F1A'},
  backgroundRounded: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 275,
    overflow: 'hidden',
  },
  backgroundRoundedActive: {height: 275, top: -140},
  backgroundImage: {width: '100%', height: '100%'},
  searchBox: {
    backgroundColor: '#FCEBD7',
    borderRadius: 20,
    padding: 15,
    marginTop: 100,
    marginHorizontal: 30,
    marginBottom: 20,
  },
  searchBoxActive: {marginTop: 50},
  searchTitle: {color: '#4E1F1A', fontSize: 16, marginBottom: 10},
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 18,
    opacity: 0.6,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 10,
  },
  searchIcon: {marginRight: 10, opacity: 0.5},
  textInput: {flex: 1, fontSize: 16, color: '#4E1F1A', padding: 0},
  // Banner untuk pesanan aktif
  activeOrderBanner: {
    backgroundColor: '#4E1F1A',
    marginHorizontal: 30,
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FCEBD7',
    marginBottom: 20,
  },
  orderInfo: {
    flex: 1,
  },
  orderStatus: {
    color: '#FCEBD7',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  orderDetail: {
    color: '#FCEBD7',
    fontSize: 14,
    marginLeft: 10,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingLeft: 48,
    marginBottom: 8,
  },
  textBar: {
    color: '#FFF',
    fontSize: 16,
  },
  toggleButton: {
    backgroundColor: '#BB8B6D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeButton: {backgroundColor: '#4CAF50'},
  toggleText: {color: '#FFF', fontSize: 14, fontWeight: '600'},
  orderCard: {
    backgroundColor: '#F3EDEA',
    marginHorizontal: 30,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 20,
    elevation: 4,
  },
  orderTitle: {
    fontSize: 16,
    color: '#501D1C',
    marginBottom: 12,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 16,
  },
  titleOrder: {fontSize: 16, color: '#501D1C', marginBottom: 6},
  orderLocation: {
    fontSize: 16,
    color: '#501D1C',
    textTransform: 'capitalize',
  },
  orderTime: {fontSize: 12, color: '#888', marginBottom: 16},
  buttonGroup: {flexDirection: 'row', gap: 12},
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 100,
    alignItems: 'center',
    elevation: 10,
  },
  acceptButton: {backgroundColor: '#501D1C'},
  rejectButton: {backgroundColor: '#FCEFE9', color: '#501D1C'},
  buttonTextTolak: {color: '#501D1C', fontWeight: '600', fontSize: 14},
  buttonTextTerima: {color: '#FCEFE9', fontWeight: '600', fontSize: 14},
  // Styles untuk no order
  noOrderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  noOrderText: {
    color: '#FCEBD7',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  noOrderSubtext: {
    color: '#FCEBD7',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.8,
  },
});
