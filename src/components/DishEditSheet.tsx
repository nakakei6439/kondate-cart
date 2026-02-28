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
              placeholderTextColor="#BBBBBB"
              returnKeyType="done"
            />

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
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeIngredient(index)}>
                  <Text style={styles.removeBtnText}>−</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addIngredientBtn} onPress={addIngredient}>
              <Text style={styles.addIngredientText}>＋ 材料を追加</Text>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>削除</Text>
            </TouchableOpacity>
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
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 18, color: '#999999' },
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
  nameInput: {
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#333333',
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
  ingredientName: { flex: 2 },
  ingredientAmount: { flex: 1 },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: { fontSize: 18, color: '#FF4444', lineHeight: 20 },
  addIngredientBtn: { paddingVertical: 10, alignItems: 'center' },
  addIngredientText: { fontSize: 15, color: '#E8692A', fontWeight: '500' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  deleteBtn: {
    flex: 1,
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: 16, color: '#FF4444', fontWeight: '600' },
  saveBtn: {
    flex: 2,
    height: 50,
    backgroundColor: '#E8692A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 16, color: '#FFFFFF', fontWeight: '700' },
});
