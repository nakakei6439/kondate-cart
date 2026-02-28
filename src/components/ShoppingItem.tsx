import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
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
  const scaleAnim = useRef(new Animated.Value(item.checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: item.checked ? 1 : 0,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [item.checked]);

  function handleToggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  }

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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    <View style={styles.cardWrapper}>
      <Swipeable ref={swipeRef} renderRightActions={renderRightActions} friction={2} overshootRight={false}>
        <TouchableOpacity
          style={[styles.container, item.checked && styles.containerChecked]}
          onPress={handleToggle}
          activeOpacity={0.7}
        >
          {/* チェックサークル */}
          <View style={[styles.checkCircle, item.checked && styles.checkCircleChecked]}>
            <Animated.Text style={[styles.checkMark, { transform: [{ scale: scaleAnim }] }]}>
              ✓
            </Animated.Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  containerChecked: {
    backgroundColor: '#FAFAFA',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkCircleChecked: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
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
    color: '#1C1C1E',
    fontWeight: '500',
  },
  nameChecked: {
    color: '#AEAEB2',
    textDecorationLine: 'line-through',
  },
  amount: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  amountChecked: {
    color: '#C7C7CC',
  },
  deleteAction: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
