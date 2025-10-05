import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen.js';
import LoginScreen from '../screens/LoginScreen.js';
import RegisterScreen from '../screens/RegisterScreen.js';
import HomeAdmin from '../screens/HomeAdmin.js';
import HomeUser from '../screens/HomeUser.js';
import HomeDriver from '../screens/HomeDriver.js';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
      />
      <Stack.Screen
        name="HomeUser"
        component={HomeUser}
      />
      <Stack.Screen
        name="HomeDriver"
        component={HomeDriver}
      />
      <Stack.Screen
        name="HomeAdmin"
        component={HomeAdmin}
      />
    </Stack.Navigator>
  );
}

export default AppNavigator;