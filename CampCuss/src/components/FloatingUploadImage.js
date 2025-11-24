import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Animated,
  Easing,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import Icons from 'react-native-vector-icons/AntDesign';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';

const FloatingUploadImage = ({
  label = 'KTP',
  value,
  onImageSelected,
  uploading = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: value || isFocused ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [animValue, value, isFocused]);

  const handlePress = () => {
    if (uploading) {
      return;
    }
    setIsFocused(true);
    showImageSourceAlert();
  };

  const showImageSourceAlert = () => {
    Alert.alert(
      `Uploud ${label}`,
      'Pilih sumber gambar:',
      [
        {
          text: 'Galeri',
          onPress: () => selectImage('library'),
        },
        {
          text: 'Kamera',
          onPress: () => selectImage('camera'),
        },
        {
          text: 'Batal',
          style: 'cancel',
          onPress: resetToInitialState,
        },
      ],
      {cancelable: true},
    );
  };

  const resetToInitialState = () => {
    setIsFocused(false);
  };

  const selectImage = type => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    const picker = type === 'camera' ? launchCamera : launchImageLibrary;

    picker(options, response => {
      if (response.didCancel) {
        resetToInitialState();
      } else if (response.errorCode) {
        console.error('ImagePicker Error:', response.errorMessage);
        Alert.alert('Error', 'Gagal memilih gambar');
        resetToInitialState();
      } else if (response.assets?.[0]?.uri) {
        const uri = response.assets[0].uri;
        onImageSelected?.(uri);
        // Biarkan isFocused tetap true agar ikon tetap muncul
      }
    });
  };

  const animatedLabelStyle = {
    top: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [24, 16],
    }),
    fontSize: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 16],
    }),
    color: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#D9D9D9', '#F9F1E2'],
    }),
  };

  const animatedAreaStyle = {
    backgroundColor: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['transparent', 'rgba(217, 217, 217, 0.1)'],
    }),
  };

  return (
    <View style={styles.inputWrapper}>
      {/* Label */}
      <Animated.Text style={[styles.label, animatedLabelStyle]}>
        {label}
      </Animated.Text>

      {/* Area Klik */}
      <Animated.View style={[styles.uploadArea, animatedAreaStyle]}>
        <TouchableOpacity
          style={styles.touchableArea}
          onPress={handlePress}
          disabled={uploading}>
          {/* Ikon + hanya muncul saat fokus ATAU sudah ada gambar */}
          {(isFocused || value) && (
            <Icons name="plus" style={styles.icon} size={20} />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Loading */}
      {uploading && (
        <View style={styles.loadingOverlay}>
          <Icons name="loading1" size={24} color="#FFF" />
          <Text style={styles.loadingText}>Mengunggah...</Text>
        </View>
      )}

      {/* Preview Gambar - HANYA jika ada value */}
      <View style={styles.previewContainer}>
        <Image
          source={{uri: value}}
          style={styles.previewImage}
          resizeMode="cover"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  label: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
    paddingHorizontal: 5,
    color: '#D9D9D9',
    fontSize: 16,
  },
  uploadArea: {
    borderBottomWidth: 1,
    borderBottomColor: '#F9F1E2',
    paddingBottom: 8,
    paddingTop: 24,
    height: 60,
    alignItems: 'center',
  },
  touchableArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    color: '#F9F1E2',
    position: 'absolute',
    right: 10,
    top: 16,
  },
  previewContainer: {
    marginTop: 10,
    width: '100%',
    height: 200,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 14,
    marginTop: 8,
  },
});

export default FloatingUploadImage;
