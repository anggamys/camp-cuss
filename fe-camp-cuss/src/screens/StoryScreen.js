import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';

const StoryScreen = () => {
  return (
    <>
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Cari Lokasi</Text>
      </SafeAreaView>
      <BottomNav activeScreen="History" />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4E1F1A',
  },
  text: { color: '#FCEBD7', fontSize: 18 },
});

export default StoryScreen;
