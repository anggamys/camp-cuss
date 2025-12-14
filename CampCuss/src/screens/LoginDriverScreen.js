// src/screens/LoginDriverScreen.js
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../hooks/useAuth';
import {useNotification} from '../hooks/useNotification';
import FloatingInput from '../components/FloatingInput';
import FloatingUploadImage from '../components/FloatingUploadImage';
import {useNavigation} from '@react-navigation/native';
import {uploadDocument} from '../api/uploadApi';

export default function LoginDriverScreen() {
  const navigation = useNavigation();
  const {profile, logout} = useAuth();
  const {requestDriver, msg} = useNotification();

  const [documents, setDocuments] = useState({
    ktp: null,
    ktm: null,
    sim: null,
  });

  // ✅ State loading untuk setiap dokumen
  const [uploading, setUploading] = useState({
    ktp: false,
    ktm: false,
    sim: false,
  });

  const [loading, setLoading] = useState(false);

  console.log('Profile di LoginDriverScreen:', profile);

  const handleDocumentSelected = (docType, uri) => {
    setDocuments(prev => ({...prev, [docType]: uri}));
  };

  const handleLoginDriver = async () => {
    // ✅ Perbaiki validasi profil
    if (
      !profile.username ||
      !profile.email ||
      !profile.npm ||
      !profile.no_phone ||
      !profile.photo_profile
    ) {
      Alert.alert(
        'Data Profil Tidak Lengkap',
        'Silakan lengkapi data profil Anda.',
        [
          {
            text: 'Edit Profil',
            onPress: () => navigation.navigate('EditProfile'),
          },
        ],
      );
      return;
    }

    // ✅ Perbaiki validasi dokumen
    if (!documents.ktp || !documents.ktm || !documents.sim) {
      Alert.alert('Dokumen Belum Lengkap', 'Silakan unggah KTP, KTM, dan SIM.');
      return;
    }

    // if (profile.) {

    setLoading(true);
    try {
      const userId = profile.id;

      await requestDriver('Pengalaman dalam membawa orang');

      const uploadPromises = [];

      if (documents.ktp) {
        setUploading(prev => ({...prev, ktp: true}));
        uploadPromises.push(
          uploadDocument(userId, documents.ktp, 'photo-id-card'),
        );
      }
      if (documents.ktm) {
        setUploading(prev => ({...prev, ktm: true}));
        uploadPromises.push(
          uploadDocument(userId, documents.ktm, 'photo-student-card'),
        );
      }
      if (documents.sim) {
        setUploading(prev => ({...prev, sim: true}));
        uploadPromises.push(
          uploadDocument(userId, documents.sim, 'photo-driving-license'),
        );
      }

      await Promise.all(uploadPromises);

      Alert.alert(
        'Tertunda',
        `${msg}, Harap menunggu 10 menit kedepan tahap proses oleh admin.`,
        [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
            },
          },
        ],
      );
    } catch (err) {
      console.error('Registration error:', err);
      Alert.alert('Error', err.message || 'Gagal mengaktifkan akun driver');
    } finally {
      setLoading(false);
      setUploading({ktp: false, ktm: false, sim: false}); // Reset loading
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <Image
          source={require('../assets/logo-name.png')}
          style={styles.logoName}
          resizeMode="contain"
        />
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.innerContainer}>
            <FloatingInput
              label="Username"
              value={profile.username}
              editable={false}
            />

            <FloatingInput
              label="Email"
              value={profile.email}
              editable={false}
            />

            <FloatingInput
              label="Password"
              value={'********'}
              editable={false}
            />

            <FloatingInput label="NPM" value={profile.npm} editable={false} />

            <FloatingInput
              label="No HP"
              value={profile.no_phone}
              editable={false}
            />

            <FloatingUploadImage
              label="KTP"
              value={documents.ktp}
              onImageSelected={uri => handleDocumentSelected('ktp', uri)}
              uploading={uploading.ktp}
            />

            <FloatingUploadImage
              label="KTM"
              value={documents.ktm}
              onImageSelected={uri => handleDocumentSelected('ktm', uri)}
              uploading={uploading.ktm}
            />

            <FloatingUploadImage
              label="SIM"
              value={documents.sim}
              onImageSelected={uri => handleDocumentSelected('sim', uri)}
              uploading={uploading.sim}
            />
          </View>
        </ScrollView>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLoginDriver}
          disabled={loading}>
          <Text style={styles.btnText}>
            {loading ? 'Memuat...' : 'Daftar Sebagai Driver'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    marginTop: 80,
    width: 300,
    height: 100,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: '#F9F1E2',
    paddingVertical: 15,
    marginHorizontal: 35,
    marginBottom: 30,
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
});
