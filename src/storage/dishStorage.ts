import AsyncStorage from '@react-native-async-storage/async-storage';
import { DishRecord } from '../types';

const DISH_INDEX_KEY = 'dish_index';
const dishKey = (id: string) => `dish_${id}`;

export async function loadAllDishes(): Promise<DishRecord[]> {
  try {
    const indexJson = await AsyncStorage.getItem(DISH_INDEX_KEY);
    if (!indexJson) return [];

    const ids: string[] = JSON.parse(indexJson);
    const keys = ids.map(dishKey);
    const entries = await AsyncStorage.multiGet(keys);

    const dishes: DishRecord[] = [];
    for (const [, value] of entries) {
      if (value) {
        dishes.push(JSON.parse(value) as DishRecord);
      }
    }
    // 新しい順
    return dishes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export async function saveDish(dish: DishRecord): Promise<void> {
  const indexJson = await AsyncStorage.getItem(DISH_INDEX_KEY);
  const ids: string[] = indexJson ? JSON.parse(indexJson) : [];

  if (!ids.includes(dish.id)) {
    ids.push(dish.id);
    await AsyncStorage.setItem(DISH_INDEX_KEY, JSON.stringify(ids));
  }
  await AsyncStorage.setItem(dishKey(dish.id), JSON.stringify(dish));
}

export async function deleteDish(id: string): Promise<void> {
  const indexJson = await AsyncStorage.getItem(DISH_INDEX_KEY);
  const ids: string[] = indexJson ? JSON.parse(indexJson) : [];

  const newIds = ids.filter((i) => i !== id);
  await AsyncStorage.setItem(DISH_INDEX_KEY, JSON.stringify(newIds));
  await AsyncStorage.removeItem(dishKey(id));
}
