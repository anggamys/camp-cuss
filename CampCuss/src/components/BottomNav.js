import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {useBottomNav} from '../hooks/useBottomNav';
import {useRoute} from '@react-navigation/native'; // ✅ Tambahkan ini
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconUser from 'react-native-vector-icons/MaterialIcons';

const BottomNav = () => {
  const route = useRoute();
  const {goToHome, goToHistory, goToProfile} = useBottomNav();

  const screenName = route.name;

  const isHomeActive = ['HomeUser', 'HomeAdmin', 'HomeDriver'].includes(
    screenName,
  );
  const isHistoryActive = screenName === 'History';
  const isProfileActive = screenName === 'Profile' || screenName === 'EditProfile';

  return (
    <View style={styles.bottomNavContainer}>
      <View style={styles.bottomNav} />

      <View
        style={[
          styles.floatingButton,
          styles.homeButton,
          isHomeActive && styles.homeButtonActive,
        ]}>
        <TouchableOpacity onPress={goToHome} style={styles.navItem}>
          <Icon
            name="home"
            size={40}
            style={[styles.navIcon, isHomeActive && styles.navIconActive]}
          />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.floatingButton,
          styles.historyButton,
          isHistoryActive && styles.historyButtonActive,
        ]}>
        <TouchableOpacity onPress={goToHistory} style={styles.navItem}>
          <Icon
            name="work-history"
            size={36}
            style={[styles.navIcon, isHistoryActive && styles.navIconActive]}
          />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.floatingButton,
          styles.profileButton,
          isProfileActive && styles.profileButtonActive,
        ]}>
        <TouchableOpacity onPress={goToProfile} style={styles.navItem}>
          <IconUser
            name="person"
            size={40}
            style={[styles.navIcon, isProfileActive && styles.navIconActive]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: '#4E1F1A',
    position: 'relative',
    paddingTop: 10, // ✅ Tambah padding atas
    paddingBottom: 30, // ✅ Tambah padding bawah
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    backgroundColor: '#F9F1E2',
    borderTopStartRadius: 30,
    borderTopEndRadius: 30,
    borderTopWidth: 1,
    borderTopColor: '#D9D9D9',
  },
  floatingButton: {
    width: 70,
    height: 70,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
    position: 'absolute', // ✅ Pastikan posisi absolute
    bottom: 35, // ✅ Sesuaikan posisi dari bawah
  },
  // Atur posisi horizontal untuk setiap tombol
  homeButton: {
    backgroundColor: '#D6A586',
    left: 40,
  },
  homeButtonActive: {
    backgroundColor: '#87624C',
  },
  historyButton: {
    backgroundColor: '#D6A586',
    left: '50%',
    marginLeft: -35,
  },
  historyButtonActive: {
    backgroundColor: '#87624C',
  },
  profileButton: {
    backgroundColor: '#D6A586',
    right: 40,
    left: 'auto',
  },
  profileButtonActive: {
    backgroundColor: '#87624C',
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    color: '#4E1F1A',
  },
  navIconActive: {
    color: '#501D1C',
  },
});

export default BottomNav;
