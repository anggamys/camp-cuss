// src/components/LoadingScreen.js
import React from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';

const LoadingScreen = ({message, subMessage, showRetry}) => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FCEBD7" />
      <Text style={styles.loadingText}>{message}</Text>
      {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
      {showRetry && <Text style={styles.retryText}>Mengulangi koneksi...</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4E1F1A',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#FCEBD7',
    marginTop: 20,
    textAlign: 'center',
  },
  subMessage: {
    fontSize: 14,
    color: '#FCEBD7',
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.8,
  },
  retryText: {
    fontSize: 12,
    color: '#FFA500',
    marginTop: 5,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default LoadingScreen;
