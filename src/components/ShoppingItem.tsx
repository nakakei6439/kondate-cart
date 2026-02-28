import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { ShoppingItem as ShoppingItemType } from '../types';

interface Props {
  item: ShoppingItemType;
  onToggle: () => void;
  onRemove: () => void;
}

export default function ShoppingItem({ item, onToggle, onRemove }: Props) {
  const swipeRef = useRef<Swipeable>(null);

  function renderRightActions(progress: Animated.AnimatedInterpolation<number>) {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });
    return (
      <Animated.View style={[styles.deleteAction, { transform: [{ translateX }] }]}>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => {
            swipeRef.current?.close();
            onRemove();
          }}
        >
          <Text style={styles.deleteBtnText}>削除</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} friction={2} overshootRight={false}>
      <TouchableOpacity
        style={[styles.container, item.checked && styles.containerChecked]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        {/* チェックマーク */}
        <View style={[styles.checkCircle, item.checked && styles.checkCircleChecked]}>
          {item.checked && <Text style={styles.checkMark}>✓</Text>}
        </View>

        {/* テキスト */}
        <View style={styles.textContainer}>
          <Text style={[styles.name, item.checked && styles.nameChecked]}>{item.name}</Text>
          {item.amount ? (
            <Text style={[styles.amount, item.checked && styles.amountChecked]}>{item.amount}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Swipeable>
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
  containerChecked: {
    backgroundColor: '#FAFAFA',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDDDDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkCircleChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkMark: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 16,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  nameChecked: {
    color: '#AAAAAA',
    textDecorationLine: 'line-through',
  },
  amount: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
  },
  amountChecked: {
    color: '#CCCCCC',
  },
  deleteAction: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
