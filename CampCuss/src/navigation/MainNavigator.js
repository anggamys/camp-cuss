// src/navigation/MainNavigator.js
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from '../hooks/useAuth';

// Screens
import HomeUser from '../screens/HomeUser';
import HomeAdmin from '../screens/HomeAdmin';
import HomeDriver from '../screens/HomeDriver';
import StoryScreen from '../screens/StoryScreen';
import StoryDriverScreen from '../screens/StoryDriverScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import LoginDriverScreen from '../screens/LoginDriverScreen';
import AddressScreen from '../screens/AddressScreen';
import SearchingDriverScreen from '../screens/SearchingDriverScreen';
import OrderingUserScreen from '../screens/OrderingUserScreen';
// import OrderingDriverScreen from '../screens/OrderingDriverScreen';

const Stack = createNativeStackNavigator();

// Navigator untuk Customer
const CustomerNavigator = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="HomeUser" component={HomeUser} />
    <Stack.Screen name="History" component={StoryScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="LoginDriver" component={LoginDriverScreen} />
    <Stack.Screen name="Address" component={AddressScreen} />
    <Stack.Screen name="SearchingDriver" component={SearchingDriverScreen} />
    <Stack.Screen name="OrderingScreen" component={OrderingUserScreen} />
  </Stack.Navigator>
);

// Navigator untuk Driver
const DriverNavigator = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="HomeDriver" component={HomeDriver} />
    <Stack.Screen name="History" component={StoryDriverScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    {/* <Stack.Screen name="OrderingDriver" component={OrderingDriverScreen} /> */}
  </Stack.Navigator>
);

// Navigator untuk Admin
const AdminNavigator = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="HomeAdmin" component={HomeAdmin} />
    <Stack.Screen name="History" component={StoryScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
  </Stack.Navigator>
);

const MainNavigator = () => {
  const {user} = useAuth();

  // Render navigator berdasarkan role
  switch (user?.role) {
    case 'driver':
      return <DriverNavigator />;
    case 'admin':
      return <AdminNavigator />;
    case 'customer':
    default:
      return <CustomerNavigator />;
  }
};

export default MainNavigator;
