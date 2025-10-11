import React from 'react';
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

const HomeUser = () => {
  const { user, logout } = useAuth(); // Ambil nama user dari context

  // Data dummy untuk rekomendasi tujuan
  const destinations = [
    {
      id: 1,
      name: "Danau UPI Jatinangor",
      image: require('../assets/danau.png'),
      description: "Tempat favorit mahasiswa untuk refreshing"
    },
    {
      id: 2,  
      name: "Fakultas Komputer",
      image: require('../assets/fakultas.jpg'),
      description: "Kampus modern dengan fasilitas lengkap"
    },
    {
      id: 3,
      name: "Gedung Rektorat",
      image: require('../assets/rektorat.jpg'),
      description: "Pusat administrasi kampus"
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.username || 'User'} 👋</Text>
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

      {/* Search Box */}
      <View style={styles.searchBox}>
        <Text style={styles.searchTitle}>Mau ke sebelah mana hari ini?</Text>
        <View style={styles.searchInput}>
          <Image source={require('../assets/search.png')} style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Cari lokasi mu</Text>
        </View>
      </View>

      {/* Recommendations */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Rekomendasi Tujuan di UPI Jatinangor</Text>

        <View style={styles.grid}>
          {destinations.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card}>
              <Image source={item.image} style={styles.cardImage} />
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Ini nih tujuan yang bisa kamu tuju</Text>
        <Image
          source={require('../assets/banner.jpg')}
          style={styles.banner}
          resizeMode="cover"
        />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Image source={require('../assets/home-active.png')} style={styles.navIcon} />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Image source={require('../assets/search.png')} style={styles.navIcon} />
          <Text style={styles.navText}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={logout}>
          <Image source={require('../assets/profile.png')} style={styles.navIcon} />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HomeUser;

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
  searchBox: {
    marginTop: 120,
    paddingHorizontal: 20,
  },
  searchTitle: {
    color: '#FCEBD7',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCEBD7',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  searchIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
    tintColor: '#4E1F1A',
  },
  searchPlaceholder: {
    color: '#4E1F1A',
    fontSize: 16,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    color: '#FCEBD7',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#FCEBD7',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
  },
  cardImage: {
    width: '100%',
    height: 100,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4E1F1A',
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  cardDesc: {
    fontSize: 12,
    color: '#4E1F1A',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  banner: {
    width: '100%',
    height: 150,
    borderRadius: 15,
    marginVertical: 15,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FCEBD7',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#D9D9D9',
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
    tintColor: '#4E1F1A',
  },
  navText: {
    fontSize: 12,
    color: '#4E1F1A',
    marginTop: 4,
  },
  navTextActive: {
    fontWeight: 'bold',
  },
});