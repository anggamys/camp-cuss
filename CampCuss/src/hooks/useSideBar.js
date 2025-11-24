import { useNavigation } from '@react-navigation/native';

export const useSideBar = () => {
  const navigation = useNavigation();

  const goToEditProfile = () =>
    navigation.navigate('EditProfile', { animation: 'none' });
  const goToLoginDriver = () =>
    navigation.navigate('LoginDriver', { animation: 'none' });

  return {
    goToEditProfile,
    goToLoginDriver,
  };
};
