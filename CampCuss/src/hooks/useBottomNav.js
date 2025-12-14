import {useNavigation} from '@react-navigation/native';
import { useAuth } from './useAuth';

export const useBottomNav = () => {
  const navigation = useNavigation();
  const {user} = useAuth();

  const goToHome = () => {
    // Tentukan home screen berdasarkan role
    let homeScreen = 'HomeUser';
    if (user?.role === 'driver') {
      homeScreen = 'HomeDriver';
    } else if (user?.role === 'admin') {
      homeScreen = 'HomeAdmin';
    }
    navigation.navigate(homeScreen, {animation: 'none'});
  };
  const goToHistory = () => navigation.navigate('History', {animation: 'none'});
  const goToProfile = () => navigation.navigate('Profile', {animation: 'none'});

  return {
    goToHome,
    goToHistory,
    goToProfile,
  };
};
