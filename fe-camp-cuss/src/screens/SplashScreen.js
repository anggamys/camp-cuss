// SplashScreen.js

import React, { useEffect } from "react";
import {
  View,
  Image,
  StyleSheet,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === "android") {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
      }
      setTimeout(() => navigation.replace("Login"), 2000);
    };
    requestLocationPermission();
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Pembungkus untuk efek glow */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#501D1C", // Warna latar belakang maroon
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    // Efek glow untuk Android & iOS
    shadowColor: "#F9F1E2 ", // Warna cahaya
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0, // Opacity cahaya
    shadowRadius: 20,   // Radius cahaya — semakin besar, semakin lebar glow
    elevation: 50,      // Untuk Android
    padding: 0.5,        // Memberi ruang untuk glow
    borderRadius: 100,  // Membuat lingkaran sempurna
    backgroundColor: "transparent", // Jangan sampai ada background solid
  },
  logo: {
    width: 200,
    height: 200,
    tintColor: "#F9F1EF", // Logo jadi putih bersinar
  },
});

export default SplashScreen;