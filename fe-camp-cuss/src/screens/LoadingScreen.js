// src/screens/SplashScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4E1F1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FCEBD7',
    fontSize: 24,
  },
});

export default LoadingScreen;