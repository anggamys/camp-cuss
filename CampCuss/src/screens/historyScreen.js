// src/screens/HistoryScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import BottomNav from '../components/BottomNav';

const HistoryScreen = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('selesai'); // default: selesai

  // Data dummy untuk tiap tab
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

  const renderOrderItem = (item) => (
    <View key={item.id} style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <Image source={require('../assets/clock.png')} style={styles.iconClock} />
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      <View style={styles.orderDetails}>
        <Text style={styles.timeText}>{item.time}, {item.location}</Text>
        <Text style={styles.priceText}>{item.price}</Text>
      </View>
      <View style={styles.divider} />
    </View>
  );

  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Ini pesananmu, {user?.username || 'Markisa'} 👋
          </Text>
          <TouchableOpacity style={styles.notificationIcon}>
            <Image source={require('../assets/bell.png')} style={styles.icon} />
          </TouchableOpacity>
        </View>

        {/* Background Image */}
        <Image
          source={require('../assets/background-home.jpg')}
          style={styles.background}
          resizeMode="cover"
        />

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'selesai' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('selesai')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'selesai' && styles.activeTabText
            ]}>Selesai</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'proses' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('proses')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'proses' && styles.activeTabText
            ]}>Dalam Proses</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'batal' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('batal')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'batal' && styles.activeTabText
            ]}>Batal</Text>
          </TouchableOpacity>
        </View>

        {/* Order List - Scroll Vertikal */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {orders[activeTab].map(renderOrderItem)}
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
    backgroundColor: '#4E1F1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FCEBD7',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: '#4E1F1A',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    opacity: 0.8,
  },
  tabsContainer: {
    marginTop: 120,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  tabButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCEBD7',
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#FCEBD7',
  },
  tabText: {
    color: '#FCEBD7',
    fontSize: 14,
  },
  activeTabText: {
    color: '#4E1F1A',
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  orderItem: {
    backgroundColor: '#FCEBD7',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconClock: {
    width: 18,
    height: 18,
    marginRight: 10,
    tintColor: '#4E1F1A',
  },
  dateText: {
    fontSize: 14,
    color: '#4E1F1A',
    fontWeight: 'bold',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#4E1F1A',
  },
  priceText: {
    fontSize: 14,
    color: '#4E1F1A',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#D9D9D9',
    marginVertical: 10,
  },
});