import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { View } from 'react-native';

const ProfileField = ({ label, value, secure }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, secure && styles.masked]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  fieldContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#D9B399',
    paddingBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.8,
  },
  value: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
  },
  masked: {
    fontFamily: 'monospace',
  },
});

export default ProfileField;
