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
import { DayEntry, DayKey, DishRecord, Ingredient } from '../types';
import { getDayLabel } from '../utils/weekUtils';

interface Props {
  visible: boolean;
  dayKey: DayKey | null;
  initialEntry: DayEntry | null;
  dishes: DishRecord[];
  onSave: (day: DayKey, entry: DayEntry) => void;
  onClear: (day: DayKey) => void;
  onClose: () => void;
}

export default function DayEntrySheet({
  visible,
  dayKey,
  initialEntry,
  dishes,
  onSave,
  onClear,
  onClose,
}: Props) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const isDirty = useRef(false);

  const [dishName, setDishName] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', amount: '' }]);
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);

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
    if (visible) {
      isDirty.current = false;
      if (initialEntry) {
        setDishName(initialEntry.dishName);
        setIngredients(
          initialEntry.ingredients.length > 0
            ? initialEntry.ingredients
            : [{ name: '', amount: '' }]
        );
        setNote(initialEntry.note);
      } else {
        setDishName('');
        setIngredients([{ name: '', amount: '' }]);
        setNote('');
      }
      setSearchQuery('');
      setShowHistory(false);
    }
  }, [visible, initialEntry]);

  const filteredDishes = dishes.filter((d) => d.name.includes(searchQuery));

  function markDirty() {
    isDirty.current = true;
  }

  function selectDish(dish: DishRecord) {
    setDishName(dish.name);
    setIngredients(dish.ingredients.length > 0 ? [...dish.ingredients] : [{ name: '', amount: '' }]);
    setShowHistory(false);
    setSearchQuery('');
    markDirty();
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
    if (!dayKey) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const filtered = ingredients.filter((i) => i.name.trim());
    onSave(dayKey, {
      dishName: dishName.trim(),
      ingredients: filtered,
      note: note.trim(),
    });
    isDirty.current = false;
    onClose();
  }

  function handleClear() {
    if (!dayKey) return;
    Alert.alert('削除確認', 'この日の献立を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onClear(dayKey);
          onClose();
        },
      },
    ]);
  }

  function handleClose() {
    if (isDirty.current) {
      Alert.alert('保存しますか？', '入力内容が保存されていません。', [
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

  if (!visible) return null;

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
            <Text style={styles.headerTitle}>
              {dayKey ? getDayLabel(dayKey) + '曜日の献立' : ''}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* 料理名 */}
            <Text style={styles.label}>料理名</Text>
            <View style={styles.dishNameRow}>
              <TextInput
                style={styles.dishNameInput}
                value={dishName}
                onChangeText={(t) => {
                  setDishName(t);
                  setSearchQuery(t);
                  setShowHistory(t.length > 0);
                  markDirty();
                }}
                placeholder="例: 肉じゃが"
                placeholderTextColor="#C7C7CC"
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.historyBtn}
                onPress={() => setShowHistory((v) => !v)}
              >
                <Text style={styles.historyBtnText}>履歴</Text>
              </TouchableOpacity>
            </View>

            {/* 過去の料理履歴 */}
            {showHistory && filteredDishes.length > 0 && (
              <View style={styles.historyList}>
                {filteredDishes.slice(0, 8).map((dish) => (
                  <TouchableOpacity
                    key={dish.id}
                    style={styles.historyItem}
                    onPress={() => selectDish(dish)}
                  >
                    <Text style={styles.historyItemText}>{dish.name}</Text>
                    <Text style={styles.historyItemSub}>
                      {dish.ingredients.map((i) => i.name).filter(Boolean).join('、')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 材料（グループ化スタイル） */}
            <Text style={[styles.label, { marginTop: 16 }]}>材料</Text>
            <View style={styles.ingredientGroup}>
              {ingredients.map((ing, index) => (
                <View key={index}>
                  <View style={styles.ingredientRow}>
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
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeIngredient(index)}
                    >
                      <Text style={styles.removeBtnText}>−</Text>
                    </TouchableOpacity>
                  </View>
                  {index < ingredients.length - 1 && (
                    <View style={styles.rowSeparator} />
                  )}
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.addIngredientBtn} onPress={addIngredient}>
              <Text style={styles.addIngredientText}>＋ 材料を追加</Text>
            </TouchableOpacity>

            {/* メモ */}
            <Text style={[styles.label, { marginTop: 16 }]}>メモ</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={(t) => { setNote(t); markDirty(); }}
              placeholder="例: 外食、残り物など"
              placeholderTextColor="#C7C7CC"
              returnKeyType="done"
            />

            <View style={{ height: 24 }} />
          </ScrollView>

          <View style={styles.footer}>
            {initialEntry && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                <Text style={styles.clearBtnText}>削除</Text>
              </TouchableOpacity>
            )}
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
    maxHeight: '90%',
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
  dishNameRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dishNameInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1C1C1E',
  },
  historyBtn: {
    height: 44,
    paddingHorizontal: 14,
    backgroundColor: '#FFF4EE',
    borderRadius: 10,
    justifyContent: 'center',
  },
  historyBtnText: {
    fontSize: 14,
    color: '#E8692A',
    fontWeight: '600',
  },
  historyList: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
    overflow: 'hidden',
  },
  historyItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  historyItemText: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  historyItemSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  // グループ化材料スタイル
  ingredientGroup: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    overflow: 'hidden',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingLeft: 14,
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
  },
  removeBtn: {
    width: 36,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: 20,
    color: '#FF3B30',
    fontWeight: '300',
    lineHeight: 24,
  },
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 14,
  },
  addIngredientBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  addIngredientText: {
    fontSize: 15,
    color: '#E8692A',
    fontWeight: '500',
  },
  noteInput: {
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1C1C1E',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
  },
  clearBtn: {
    flex: 1,
    height: 50,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
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
  saveBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
