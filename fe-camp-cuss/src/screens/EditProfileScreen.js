// src/screens/EditProfileScreen.js
import React, { useEffect, useState } from 'react';
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
import { useEditProfile } from '../hooks/useEditProfile';
import BottomNav from '../components/BottomNav';
import FloatingInput from '../components/FloatingInput';
import IconUser from 'react-native-vector-icons/FontAwesome6';
import { useNavigation } from '@react-navigation/native';

export default function EditProfileScreen() {
   const navigation = useNavigation();
  const { profile, loading: authLoading } = useAuth();
  const { update, loading: updating } = useEditProfile();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    npm: '',
    no_phone: '',
    password: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        email: profile.email || '',
        npm: profile.npm || '',
        no_phone: profile.no_phone || '',
        password: '',
      });
    }
  }, [profile]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    await update(formData);
    navigation.navigate('Profile', { animation: 'none' });
  };

  // Tampilkan loading saat memuat profil awal
  if (authLoading) {
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
          {profile?.photo_profile ? (
            <Image
              source={{ uri: profile.photo_profile }}
              style={styles.avatar}
            />
          ) : (
            <IconUser name="circle-user" size={160} style={{ color: '#fff' }} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileSection}>
            <FloatingInput
              label="Username"
              value={formData.username}
              onChangeText={text => handleChange('username', text)}
            />
            <FloatingInput
              label="Email"
              value={formData.email}
              onChangeText={text => handleChange('email', text)}
            />
            <FloatingInput
              label="NPM"
              value={formData.npm}
              onChangeText={text => handleChange('npm', text)}
            />
            <FloatingInput
              label="Nomor HP"
              value={formData.no_phone}
              onChangeText={text => handleChange('no_phone', text)}
            />
            <FloatingInput
              label="Password Baru"
              value={formData.password}
              onChangeText={text => handleChange('password', text)}
              secureTextEntry={true}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              updating && styles.saveButtonDisabled, // ✅ hanya tambahkan style disabled saat updating
            ]}
            onPress={handleSave}
            disabled={updating} // ✅ disabled saat sedang mengupdate
          >
            <Text style={styles.saveButtonText}>
              {updating ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <BottomNav activeScreen="Profile" />
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
  scrollContent: {
    paddingBottom: 50,
  },
  profileSection: {
    padding: 15,
    gap: 6,
  },
  saveButton: {
    backgroundColor: '#F9F1E2',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 100,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#4E1F1A',
    fontSize: 16,
  },
});