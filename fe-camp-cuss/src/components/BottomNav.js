import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
} from 'react-native';
import { useBottomNav } from '../hooks/useBottomNav';

const BottomNav = ({ activeScreen = 'Home' }) => {
  const { goToHome, goToSearch, goToProfile } = useBottomNav();

  const isActive = (screen) => activeScreen === screen;

  return (
    <View style={styles.bottomNav}>
      {/* Home */}
      <TouchableOpacity onPress={goToHome} style={styles.navItem}>
        <Image
          source={
            isActive('Home')
              ? require('../assets/home-active.png')
              : require('../assets/home.png')
          }
          style={styles.navIcon}
        />
        <Text
          style={[
            styles.navText,
            isActive('Home') && styles.navTextActive,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* Search */}
      <TouchableOpacity onPress={goToSearch} style={styles.navItem}>
        <Image
          source={require('../assets/search.png')}
          style={styles.navIcon}
        />
        <Text
          style={[
            styles.navText,
            isActive('Search') && styles.navTextActive,
          ]}
        >
          Search
        </Text>
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity onPress={goToProfile} style={styles.navItem}>
        <Image
          source={require('../assets/profile.png')}
          style={styles.navIcon}
        />
        <Text
          style={[
            styles.navText,
            isActive('Profile') && styles.navTextActive,
          ]}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FCEBD7',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#D9D9D9',
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
    tintColor: '#4E1F1A',
  },
  navText: {
    fontSize: 12,
    color: '#4E1F1A',
    marginTop: 4,
  },
  navTextActive: {
    fontWeight: 'bold',
  },
});

export default BottomNav;