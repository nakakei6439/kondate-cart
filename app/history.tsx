import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DishEditSheet from '../src/components/DishEditSheet';
import { useDishStore } from '../src/store/dishStore';
import { DishRecord, Ingredient } from '../src/types';

export default function HistoryScreen() {
  const { dishes, initialized, loadDishes, updateDish, deleteDish } = useDishStore();

  const [selectedDish, setSelectedDish] = useState<DishRecord | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    if (!initialized) loadDishes();
  }, [initialized]);

  function handleDishPress(dish: DishRecord) {
    setSelectedDish(dish);
    setSheetVisible(true);
  }

  async function handleSave(id: string, name: string, ingredients: Ingredient[]) {
    await updateDish(id, name, ingredients);
  }

  async function handleDelete(id: string) {
    await deleteDish(id);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {dishes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>料理履歴がありません</Text>
          <Text style={styles.emptyDesc}>
            献立タブで料理を登録すると{'\n'}ここに履歴が表示されます
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          <Text style={styles.countText}>{dishes.length}件の料理</Text>
          {dishes.map((dish) => (
            <TouchableOpacity
              key={dish.id}
              style={styles.dishRow}
              onPress={() => handleDishPress(dish)}
              activeOpacity={0.7}
            >
              <View style={styles.dishInfo}>
                <Text style={styles.dishName}>{dish.name}</Text>
                {dish.ingredients.length > 0 ? (
                  <Text style={styles.dishIngredients} numberOfLines={1}>
                    {dish.ingredients.map((i) => i.name).filter(Boolean).join('、')}
                  </Text>
                ) : (
                  <Text style={styles.noIngredients}>材料未登録</Text>
                )}
              </View>
              <Text style={styles.editHint}>編集 ›</Text>
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <DishEditSheet
        visible={sheetVisible}
        dish={selectedDish}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => {
          setSheetVisible(false);
          setSelectedDish(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  countText: {
    fontSize: 13,
    color: '#888888',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  dishIngredients: {
    fontSize: 13,
    color: '#888888',
    marginTop: 3,
  },
  noIngredients: {
    fontSize: 13,
    color: '#BBBBBB',
    marginTop: 3,
  },
  editHint: {
    fontSize: 14,
    color: '#E8692A',
    fontWeight: '500',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
  },
});
