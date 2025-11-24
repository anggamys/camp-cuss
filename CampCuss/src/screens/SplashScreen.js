// src/screens/SplashScreen.js

import React, {useEffect, useRef} from 'react';
import {
  View,
  Image,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Text,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const SplashScreen = () => {
  const navigation = useNavigation();
  const timeoutRef = useRef(null);

  useEffect(() => {
    const initializeApp = async () => {
      // ✅ Minta izin lokasi (hanya di Android)
      if (Platform.OS === 'android') {
        try {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Izin Lokasi',
              message:
                'Aplikasi membutuhkan akses lokasi untuk menampilkan destinasi terdekat.',
              buttonNeutral: 'Nanti',
              buttonNegative: 'Tolak',
              buttonPositive: 'Izinkan',
            },
          );
        } catch (err) {
          console.warn('Gagal meminta izin lokasi:', err);
        }
      }

      // ✅ Arahkan ke Login setelah 2 detik
      timeoutRef.current = setTimeout(() => {
        navigation.replace('Login');
      }, 2000);
    };

    initializeApp();

    // ✅ Cleanup: batalkan timeout jika komponen unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [navigation]); // ✅ aman, karena `navigation` stabil

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../assets/Logo/LPPM.png')}
            style={styles.logoLPPM}
            resizeMode="contain"
          />
          <Image
            source={require('../assets/Logo/UPN.png')}
            style={styles.logoUPN}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.versionText}>Versi 1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#501D1C',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoContainer: {
    shadowColor: '#F9F1E2',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 25,
    padding: 1,
    borderRadius: 100,
  },
  logo: {
    width: 200,
    height: 200,
    tintColor: '#F9F1EF',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  logoWrapper: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  logoUPN: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#F9F1EF',
    borderRadius: 100,
  },
  logoLPPM: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#F9F1EF',
    borderRadius: 100,
  },
  versionText: {
    color: '#F9F1EF',
    fontSize: 14,
  },
});

export default SplashScreen;
