import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../hooks/useAuth';
import BottomNav from '../components/BottomNav';
import Icons from 'react-native-vector-icons/Ionicons';
import IconBell from 'react-native-vector-icons/MaterialCommunityIcons';
import IconMotorcycle from 'react-native-vector-icons/Fontisto';
import {useSearchDestinations} from '../hooks/useSearchDestinations';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {useUserLocation} from '../hooks/useUserLocation';
import {useUserOrders} from '../hooks/useUserOrders';

const HomeUser = () => {
  const {profile} = useAuth();
  const navigation = useNavigation();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {location: userLocation} = useUserLocation({
    fallbackLocation: {latitude: -7.332297, longitude: 112.788264},
  });

  // Ambil data dari hook
  const {pendingOrder, acceptedOrder, completedOrders} = useUserOrders();

  const activeOrder = pendingOrder || acceptedOrder;
  const hasActiveOrder = !!activeOrder;

  // console.log(activeOrder);
  const navigateToOrderScreen = useCallback(
    order => {
      if (order.status === 'pending') {
        navigation.navigate('SearchingDriver', {order});
      } else if (order.status === 'accepted') {
        navigation.navigate('OrderingScreen', {order});
      } else if (['paid', 'completed'].includes(order.status)) {
        navigation.navigate('OrderDetail', {order});
      }
    },
    [navigation],
  );

  const handleDestinationPress = useCallback(
    item => {
      if (hasActiveOrder) {
        Alert.alert(
          'Pesanan Sebelumnya',
          `Anda memiliki pesanan dengan status "${getOrderStatusText(
            activeOrder.status,
          )}". Silakan selesaikan pesanan terlebih dahulu.`,
          [
            {
              text: 'Lihat Pesanan',
              onPress: () => navigateToOrderScreen(activeOrder),
            },
            {text: 'OK', style: 'cancel'},
          ],
        );
      } else {
        navigation.navigate('Address', {destination: item});
      }
    },
    [hasActiveOrder, activeOrder, navigateToOrderScreen, navigation],
  );

  const shouldSearch =
    userLocation?.latitude != null && userLocation?.longitude != null;
  const {
    destinations,
    loading: searchLoading,
    error,
    search,
  } = useSearchDestinations(
    shouldSearch ? userLocation.latitude : null,
    shouldSearch ? userLocation.longitude : null,
    3,
  );

  useEffect(() => {
    const handler = setTimeout(() => search(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery, search]);

  // Data riwayat statis (fallback jika belum ada order completed)
  const staticHistory = [
    {id: 1, name: 'Danau UPI', image: require('../assets/danau.png')},
    {
      id: 2,
      name: 'Fakultas Komputer',
      image: require('../assets/fakultas.jpg'),
    },
    {id: 3, name: 'Rektorat', image: require('../assets/rektorat.jpg')},
  ];

  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        {!isSearchActive && (
          <View style={styles.header}>
            <Text style={styles.greeting}>
              Hello, {profile?.username || 'Customer'} 👋
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

        {/* Background */}
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

        {/* Search Box */}
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

        <ScrollView
          contentContainerStyle={styles.mainContent}
          showsVerticalScrollIndicator={false}>
          {/* ——— BANNER ORDER AKTIF ——— */}
          {activeOrder ? (
            <TouchableOpacity
              style={styles.activeOrderBanner}
              onPress={() => navigateToOrderScreen(activeOrder)}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderStatus}>
                  {activeOrder.status === 'pending'
                    ? 'Pesanan Tertunda'
                    : 'Pesanan Sebelumnya'}
                </Text>
                <View style={styles.wrapper}>
                  <IconMotorcycle name="motorcycle" size={40} color="#4E1F1A" />
                  <Text style={styles.orderDetail}>
                    {getOrderStatusText(activeOrder.status)}
                  </Text>
                </View>
              </View>
              <Icons name="chevron-forward" size={24} color="#FCEBD7" />
            </TouchableOpacity>
          ) : null}

          {/* ——— RIWAYAT ——— */}
          {!isSearchActive && (
            <View>
              {completedOrders.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>Riwayat Pesanan</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.historyContainer}>
                    {completedOrders.map(order => (
                      <TouchableOpacity
                        key={order.id}
                        style={styles.cardWrapper}
                        onPress={() => navigateToOrderScreen(order)}>
                        <View style={styles.historyCard}>
                          <Image
                            source={{
                              uri:
                                order.destination?.image_place ||
                                'https://via.placeholder.com/175x165/4E1F1A/FCEBD7?text=No+Image',
                            }}
                            style={styles.historyImage}
                          />
                          <LinearGradient
                            colors={['transparent', '#FCEBD7']}
                            style={styles.gradientOverlayHistory}
                          />
                          <Text style={styles.historyName}>
                            {order.destination?.name || 'Tujuan'}
                          </Text>
                          <Text style={styles.historyDate}>
                            {new Date(order.created_at).toLocaleDateString(
                              'id-ID',
                            )}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>
                    Riwayat tujuan di UPN Veteran Jatim
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.historyContainer}>
                    {staticHistory.map(item => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.cardWrapper}
                        onPress={() => handleDestinationPress(item)}
                        disabled={hasActiveOrder}>
                        <View
                          style={[
                            styles.historyCard,
                            hasActiveOrder && styles.disabledCard,
                          ]}>
                          <Image
                            source={item.image}
                            style={styles.historyImage}
                          />
                          <LinearGradient
                            colors={['transparent', '#FCEBD7']}
                            style={styles.gradientOverlayHistory}
                          />
                          <Text style={styles.historyName}>{item.name}</Text>
                          {hasActiveOrder && (
                            <View style={styles.overlayDisabled}>
                              <Icons
                                name="lock-closed"
                                size={24}
                                color="#FCEBD7"
                              />
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
            </View>
          )}

          {/* ——— REKOMENDASI ——— */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isSearchActive
                ? 'Hasil Pencarian'
                : 'Ini nih tujuan yang bisa kamu tuju'}
            </Text>

            {searchLoading ? (
              <Text style={styles.loadingText}>Memuat destinasi...</Text>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : destinations.length === 0 ? (
              <Text style={styles.emptyText}>
                {searchQuery.trim() === ''
                  ? 'Tidak ada destinasi dalam radius 3 km.'
                  : `Tidak ada destinasi yang cocok dengan "${searchQuery}".`}
              </Text>
            ) : (
              destinations.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.recommendCard,
                    hasActiveOrder && styles.disabledCard,
                  ]}
                  onPress={() => handleDestinationPress(item)}
                  disabled={hasActiveOrder}>
                  <View style={styles.imageContainer}>
                    <Image
                      source={{uri: item.image_place}}
                      style={styles.recommendImage}
                    />
                    <LinearGradient
                      colors={['transparent', '#FCEBD7']}
                      style={styles.gradientOverlay}
                    />
                    <View style={styles.recommendText}>
                      <Text style={styles.recommendName}>{item.name}</Text>
                    </View>
                    {hasActiveOrder && (
                      <View style={styles.overlayDisabled}>
                        <Icons name="lock-closed" size={32} color="#FCEBD7" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomNav activeScreen="HomeUser" />
    </>
  );
};

const getOrderStatusText = status => {
  const statusMap = {
    pending: 'Sedang mencari driver...',
    accepted: 'Driver akan segera sampai dalam 5 menit',
    paid: 'Pembayaran berhasil',
    cancelled: 'Pesanan dibatalkan',
  };
  return statusMap[status] || status;
};

export default HomeUser;

// Style tetap sama seperti Anda punya
const styles = StyleSheet.create({
  historyDate: {
    position: 'absolute',
    bottom: 28,
    right: 10,
    fontSize: 12,
    color: '#4E1F1A',
    fontWeight: '500',
  },
  container: {flex: 1, backgroundColor: '#4E1F1A'},
  header: {
    zIndex: 10,
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 15,
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
  mainContent: {paddingHorizontal: 30, paddingTop: 10},
  section: {paddingBottom: 40},
  sectionTitle: {
    color: '#FCEBD7',
    fontSize: 16,
    fontWeight: 'semibold',
    marginBottom: 15,
  },
  activeOrderBanner: {
    backgroundColor: '#FCEBD7',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderInfo: {flex: 1},
  orderStatus: {color: '#4E1F1A', marginBottom: 12, fontSize: 18},
  wrapper: {flexDirection: 'row', alignItems: 'center', gap: 20},
  orderDetail: {color: '#4E1F1A', fontSize: 16, flex: 1},
  historyContainer: {paddingBottom: 20},
  cardWrapper: {
    borderRadius: 15,
    elevation: 8,
    shadowColor: '#fff',
    shadowOpacity: 1,
    shadowRadius: 6,
    marginRight: 30,
  },
  historyCard: {
    width: 175,
    height: 220,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#FCEBD7',
  },
  disabledCard: {opacity: 0.9},
  historyImage: {width: '100%', height: '75%', position: 'absolute'},
  gradientOverlayHistory: {
    position: 'absolute',
    bottom: 55,
    left: 0,
    right: 0,
    height: '30%',
  },
  historyName: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    fontSize: 18,
    fontWeight: 'semibold',
    color: '#4E1F1A',
  },
  recommendCard: {
    backgroundColor: '#FCEBD7',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 30,
    width: '100%',
    height: 210,
    elevation: 6,
  },
  imageContainer: {flex: 1, position: 'relative'},
  recommendImage: {
    width: '100%',
    height: '80%',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    height: '30%',
  },
  recommendText: {
    position: 'absolute',
    bottom: 10,
    left: 15,
    right: 15,
  },
  recommendName: {
    fontSize: 18,
    fontWeight: 'semibold',
    color: '#4E1F1A',
  },
  overlayDisabled: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: 'rgba(78, 31, 26, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  lockText: {color: '#FCEBD7', fontSize: 14, fontWeight: '600', marginTop: 8},
  loadingText: {textAlign: 'center', color: '#FCEBD7', marginTop: 20},
  errorText: {textAlign: 'center', color: 'red', marginTop: 20},
  emptyText: {textAlign: 'center', color: '#FCEBD7', marginTop: 20},
});
