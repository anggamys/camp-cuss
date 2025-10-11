// src/navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth'; // 👈 import useAuth
import { useNavigation } from "@react-navigation/native";

// Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import LoadingScreen from '../screens/LoadingScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeUser from '../screens/HomeUser';
import HomeAdmin from '../screens/HomeAdmin';
import HomeDriver from '../screens/HomeDriver';

const Stack = createNativeStackNavigator();

// Stack untuk pengguna yang sudah login
const AppStack = () => {
  const { user } = useAuth();
  const {navigate} = useNavigation();

  // Tentukan home screen berdasarkan role
  if (user?.role === 'admin') navigate.replace = 'HomeAdmin';
  else if (user?.role === 'driver') navigate.replace = 'HomeDriver';
  else navigate.replace = 'HomeUser';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeUser" component={HomeUser} />
      <Stack.Screen name="HomeAdmin" component={HomeAdmin} />
      <Stack.Screen name="HomeDriver" component={HomeDriver} />
    </Stack.Navigator>
  );
};

// Stack untuk auth (belum login)
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName='Splash'>
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Navigator utama
const AppNavigator = () => {
  const { user, loading } = useAuth();

  // Tampilkan SplashScreen saat sedang memeriksa token
  if (user && loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // Jika sudah login → tampilkan AppStack
        <Stack.Screen name="App" component={AppStack} />
      ) : (
        // Jika belum login → tampilkan AuthStack
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;