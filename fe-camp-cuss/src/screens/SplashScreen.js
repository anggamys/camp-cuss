import React, { useEffect } from "react";
import { View, Image, StyleSheet, PermissionsAndroid, Platform } from "react-native";
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
      <Image
        source={require("../assets/logo.png")}
        style={styles.logo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#4E1F1A", alignItems: "center", justifyContent: "center" },
  logo: { width: 120, height: 120, tintColor: "#fff" },
});

export default SplashScreen;
