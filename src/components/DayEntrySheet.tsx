import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { DayKey, DayRecord, DishEntry, DishRecord } from '../types';

interface Props {
  visible: boolean;
  dayKey: DayKey | null;
  initialEntry: DayRecord | null;
  dishes: DishRecord[];
  appendNewDish?: boolean;
  onSave: (day: DayKey, record: DayRecord) => void;
  onClear: (day: DayKey) => void;
  onClose: () => void;
}

export default function DayEntrySheet({
  visible,
  dayKey,
  initialEntry,
  dishes,
  appendNewDish,
  onSave,
  onClear,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const isDirty = useRef(false);
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const prevDishCountRef = useRef(1);
  const prevIngCountRef = useRef(1);

  const [dayDishes, setDayDishes] = useState<DishEntry[]>([{ dishName: '', ingredients: [{ name: '', amount: '' }] }]);
  const [note, setNote] = useState('');
  const [activeHistoryIdx, setActiveHistoryIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const totalIngs = dayDishes.reduce((sum, d) => sum + d.ingredients.length, 0);
    const dishAdded = dayDishes.length > prevDishCountRef.current;
    const ingAdded = totalIngs > prevIngCountRef.current;
    if (dishAdded || ingAdded) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    prevDishCountRef.current = dayDishes.length;
    prevIngCountRef.current = totalIngs;
  }, [dayDishes]);

  useEffect(() => {
    if (visible) {
      isDirty.current = false;
      if (initialEntry) {
        const baseDishes =
          initialEntry.dishes.length > 0
            ? initialEntry.dishes.map((d) => ({
                dishName: d.dishName,
                ingredients: d.ingredients.length > 0 ? d.ingredients : [{ name: '', amount: '' }],
              }))
            : [{ dishName: '', ingredients: [{ name: '', amount: '' }] }];
        setDayDishes(
          appendNewDish
            ? [...baseDishes, { dishName: '', ingredients: [{ name: '', amount: '' }] }]
            : baseDishes
        );
        setNote(initialEntry.note);
      } else {
        setDayDishes([{ dishName: '', ingredients: [{ name: '', amount: '' }] }]);
        setNote('');
      }
      setActiveHistoryIdx(null);
      setSearchQuery('');
    }
  }, [visible, initialEntry]);

  const filteredHistory = dishes.filter((d) => d.name.includes(searchQuery));

  function markDirty() {
    isDirty.current = true;
  }

  function updateDishName(dishIdx: number, value: string) {
    setDayDishes((prev) => {
      const next = [...prev];
      next[dishIdx] = { ...next[dishIdx], dishName: value };
      return next;
    });
    setActiveHistoryIdx(dishIdx);
    setSearchQuery(value);
    markDirty();
  }

  function toggleHistory(dishIdx: number) {
    if (activeHistoryIdx === dishIdx) {
      setActiveHistoryIdx(null);
    } else {
      setActiveHistoryIdx(dishIdx);
      setSearchQuery(dayDishes[dishIdx].dishName);
    }
  }

  function selectDishFromHistory(dishIdx: number, dish: DishRecord) {
    setDayDishes((prev) => {
      const next = [...prev];
      next[dishIdx] = {
        dishName: dish.name,
        ingredients: dish.ingredients.length > 0 ? [...dish.ingredients] : [{ name: '', amount: '' }],
      };
      return next;
    });
    setActiveHistoryIdx(null);
    setSearchQuery('');
    markDirty();
  }

  function updateIngredient(dishIdx: number, ingIdx: number, field: 'name' | 'amount', value: string) {
    setDayDishes((prev) => {
      const next = [...prev];
      const ings = [...next[dishIdx].ingredients];
      ings[ingIdx] = { ...ings[ingIdx], [field]: value };
      next[dishIdx] = { ...next[dishIdx], ingredients: ings };
      return next;
    });
    markDirty();
  }

  function addIngredient(dishIdx: number) {
    setDayDishes((prev) => {
      const next = [...prev];
      next[dishIdx] = { ...next[dishIdx], ingredients: [...next[dishIdx].ingredients, { name: '', amount: '' }] };
      return next;
    });
    markDirty();
  }

  function removeIngredient(dishIdx: number, ingIdx: number) {
    setDayDishes((prev) => {
      const next = [...prev];
      next[dishIdx] = { ...next[dishIdx], ingredients: next[dishIdx].ingredients.filter((_, i) => i !== ingIdx) };
      return next;
    });
    markDirty();
  }

  function addDish() {
    setDayDishes((prev) => [...prev, { dishName: '', ingredients: [{ name: '', amount: '' }] }]);
    setActiveHistoryIdx(null);
    markDirty();
  }

  function removeDish(dishIdx: number) {
    setDayDishes((prev) => prev.filter((_, i) => i !== dishIdx));
    if (activeHistoryIdx === dishIdx) setActiveHistoryIdx(null);
    markDirty();
  }

  function handleSave() {
    if (!dayKey) return;
    const cleanedDishes = dayDishes
      .map((d) => ({
        dishName: d.dishName.trim(),
        ingredients: d.ingredients.filter((i) => i.name.trim()),
      }))
      .filter((d) => d.dishName || d.ingredients.length > 0);
    const trimmedNote = note.trim();
    if (cleanedDishes.length === 0 && !trimmedNote) {
      isDirty.current = false;
      onClose();
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(dayKey, { dishes: cleanedDishes, note: trimmedNote });
    isDirty.current = false;
    onClose();
  }

  function handleClear() {
    if (!dayKey) return;
    Alert.alert(t('entry.clearDayTitle'), t('entry.clearDayMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
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
      Alert.alert(t('common.unsavedChanges'), t('common.unsavedChangesMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.discard'),
          style: 'destructive',
          onPress: () => {
            isDirty.current = false;
            onClose();
          },
        },
        { text: t('common.saveConfirm'), onPress: handleSave },
      ]);
    } else {
      onClose();
    }
  }

  return (
    <Modal transparent={false} animationType="slide" visible={visible} onRequestClose={handleClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheet}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.backBtn}>
              <Text style={styles.backBtnText}>{t('entry.back')}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {dayKey ? t('entry.headerTitle', { day: t(`days.full.${dayKey}`) }) : ''}
            </Text>
            <TouchableOpacity onPress={addDish} style={styles.addDishIconBtn}>
              <Ionicons name="add-circle-outline" size={26} color="#E8692A" />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {dayDishes.map((dish, dishIdx) => {
              return (
                <View key={dishIdx}>
                  {/* Dish section header */}
                  <Text style={styles.label}>{t('entry.dish', { number: dishIdx + 1 })}</Text>

                  {/* Dish name */}
                  <Swipeable
                    renderRightActions={() => (
                      <TouchableOpacity
                        style={[styles.swipeDeleteBtn, { borderRadius: 10 }]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          removeDish(dishIdx);
                        }}
                      >
                        <Text style={styles.swipeDeleteText}>{t('common.delete')}</Text>
                      </TouchableOpacity>
                    )}
                    enabled={dayDishes.length > 1}
                    overshootRight={false}
                  >
                    <View style={styles.dishNameRow}>
                      <TextInput
                        style={styles.dishNameInput}
                        value={dish.dishName}
                        onChangeText={(v) => updateDishName(dishIdx, v)}
                        placeholder={t('entry.dishPlaceholder')}
                        placeholderTextColor="#C7C7CC"
                        returnKeyType="done"
                      />
                      <TouchableOpacity
                        style={styles.historyBtn}
                        onPress={() => toggleHistory(dishIdx)}
                      >
                        <Text style={styles.historyBtnText}>{t('entry.historyBtn')}</Text>
                      </TouchableOpacity>
                    </View>
                  </Swipeable>

                  {/* History list */}
                  {activeHistoryIdx === dishIdx && filteredHistory.length > 0 && (
                    <View style={styles.historyList}>
                      {filteredHistory.slice(0, 8).map((d) => (
                        <TouchableOpacity
                          key={d.id}
                          style={styles.historyItem}
                          onPress={() => selectDishFromHistory(dishIdx, d)}
                        >
                          <Text style={styles.historyItemText}>{d.name}</Text>
                          <Text style={styles.historyItemSub}>
                            {d.ingredients.map((i) => i.name).filter(Boolean).join('、')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Ingredients */}
                  <Text style={[styles.label, { marginTop: 16 }]}>{t('entry.ingredients')}</Text>
                  <View style={styles.ingredientGroup}>
                    {dish.ingredients.map((ing, ingIdx) => {
                      const isFirst = ingIdx === 0;
                      const isLast = ingIdx === dish.ingredients.length - 1;
                      const rowRadius = {
                        borderTopLeftRadius: isFirst ? 12 : 0,
                        borderTopRightRadius: isFirst ? 12 : 0,
                        borderBottomLeftRadius: isLast ? 12 : 0,
                        borderBottomRightRadius: isLast ? 12 : 0,
                      };
                      return (
                        <View key={ingIdx}>
                          <Swipeable
                            renderRightActions={() => (
                              <TouchableOpacity
                                style={[styles.swipeDeleteBtn, {
                                  borderTopRightRadius: isFirst ? 12 : 0,
                                  borderBottomRightRadius: isLast ? 12 : 0,
                                }]}
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  removeIngredient(dishIdx, ingIdx);
                                }}
                              >
                                <Text style={styles.swipeDeleteText}>{t('common.delete')}</Text>
                              </TouchableOpacity>
                            )}
                            overshootRight={false}
                          >
                            <View style={[styles.ingredientRow, rowRadius]}>
                              <TextInput
                                style={styles.ingredientNameInput}
                                value={ing.name}
                                onChangeText={(v) => updateIngredient(dishIdx, ingIdx, 'name', v)}
                                placeholder={t('entry.ingredientNamePlaceholder')}
                                placeholderTextColor="#C7C7CC"
                                returnKeyType="next"
                              />
                              <View style={styles.ingredientVerticalDivider} />
                              <TextInput
                                style={styles.ingredientAmountInput}
                                value={ing.amount}
                                onChangeText={(v) => updateIngredient(dishIdx, ingIdx, 'amount', v)}
                                placeholder={t('entry.ingredientAmountPlaceholder')}
                                placeholderTextColor="#C7C7CC"
                                returnKeyType="done"
                              />
                            </View>
                          </Swipeable>
                          {ingIdx < dish.ingredients.length - 1 && (
                            <View style={styles.rowSeparator} />
                          )}
                        </View>
                      );
                    })}
                  </View>

                  <TouchableOpacity style={styles.addIngredientBtn} onPress={() => addIngredient(dishIdx)}>
                    <Text style={styles.addIngredientText}>{t('entry.addIngredient')}</Text>
                  </TouchableOpacity>

                  {/* Divider between dishes */}
                  {dishIdx < dayDishes.length - 1 && <View style={styles.dishDivider} />}
                </View>
              );
            })}

            {/* Note */}
            <Text style={[styles.label, { marginTop: 8 }]}>{t('entry.note')}</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={(v) => { setNote(v); markDirty(); }}
              placeholder={t('entry.notePlaceholder')}
              placeholderTextColor="#C7C7CC"
              returnKeyType="done"
            />

            <View style={{ height: 24 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 70,
  },
  backBtnText: {
    fontSize: 17,
    color: '#E8692A',
  },
  addDishIconBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 70,
    alignItems: 'flex-end',
  },
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
  dishDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 20,
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
  saveBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
