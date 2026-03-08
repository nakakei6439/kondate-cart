import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { DishRecord, Ingredient } from '../types';

interface Props {
  visible: boolean;
  dish: DishRecord | null;
  onSave: (id: string, name: string, ingredients: Ingredient[]) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function DishEditSheet({ visible, dish, onSave, onDelete, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const isDirty = useRef(false);

  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', amount: '' }]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && dish) {
      isDirty.current = false;
      setName(dish.name);
      setIngredients(dish.ingredients.length > 0 ? [...dish.ingredients] : [{ name: '', amount: '' }]);
    }
  }, [visible, dish]);

  function markDirty() {
    isDirty.current = true;
  }

  function updateIngredient(index: number, field: 'name' | 'amount', value: string) {
    setIngredients((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    markDirty();
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { name: '', amount: '' }]);
    markDirty();
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  }

  function handleSave() {
    if (!dish) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const filtered = ingredients.filter((i) => i.name.trim());
    onSave(dish.id, name.trim() || dish.name, filtered);
    isDirty.current = false;
    onClose();
  }

  function handleDelete() {
    if (!dish) return;
    Alert.alert('削除確認', `「${dish.name}」を履歴から削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onDelete(dish.id);
          onClose();
        },
      },
    ]);
  }

  function handleClose() {
    if (isDirty.current) {
      Alert.alert('保存しますか？', '変更内容が保存されていません。', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '保存しない',
          style: 'destructive',
          onPress: () => {
            isDirty.current = false;
            onClose();
          },
        },
        { text: '保存する', onPress: handleSave },
      ]);
    } else {
      onClose();
    }
  }

  if (!visible || !dish) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kavContainer}
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>料理を編集</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* 料理名 */}
            <Text style={styles.label}>料理名</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={(t) => { setName(t); markDirty(); }}
              placeholder="料理名"
              placeholderTextColor="#C7C7CC"
              returnKeyType="done"
            />

            {/* 材料（グループ化スタイル） */}
            <Text style={[styles.label, { marginTop: 16 }]}>材料</Text>
            <View style={styles.ingredientGroup}>
              {ingredients.map((ing, index) => {
                const isFirst = index === 0;
                const isLast = index === ingredients.length - 1;
                const rowRadius = {
                  borderTopLeftRadius: isFirst ? 12 : 0,
                  borderTopRightRadius: isFirst ? 12 : 0,
                  borderBottomLeftRadius: isLast ? 12 : 0,
                  borderBottomRightRadius: isLast ? 12 : 0,
                };
                return (
                  <View key={index}>
                    <Swipeable
                      renderRightActions={() => (
                        <TouchableOpacity
                          style={[styles.swipeDeleteBtn, {
                            borderTopRightRadius: isFirst ? 12 : 0,
                            borderBottomRightRadius: isLast ? 12 : 0,
                          }]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            removeIngredient(index);
                          }}
                        >
                          <Text style={styles.swipeDeleteText}>削除</Text>
                        </TouchableOpacity>
                      )}
                      overshootRight={false}
                    >
                      <View style={[styles.ingredientRow, rowRadius]}>
                        <TextInput
                          style={styles.ingredientNameInput}
                          value={ing.name}
                          onChangeText={(t) => updateIngredient(index, 'name', t)}
                          placeholder="食材名"
                          placeholderTextColor="#C7C7CC"
                          returnKeyType="next"
                        />
                        <View style={styles.ingredientVerticalDivider} />
                        <TextInput
                          style={styles.ingredientAmountInput}
                          value={ing.amount}
                          onChangeText={(t) => updateIngredient(index, 'amount', t)}
                          placeholder="量"
                          placeholderTextColor="#C7C7CC"
                          returnKeyType="done"
                        />
                      </View>
                    </Swipeable>
                    {index < ingredients.length - 1 && (
                      <View style={styles.rowSeparator} />
                    )}
                  </View>
                );
              })}
            </View>

            <TouchableOpacity style={styles.addIngredientBtn} onPress={addIngredient}>
              <Text style={styles.addIngredientText}>＋ 材料を追加</Text>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>保存</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  kavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 18, color: '#8E8E93' },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameInput: {
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1C1C1E',
  },
  ingredientGroup: {
    borderRadius: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingLeft: 14,
    backgroundColor: '#F2F2F7',
  },
  ingredientNameInput: {
    flex: 2,
    height: 44,
    fontSize: 15,
    color: '#1C1C1E',
    backgroundColor: 'transparent',
  },
  ingredientVerticalDivider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    backgroundColor: '#C6C6C8',
    marginHorizontal: 8,
  },
  ingredientAmountInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#1C1C1E',
    backgroundColor: 'transparent',
    paddingRight: 14,
  },
  swipeDeleteBtn: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
  },
  swipeDeleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 14,
  },
  addIngredientBtn: { paddingVertical: 12, alignItems: 'center' },
  addIngredientText: { fontSize: 15, color: '#E8692A', fontWeight: '500' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
  },
  saveBtn: {
    flex: 1,
    height: 50,
    backgroundColor: '#E8692A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E8692A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnText: { fontSize: 16, color: '#FFFFFF', fontWeight: '700' },
});
