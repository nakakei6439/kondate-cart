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

  // アニメーション
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

  // 初期値セット
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
      {/* 背景タップで閉じる */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      {/* KeyboardAvoidingView でシート全体を上に押し上げる */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kavContainer}
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* ハンドル */}
          <View style={styles.handle} />

          {/* ヘッダー */}
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
                placeholderTextColor="#BBBBBB"
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

            {/* 材料 */}
            <Text style={[styles.label, { marginTop: 16 }]}>材料</Text>
            {ingredients.map((ing, index) => (
              <View key={index} style={styles.ingredientRow}>
                <TextInput
                  style={[styles.ingredientInput, styles.ingredientName]}
                  value={ing.name}
                  onChangeText={(t) => updateIngredient(index, 'name', t)}
                  placeholder="食材名"
                  placeholderTextColor="#BBBBBB"
                  returnKeyType="next"
                />
                <TextInput
                  style={[styles.ingredientInput, styles.ingredientAmount]}
                  value={ing.amount}
                  onChangeText={(t) => updateIngredient(index, 'amount', t)}
                  placeholder="量"
                  placeholderTextColor="#BBBBBB"
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeIngredient(index)}
                >
                  <Text style={styles.removeBtnText}>−</Text>
                </TouchableOpacity>
              </View>
            ))}

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
              placeholderTextColor="#BBBBBB"
              returnKeyType="done"
            />

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* フッターボタン */}
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
    width: 40,
    height: 4,
    backgroundColor: '#DDDDDD',
    borderRadius: 2,
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
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#999999',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
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
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#333333',
  },
  historyBtn: {
    height: 44,
    paddingHorizontal: 14,
    backgroundColor: '#F5F5F5',
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
  },
  historyItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  historyItemText: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  historyItemSub: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  ingredientRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  ingredientInput: {
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#333333',
  },
  ingredientName: {
    flex: 2,
  },
  ingredientAmount: {
    flex: 1,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: 18,
    color: '#FF4444',
    lineHeight: 20,
  },
  addIngredientBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  addIngredientText: {
    fontSize: 15,
    color: '#E8692A',
    fontWeight: '500',
  },
  noteInput: {
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#333333',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  clearBtn: {
    flex: 1,
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 16,
    color: '#FF4444',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    height: 50,
    backgroundColor: '#E8692A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
