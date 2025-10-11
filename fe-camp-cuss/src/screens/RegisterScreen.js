// screens/RegisterScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import FloatingInput from '../components/FloatingInput';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [npm, setNpm] = useState('');
  const [noPhone, setNoPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password || !npm || !noPhone) {
      Alert.alert('Error', 'Semua field wajib diisi!');
      return;
    }

    setLoading(true);
    try {
      const response = await register(username, email, password, npm, noPhone);
      Alert.alert('Berhasil!', 'Akun berhasil dibuat.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      Alert.alert('Gagal', error.message || 'Terjadi kesalahan saat pendaftaran.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.innerContainer}>
            <Image
              source={require('../assets/logo-name.png')}
              style={styles.logoName}
              resizeMode="contain"
            />

            <FloatingInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <FloatingInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <FloatingInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <FloatingInput
              label="NPM"
              value={npm}
              onChangeText={setNpm}
              keyboardType="numeric"
            />

            <FloatingInput
              label="No HP"
              value={noPhone}
              onChangeText={setNoPhone}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.btnText}>
                {loading ? 'Mendaftar...' : 'Daftar'}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Sudah punya akun?{'  '}</Text>
              <TouchableOpacity onPress={handleLogin}>
                <Text style={styles.link}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Hapus semua style input lama, gunakan style dari komponen
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#501D1C',
  },
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 35,
    paddingBottom: 30,
  },
  logoName: {
    width: 300,
    height: 100,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: '#F9F1E2',
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: '#501D1C',
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginText: {
    color: '#F9F1E2',
    fontSize: 14,
  },
  link: {
    color: '#A9F1F9',
    fontSize: 14,
  },
});