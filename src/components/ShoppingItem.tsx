import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ShoppingItem as ShoppingItemType } from '../types';

interface Props {
  item: ShoppingItemType;
  onRemove: () => void;
}

export default function ShoppingItem({ item, onRemove }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.name}>{item.name}</Text>
        {item.amount ? (
          <Text style={styles.amount}>{item.amount}</Text>
        ) : null}
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.removeBtnText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  amount: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
  },
  removeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  removeBtnText: {
    fontSize: 18,
    color: '#999999',
    lineHeight: 20,
  },
});
