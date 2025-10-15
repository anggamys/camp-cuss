// src/components/FloatingInput.js

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';

const FloatingInput = ({
  label,
  value,
  onChangeText,
  placeholderTextColor = '#D9D9D980',
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  isPassword = false,
  editable = true,
  selectTextOnFocus = true,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  // Sinkronkan animasi saat value berubah dari luar (misal: reset form)
  useEffect(() => {
    Animated.timing(animValue, {
      toValue: value || isFocused ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [value, isFocused]);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const animatedLabelStyle = {
    top: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 0],
    }),
    fontSize: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 13],
    }),
    color: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#D9D9D9', '#F9F1E2'],
    }),
  };

  return (
    <View style={styles.inputWrapper}>
      <Animated.Text style={[styles.label, animatedLabelStyle]}>
        {label}
      </Animated.Text>
      <TextInput
        style={[
          styles.input,
          (isFocused || value) && styles.inputFocused,
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={placeholderTextColor}
        editable={editable}
        selectTextOnFocus={selectTextOnFocus}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  label: {
    position: 'absolute',
    left: -3,
    zIndex: 1,
    paddingHorizontal: 5,
  },
  input: {
    backgroundColor: '#501D1C',
    paddingHorizontal: 10,
    paddingTop: 20,
    fontSize: 16,
    color: '#F9F1E2',
    borderBottomWidth: 1,
    borderBottomColor: '#F9F1E2',
  },
  inputFocused: {
    backgroundColor: 'rgba(217, 217, 217, 0.1)',
    color: '#F9F1E2',
  },
});

export default FloatingInput;