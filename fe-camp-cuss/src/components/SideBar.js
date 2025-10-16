import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useSideBar } from '../hooks/useSideBar';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconDriver from 'react-native-vector-icons/FontAwesome';

export default function Sidebar({ visible, onClose }) {
  const { user, logout } = useAuth();
  const { goToEditProfile, goToLoginDriver } = useSideBar();
  const slideAnim = new Animated.Value(visible ? 0 : -300);

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -300,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Icon name="menu" style={styles.close} />
        </TouchableOpacity>
      </View>

      <View>
        <MenuItem label="Log Out" onPress={logout}>
          <Icon name="logout" size={24} style={styles.icon} />
        </MenuItem>
        <MenuItem label="Edit Akun" onPress={goToEditProfile}>
          <Icon name="edit-note" size={28} style={styles.icon} />
        </MenuItem>
        {user.role === 'customer' && (
          <MenuItem
            label="Login driver"
            onPress={goToLoginDriver}
          >
            <IconDriver name="drivers-license-o" size={20} style={styles.icon} />
          </MenuItem>
        )}
      </View>
    </Animated.View>
  );
}

const MenuItem = ({ label, onPress, children }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    {children}
    <Text style={styles.menuLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 150,
    backgroundColor: '#D9D9D9',
    elevation: 5,
    zIndex: 1000,
    padding: 20,
    borderTopStartRadius: 40,
    borderBottomStartRadius: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4E1F1A',
  },
  close: {
    fontSize: 40,
    color: '#501D1C',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 8,
    color: '#4E1F1A',
  },
  menuLabel: {
    fontSize: 12,
    color: '#4E1F1A',
  },
});
