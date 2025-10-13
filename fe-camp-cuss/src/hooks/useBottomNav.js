import { useNavigation } from '@react-navigation/native';

export const useBottomNav = () => {
  const navigation = useNavigation();

  const goToHome = () => navigation.navigate('HomeUser');
  const goToSearch = () => navigation.navigate('Search');
  const goToProfile = () => navigation.navigate('Profile');

  return {
    goToHome,
    goToSearch,
    goToProfile,
  };
};