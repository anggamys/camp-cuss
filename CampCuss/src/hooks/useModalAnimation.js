// src/hooks/useModalAnimation.js
import {useState, useRef, useEffect, useCallback} from 'react';
import {Animated, Dimensions} from 'react-native';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

export const useModalAnimation = () => {
  const [isModalVisible, setIsModalVisible] = useState(true);
  const modalY = useRef(new Animated.Value(SCREEN_HEIGHT * 0.5)).current;
  const MODAL_MIN_HEIGHT = SCREEN_HEIGHT * 0.3;
  const MODAL_MAX_HEIGHT = SCREEN_HEIGHT * 0.6;

  // PERBAIKAN: Gunakan value yang konsisten untuk posisi
  const openModalFull = useCallback(() => {
    setIsModalVisible(true);
    Animated.spring(modalY, {
      toValue: 0, // Ke atas penuh
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, [modalY]);

  const openModalPartial = useCallback(() => {
    setIsModalVisible(true);
    Animated.spring(modalY, {
      toValue: SCREEN_HEIGHT * 0.5, // Ke tengah (posisi awal)
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, [modalY]);

  const closeModalPartial = useCallback(() => {
    Animated.spring(modalY, {
      toValue: SCREEN_HEIGHT * 0.5,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, [modalY]);

  // PERBAIKAN: Jangan set isModalVisible ke false, biarkan selalu true
  // tapi kontrol dengan transform position
  const closeModal = useCallback(() => {
    Animated.spring(modalY, {
      toValue: SCREEN_HEIGHT, // Geser ke bawah sepenuhnya (offscreen)
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, [modalY]);

  // Auto open modal ketika component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      openModalPartial();
    }, 500);

    return () => clearTimeout(timer);
  }, [openModalPartial]);

  return {
    modalY,
    isModalVisible,
    openModalFull,
    openModalPartial,
    closeModalPartial,
    closeModal,
    MODAL_MIN_HEIGHT,
    MODAL_MAX_HEIGHT,
  };
};
