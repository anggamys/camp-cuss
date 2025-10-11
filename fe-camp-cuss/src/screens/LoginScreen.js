// src/screens/LoginScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import FloatingInput from '../components/FloatingInput'; // 👈 Import

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login, error, setError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  const handleLogin = async () => {
    if (!username || !password) {
      return setError('Username dan password wajib diisi!');
    }
    setLoading(true);
    try {
      await login(username, password);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => navigation.navigate('Register');

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={styles.innerContainer}>
          <Image
            source={require('../assets/logo-name.png')}
            style={styles.logoName}
            resizeMode="contain"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <FloatingInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <FloatingInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? 'Loading...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Belum punya akun?{'  '}</Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.link}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Hanya style yang relevan
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#501D1C' },
  container: { flex: 1 },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 35,
  },
  logoName: {
    width: 300,
    height: 120,
    alignSelf: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    textAlign: 'center',
    paddingVertical: 8,
    marginBottom: 20,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#F9F1E2',
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  btnText: { color: '#501D1C', fontSize: 16, fontWeight: '600' },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  registerText: { color: '#F9F1E2', fontSize: 14 },
  link: { color: '#A9F1F9', fontSize: 14, fontWeight: '600' },
});