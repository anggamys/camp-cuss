import {useState} from 'react';
import {Alert} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {uploadProfilePhoto} from '../api/profileApi';
import {useAuth} from './useAuth';

export const useProfileImageUpload = () => {
  const {profile, setProfile} = useAuth();
  const [loading, setLoading] = useState(false);

  const pickAndUploadImage = async () => {
    if (!profile?.id) {
      Alert.alert('Error', 'Profil tidak ditemukan.');
      return null;
    }

    setLoading(true);

    try {
      // Buka galeri
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 800,
        maxHeight: 800,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        setLoading(false);
        return null;
      }

      const selectedUri = result.assets[0].uri;

      // Upload ke server
      const uploadedData = await uploadProfilePhoto(profile.id, selectedUri);

      // Perbarui state global (jika tersedia)
      if (setProfile) {
        setProfile(prev => ({
          ...prev,
          photo_profile: uploadedData.photo_profile || prev.photo_profile,
        }));
      }

      Alert.alert('Berhasil', 'Foto profil berhasil diunggah!');
      setLoading(false);
      return uploadedData;
    } catch (error) {
      const message =
        error.response?.data?.msg ||
        error.message ||
        'Gagal mengunggah foto profil. Coba lagi nanti.';
      Alert.alert('Gagal', message);
      setLoading(false);
      return null;
    }
  };

  return {pickAndUploadImage, loading};
};
