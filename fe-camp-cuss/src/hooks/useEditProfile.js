import { useState } from "react";
import { Alert } from "react-native";
import { updateProfile } from "../api/profileApi";
import { useAuth } from "./useAuth";


export const useEditProfile = () => {
  const { profile, setProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const update = async (formData) => {
    if (!profile?.id) {
      Alert.alert('Error', 'Profil tidak ditemukan,');
      return false;
    }

    if (!formData.username?.trim() || !formData.email?.trim()){
      Alert.alert('Validasi', 'Username dan Email wajib diisi.')
      return false
    }

    setLoading(true);
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        npm: formData.npm || null,
        no_phone: formData.no_phone || null,
      };

      if (formData.password){
        payload.password = formData.password
      }

      const updatedProfile = await updateProfile(profile.id, payload);

      if (setProfile) {
        setProfile(updatedProfile)
      }

      Alert.alert('Berhasil', 'Profil berhasil diperbarui');
      return true;
    } catch (err) {
      const message = err.response?.data?.msg || err.message || 'Gagal memperbarui profil.  Coba lagi nanti.'
      Alert.alert('Gagal', message)
    } finally {
      setLoading(false)
    }
  }

  return {update, loading}
}