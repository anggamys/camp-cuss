import React from 'react';
import { StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconDriver from 'react-native-vector-icons/FontAwesome6';

const MenuItem = ({ name, label, onPress, user }) => {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      {user?.role === 'custumer' ? (
        <Icon name={name} style={styles.icon} />
      ) : (
        <IconDriver name={name} style={styles.icon} />
      )}
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#E8D5C4',
  },
  icon: {
    fontSize: 20,
    marginRight: 10,
    color: '#4E1F1A',
  },
  menuLabel: {
    fontSize: 16,
    color: '#4E1F1A',
  },
});

export default MenuItem;
