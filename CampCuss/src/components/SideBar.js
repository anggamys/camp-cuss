// src/components/Sidebar.js

import React, {useRef, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated} from 'react-native';
import {useAuth} from '../hooks/useAuth';
import {useSideBar} from '../hooks/useSideBar';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconDriver from 'react-native-vector-icons/FontAwesome';

const SIDEBAR_WIDTH = 150;

export default function Sidebar({
  visible,
  onClose,
  isActive,
  onToggleActive,
  isProfileScreen = false,
}) {
  const {user, logout} = useAuth();
  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const { goToEditProfile, goToLoginDriver } = useSideBar();

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible, slideAnim]);

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.sidebar, {transform: [{translateX: slideAnim}]}]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" size={32} color="#501D1C" />
        </TouchableOpacity>
      </View>

      <View>
        {user?.role === 'driver' && onToggleActive && (
          <TouchableOpacity style={styles.menuItem} onPress={onToggleActive}>
            <Icon
              name={isActive ? 'power' : 'power-off'}
              size={24}
              style={styles.icon}
            />
            <Text style={styles.menuLabel}>
              {isActive ? 'Nonaktifkan' : 'Aktifkan'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.menuItem} onPress={goToEditProfile}>
          <Icon name="edit-note" size={24} style={styles.icon} />
          <Text style={styles.menuLabel}>Edit Akun</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Icon name="logout" size={24} style={styles.icon} />
          <Text style={styles.menuLabel}>Log Out</Text>
        </TouchableOpacity>

        {/* Login sebagai Driver — hanya untuk customer */}
        {user?.role === 'customer' && (
          <TouchableOpacity style={styles.menuItem} onPress={goToLoginDriver}>
            <IconDriver
              name="drivers-license-o"
              size={20}
              style={styles.icon}
            />
            <Text style={styles.menuLabel}>Verifikasi{'\n'}Driver</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#D9D9D9',
    elevation: 5,
    zIndex: 1000,
    padding: 20,
    borderTopStartRadius: 40,
    borderBottomStartRadius: 40,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  icon: {
    marginRight: 10,
    color: '#4E1F1A',
  },
  menuLabel: {
    fontSize: 14,
    color: '#4E1F1A',
    fontWeight: '500',
  },
});
