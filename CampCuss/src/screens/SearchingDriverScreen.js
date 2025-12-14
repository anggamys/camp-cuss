// src/screens/SearchingDriverScreen.js

import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useOrder} from '../hooks/useOrder';
import {useNavigation} from '@react-navigation/native';

const SearchingDriverScreen = ({route}) => {
  const {order} = route.params;
  const {pollOrderStatus, cancelOrder} = useOrder();
  const navigation = useNavigation();

  const [isCancelling, setIsCancelling] = useState(false);

  const goToHome = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{name: 'HomeUser'}],
    });
  }, [navigation]);

  const handleCancel = useCallback(async () => {
    if (isCancelling) {
      return;
    }

    setIsCancelling(true);
    try {
      const result = await cancelOrder(order.id);
      if (result.status === 'success') {
        Alert.alert('Dibatalkan', 'Pesanan Anda telah dibatalkan.', [
          {text: 'OK', onPress: goToHome},
        ]);
      }
    } catch (err) {
      console.error('Gagal batalkan:', err);
      Alert.alert('Error', 'Gagal membatalkan pesanan.');
    } finally {
      setIsCancelling(false);
    }
  }, [order.id, cancelOrder, isCancelling, goToHome]);

  useEffect(() => {
    if (!order?.id || order.status !== 'pending') {
      goToHome();
      return;
    }

    const handleStatusUpdate = data => {
      if (data.status === 'accepted') {
        navigation.replace('OrderingUser', {order: data});
      } else if (data.status === 'cancelled') {
        goToHome();
      }
    };

    const cleanup = pollOrderStatus(
      order.id,
      handleStatusUpdate,
      console.error,
    );
    return cleanup;
  }, [order, navigation, pollOrderStatus, goToHome]); // ✅ aman

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size={150} color="#FCEBD7" style={styles.spinner} />
        <Text style={styles.waitingText}>Menunggu driver...</Text>
      </View>

      <TouchableOpacity
        style={[styles.cancelButton, isCancelling && styles.disabledButton]}
        onPress={handleCancel}
        disabled={isCancelling}>
        <Text style={styles.cancelButtonText}>
          {isCancelling ? 'Membatalkan...' : 'Batalkan Pesanan'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SearchingDriverScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4E1F1A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    position: 'relative',
  },
  centerContent: {
    alignItems: 'center',
    position: 'relative',
  },
  logo: {
    width: 70,
    height: 70,
    tintColor: '#FCEBD7',
    position: 'absolute',
    bottom: 75,
  },
  spinner: {
    tintColor: '#FCEBD7',
  },
  waitingText: {
    color: '#FCEBD7',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#FCEBD7',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    minWidth: 180,
    alignItems: 'center',
    position: 'absolute',
    bottom: 60,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4E1F1A',
  },
});
