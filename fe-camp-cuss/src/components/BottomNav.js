// src/components/BottomNav.js
import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useBottomNav } from '../hooks/useBottomNav';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconUser from 'react-native-vector-icons/FontAwesome6';

const BottomNav = ({ activeScreen = 'Home' }) => {
  const { goToHome, goToHistory, goToProfile } = useBottomNav();

  const isActive = screen => activeScreen === screen;

  return (
    <View style={styles.bottomNavContainer}>
      {/* Background bar dengan rounded top */}
      <View style={styles.bottomNav} />

      {/* Home - floating di atas bar */}
      <View
        style={[
          styles.floatingButton,
          styles.homeButton,
          isActive('Home') && styles.homeButtonActive,
        ]}
      >
        <TouchableOpacity onPress={goToHome} style={styles.navItem}>
          <Icon
            name="home"
            size={40}
            style={[styles.navIcon, isActive('Home') && styles.navIconActive]}
          />
        </TouchableOpacity>
      </View>

      {/* history - floating di atas bar */}
      <View
        style={[
          styles.floatingButton,
          styles.historyButton,
          isActive('History') && styles.historyButtonActive,
        ]}
      >
        <TouchableOpacity onPress={goToHistory} style={styles.navItem}>
          <Icon
            name="work-history"
            size={36}
            style={[styles.navIcon, isActive('History') && styles.navIconActive]}
          />
        </TouchableOpacity>
      </View>

      {/* Profile - floating di atas bar */}
      <View
        style={[
          styles.floatingButton,
          styles.profileButton,
          isActive('Profile') && styles.profileButtonActive,
        ]}
      >
        <TouchableOpacity onPress={goToProfile} style={styles.navItem}>
          <IconUser
            name="user-large"
            size={30}
            style={[
              styles.navIcon,
              isActive('Profile') && styles.navIconActive,
            ]}
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
    backgroundColor: '#4E1F1A', // Warna latar belakang aplikasi
    position: 'relative',
    height: 20,
    paddingBottom: 10,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: '#F9F1E2',
    borderTopStartRadius: 30,
    borderTopEndRadius: 30,
    borderTopWidth: 1,
    borderTopColor: '#D9D9D9',
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
    bottom: 15,
  },
  homeButton: {
    backgroundColor: '#D6A586', // Warna coklat tua saat aktif
  },
  homeButtonActive: {
    backgroundColor: '#87624C',
  },
  historyButton: {
    backgroundColor: '#D6A586', // Warna krem
  },
  historyButtonActive: {
    backgroundColor: '#87624C', // Warna krem
  },
  profileButton: {
    backgroundColor: '#D6A586', // Warna krem
  },
  profileButtonActive: {
    backgroundColor: '#87624C', // Warna krem
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    tintColor: '#4E1F1A', // Warna default
  },
  navIconActive: {
    tintColor: '#501D1C', // Warna putih/krem saat aktif
  },
});

export default BottomNav;
