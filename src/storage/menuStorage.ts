import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeekMenu } from '../types';

const WEEK_KEYS_KEY = 'week_keys';
const weekMenuKey = (weekKey: string) => `week_menu_${weekKey}`;

export async function loadWeekMenu(weekKey: string): Promise<WeekMenu | null> {
  try {
    const json = await AsyncStorage.getItem(weekMenuKey(weekKey));
    if (!json) return null;
    return JSON.parse(json) as WeekMenu;
  } catch {
    return null;
  }
}

export async function saveWeekMenu(menu: WeekMenu): Promise<void> {
  // week_keys に追加
  const keysJson = await AsyncStorage.getItem(WEEK_KEYS_KEY);
  const keys: string[] = keysJson ? JSON.parse(keysJson) : [];

  if (!keys.includes(menu.weekKey)) {
    keys.push(menu.weekKey);
    await AsyncStorage.setItem(WEEK_KEYS_KEY, JSON.stringify(keys));
  }
  await AsyncStorage.setItem(weekMenuKey(menu.weekKey), JSON.stringify(menu));
}
