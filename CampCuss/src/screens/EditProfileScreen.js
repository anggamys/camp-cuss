// src/screens/EditProfileScreen.js
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../hooks/useAuth';
import {useEditProfile} from '../hooks/useEditProfile';
import {useProfileImageUpload} from '../hooks/useProfileImageUpload';
import BottomNav from '../components/BottomNav';
import FloatingInput from '../components/FloatingInput';
import IconUser from 'react-native-vector-icons/FontAwesome6';
import {useNavigation} from '@react-navigation/native';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const {profile, loading: authLoading} = useAuth();
  const {update, loading: updating} = useEditProfile();
  const {pickAndUploadImage, loading: uploadingImage} = useProfileImageUpload();
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
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleSave = async () => {
    await update(formData);
    navigation.navigate('Profile', {animation: 'none'});
  };

  const handleUploadPhoto = async () => {
    await pickAndUploadImage();
  };

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
          {/* Preview Foto — Klik untuk upload */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleUploadPhoto}
            disabled={uploadingImage}>
            {profile?.photo_profile ? (
              <Image
                source={{uri: profile.photo_profile}}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <IconUser name="circle-user" style={styles.iconUser} size={170} />
            )}

            {uploadingImage && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.loadingText}>Mengunggah...</Text>
              </View>
            )}
          </TouchableOpacity>
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
            style={[styles.saveButton, updating && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={updating}>
            <Text style={styles.saveButtonText}>
              {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <BottomNav activeScreen="EditProfil"/>
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
  avatarContainer: {
    position: 'relative',
    width: 175,
    height: 175,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  iconUser: {
    color: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 100,
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
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#4E1F1A',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
