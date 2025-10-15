// src/screens/ProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import BottomNav from '../components/BottomNav';
import Sidebar from '../components/SideBar';
import FloatingInput from '../components/FloatingInput';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconUser from 'react-native-vector-icons/FontAwesome6';

export default function ProfileScreen() {
  const { user, profile, loading } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Memuat profil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {profile?.photo_profile === null ? (
            <Image source={profile?.avatar} style={styles.avatar} />
          ) : (
            <IconUser name="circle-user" size={160} style={{ color: "#fff" }} />
          )}
          <TouchableOpacity
            onPress={() => setSidebarVisible(true)}
            style={styles.menuButton}
          >
            <Icon name="menu-open" style={styles.menuIcon} />
          </TouchableOpacity>
        </View>

        <ScrollView>
          <View style={styles.profileSection}>
            <FloatingInput
              label="Username"
              value={profile?.username || '—'}
              editable={false}
              selectTextOnFocus={false}
            />
            <FloatingInput
              label="Email"
              value={profile?.email || '—'}
              editable={false}
              selectTextOnFocus={false}
            />
            <FloatingInput
              label="NPM"
              value={profile?.npm || '—'}
              editable={false}
              selectTextOnFocus={false}
            />
            <FloatingInput
              label="Nomor HP"
              value={profile?.no_phone || '—'}
              editable={false}
              selectTextOnFocus={false}
            />
            <FloatingInput
              label="Password"
              value={profile?.password || '********'}
              editable={false}
              selectTextOnFocus={false}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        user={user}
      />

      {sidebarVisible === false && <BottomNav activeScreen="Profile" />}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87624C',
    padding: 20,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#FF0000',
  },
  menuButton: {
    position: 'absolute', // tombol tetap relatif terhadap header
    right: 0, // berada di pojok kanan header
    top: -26,
    padding: 10,
    borderRadius: 8,
  },
  menuIcon: {
    fontSize: 44,
    color: '#FFF',
  },
  profileSection: {
    padding: 15,
    gap: 6,
  },
});
