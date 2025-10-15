import { useNavigation } from '@react-navigation/native';

export const useBottomNav = () => {
  const navigation = useNavigation();

  const goToHome = () => navigation.navigate('HomeUser', { animation: 'none' });
  const goToHistory = () => navigation.navigate('History', { animation: 'none' });
  const goToProfile = () => navigation.navigate('Profile', { animation: 'none' });

  return {
    goToHome,
    goToHistory,
    goToProfile,
  };
};