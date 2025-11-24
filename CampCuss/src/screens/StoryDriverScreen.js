// src/screens/HistoryScreen.js
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../hooks/useAuth';
import BottomNav from '../components/BottomNav';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const HistoryScreen = () => {
  const {user} = useAuth();
  const [activeTab, setActiveTab] = useState('selesai');

  const orders = {
    selesai: [
      {
        id: 1,
        date: 'Selasa, 11 Maret 2025',
        time: '12:30-12:40',
        location: 'Fakultas Ilmu Komputer',
        price: 'Rp. 7.000',
      },
      {
        id: 2,
        date: 'Rabu, 05 Maret 2025',
        time: '12:30-12:40',
        location: 'Gedung Kuliah Bersama',
        price: 'Rp. 7.000',
      },
      {
        id: 3,
        date: 'Rabu, 05 Maret 2025',
        time: '07:00-07:15',
        location: 'Jl. Medokan Auri 3A',
        price: 'Rp. 7.000',
      },
      {
        id: 4,
        date: 'Selasa, 04 Maret 2025',
        time: '15:30-15:40',
        location: 'Fakultas Ilmu Komputer',
        price: 'Rp. 7.000',
      },
      {
        id: 5,
        date: 'Senin, 03 Maret 2025',
        time: '12:30-12:40',
        location: 'Jl. Rungkut Baratajaya 5',
        price: 'Rp. 7.000',
      },
      {
        id: 6,
        date: 'Senin, 03 Maret 2025',
        time: '09:20-09:30',
        location: 'Fakultas Ilmu Komputer',
        price: 'Rp. 7.000',
      },
      {
        id: 7,
        date: 'Jumat, 28 Februari 2025',
        time: '08:00-08:10',
        location: 'Gedung Rektorat',
        price: 'Rp. 7.000',
      },
    ],
    proses: [
      {
        id: 1,
        date: 'Kamis, 11 Maret 2025',
        time: '12:30-12:40',
        location: 'Fakultas Ilmu Komputer',
        price: 'Rp. 7.000',
      },
      {
        id: 2,
        date: 'Rabu, 05 Maret 2025',
        time: '12:30-12:40',
        location: 'Gedung Kuliah Bersama',
        price: 'Rp. 7.000',
      },
      {
        id: 3,
        date: 'Rabu, 05 Maret 2025',
        time: '07:00-07:15',
        location: 'Jl. Medokan Auri 3A',
        price: 'Rp. 7.000',
      },
      {
        id: 4,
        date: 'Selasa, 04 Maret 2025',
        time: '15:30-15:40',
        location: 'Fakultas Ilmu Komputer',
        price: 'Rp. 7.000',
      },
    ],
    batal: [
      {
        id: 1,
        date: 'Rabu, 12 Maret 2025',
        time: '12:30-12:40',
        location: 'Fakultas Ilmu Komputer',
        price: 'Rp. 7.000',
      },
      {
        id: 2,
        date: 'Rabu, 05 Maret 2025',
        time: '12:30-12:40',
        location: 'Gedung Kuliah Bersama',
        price: 'Rp. 7.000',
      },
      {
        id: 3,
        date: 'Rabu, 05 Maret 2025',
        time: '07:00-07:15',
        location: 'Jl. Medokan Auri 3A',
        price: 'Rp. 7.000',
      },
      {
        id: 4,
        date: 'Selasa, 04 Maret 2025',
        time: '15:30-15:40',
        location: 'Fakultas Ilmu Komputer',
        price: 'Rp. 7.000',
      },
    ],
  };

  const renderOrderItem = item => (
    <View key={item.id} style={styles.orderCard}>
      <Icon name="clock-outline" size={50} color="#501D1C" />
      <View style={styles.orderHeader}>
        <Text style={styles.dateText}>{item.date}</Text>
        <View style={styles.timeLocation}>
          <Text style={styles.timeText}>{item.time},</Text>
          <Text style={styles.locationText}> {item.location}</Text>
        </View>
      </View>
      <Text style={styles.priceText}>{item.price}</Text>
    </View>
  );

  return (
    <>
      <View style={styles.headerContainer}>
        <Text style={styles.greeting}>
          Ini pesananmu, {user?.username || 'Markisa'} 👋
        </Text>

        <View style={styles.tabsContainer}>
          {['selesai', 'proses', 'batal'].map(tab => {
            const label =
              tab === 'selesai'
                ? 'Selesai'
                : tab === 'proses'
                ? 'Dalam Proses'
                : 'Batal';
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  activeTab === tab && styles.activeTab,
                ]}
                onPress={() => setActiveTab(tab)}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <SafeAreaView style={styles.container}>
        {/* Order List */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {orders[activeTab]?.length > 0 ? (
            orders[activeTab].map(renderOrderItem)
          ) : (
            <Text style={styles.emptyText}>Tidak ada riwayat.</Text>
          )}
        </ScrollView>
      </SafeAreaView>

      <BottomNav activeScreen="History" />
    </>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3EDEA',
  },
  headerContainer: {
    backgroundColor: '#87624C',
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F3EDEA',
    marginBottom: 30,
    paddingLeft: 20,
    textAlign: 'start',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  tabButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3EDEA',
    backgroundColor: '#F3EDEA',
  },
  activeTab: {
    backgroundColor: '#F3EDEA',
  },
  tabText: {
    color: '#501D1C',
    fontSize: 14,
  },
  activeTabText: {
    color: '#501D1C',
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderBottomWidth: 1.5,
    borderColor: '#D6A586',
    marginHorizontal: 20,
    marginBottom: 15,
    paddingBottom: 10,
  },
  orderHeader: {
    flexDirection: 'col',
    marginHorizontal: 10,
    textAlign: 'start',
  },
  dateText: {
    fontSize: 16,
    color: '#501D1C',
  },
  timeLocation: {
    flexDirection: 'row',
  },
  timeText: {
    fontSize: 11,
    color: '#501D1C',
  },
  locationText: {
    fontSize: 11,
    color: '#501D1C',
  },
  priceText: {
    fontSize: 16,
    color: '#D6A586',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#501D1C',
    marginTop: 30,
    fontSize: 16,
  },
});
