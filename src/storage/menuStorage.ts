import AsyncStorage from '@react-native-async-storage/async-storage';
import { DayKey, DayRecord, Ingredient, WeekMenu } from '../types';

const WEEK_KEYS_KEY = 'week_keys';
const weekMenuKey = (weekKey: string) => `week_menu_${weekKey}`;

// 旧 DayEntry 形式（dishName + ingredients + note）を新 DayRecord 形式に変換
function migrateDayRecord(raw: unknown): DayRecord {
  if (raw && typeof raw === 'object' && 'dishes' in raw) {
    return raw as DayRecord;
  }
  const old = raw as { dishName?: string; ingredients?: Ingredient[]; note?: string };
  return {
    dishes: [{ dishName: old.dishName ?? '', ingredients: old.ingredients ?? [] }],
    note: old.note ?? '',
  };
}

export async function loadWeekMenu(weekKey: string): Promise<WeekMenu | null> {
  try {
    const json = await AsyncStorage.getItem(weekMenuKey(weekKey));
    if (!json) return null;
    const raw = JSON.parse(json) as { weekKey: string; days: Record<string, unknown> };
    const migratedDays: Partial<Record<DayKey, DayRecord>> = {};
    for (const [key, val] of Object.entries(raw.days ?? {})) {
      migratedDays[key as DayKey] = migrateDayRecord(val);
    }
    return { weekKey: raw.weekKey, days: migratedDays };
  } catch {
    return null;
  }
}

export async function saveWeekMenu(menu: WeekMenu): Promise<void> {
  const keysJson = await AsyncStorage.getItem(WEEK_KEYS_KEY);
  const keys: string[] = keysJson ? JSON.parse(keysJson) : [];

  if (!keys.includes(menu.weekKey)) {
    keys.push(menu.weekKey);
    await AsyncStorage.setItem(WEEK_KEYS_KEY, JSON.stringify(keys));
  }
  await AsyncStorage.setItem(weekMenuKey(menu.weekKey), JSON.stringify(menu));
}
