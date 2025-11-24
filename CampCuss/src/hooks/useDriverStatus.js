// src/hooks/useDriverStatus.js
import {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRIVER_ACTIVE_KEY = 'driver_active_status';

export const useDriverStatus = () => {
  const [isDriverActive, setIsDriverActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load dari storage saat mount
  useEffect(() => {
    const loadStatus = async () => {
      const saved = await AsyncStorage.getItem(DRIVER_ACTIVE_KEY);
      setIsDriverActive(saved === 'true');
      setLoading(false);
    };
    loadStatus();
  }, []);

  // Simpan ke storage saat berubah
  const toggleDriverActive = async () => {
    const newState = !isDriverActive;
    setIsDriverActive(newState);
    await AsyncStorage.setItem(DRIVER_ACTIVE_KEY, String(newState));
  };

  return {isDriverActive, toggleDriverActive, loading};
};
