import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { WeekMenu, DishRecord } from '../types';
import { getCurrentWeekKey, nextWeekKey } from '../utils/weekUtils';

const EXPORT_VERSION = 1;

interface ExportData {
  version: number;
  exportedAt: string;
  weekMenus: WeekMenu[];
  dishes: DishRecord[];
}

export async function exportData(): Promise<void> {
  // 週間献立を全て読み込む
  const keysJson = await AsyncStorage.getItem('week_keys');
  const weekKeys: string[] = keysJson ? JSON.parse(keysJson) : [];
  const weekMenus: WeekMenu[] = [];
  for (const key of weekKeys) {
    const json = await AsyncStorage.getItem(`week_menu_${key}`);
    if (json) weekMenus.push(JSON.parse(json));
  }

  // 料理履歴を全て読み込む
  const indexJson = await AsyncStorage.getItem('dish_index');
  const ids: string[] = indexJson ? JSON.parse(indexJson) : [];
  const entries = await AsyncStorage.multiGet(ids.map((id) => `dish_${id}`));
  const dishes: DishRecord[] = entries
    .filter(([, v]) => v !== null)
    .map(([, v]) => JSON.parse(v!));

  const data: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    weekMenus,
    dishes,
  };

  const filename = `kondate-cart-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const filepath = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(filepath, JSON.stringify(data, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('この端末ではファイル共有が利用できません');

  await Sharing.shareAsync(filepath, {
    mimeType: 'application/json',
    dialogTitle: '献立データをエクスポート',
    UTI: 'public.json',
  });
}

export async function importData(): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'public.json'],
    copyToCacheDirectory: true,
  });

  if (result.canceled) return false;

  const uri = result.assets[0].uri;
  const json = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let data: ExportData;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('JSONの読み込みに失敗しました。正しいファイルか確認してください。');
  }

  if (!data.version || !Array.isArray(data.weekMenus) || !Array.isArray(data.dishes)) {
    throw new Error('ファイル形式が正しくありません。献立カートのバックアップファイルを選んでください。');
  }

  // 既存データのキーを収集してから削除
  const existingKeysJson = await AsyncStorage.getItem('week_keys');
  const existingWeekKeys: string[] = existingKeysJson ? JSON.parse(existingKeysJson) : [];

  const existingIndexJson = await AsyncStorage.getItem('dish_index');
  const existingIds: string[] = existingIndexJson ? JSON.parse(existingIndexJson) : [];

  await AsyncStorage.multiRemove([
    'week_keys',
    'dish_index',
    ...existingWeekKeys.map((k) => `week_menu_${k}`),
    ...existingIds.map((id) => `dish_${id}`),
  ]);

  // 新データを一括書き込み
  const pairs: [string, string][] = [
    ['week_keys', JSON.stringify(data.weekMenus.map((m) => m.weekKey))],
    ...data.weekMenus.map((m): [string, string] => [`week_menu_${m.weekKey}`, JSON.stringify(m)]),
    ['dish_index', JSON.stringify(data.dishes.map((d) => d.id))],
    ...data.dishes.map((d): [string, string] => [`dish_${d.id}`, JSON.stringify(d)]),
  ];

  await AsyncStorage.multiSet(pairs);
  return true;
}

export async function seedDummyData(): Promise<void> {
  const week1 = nextWeekKey(getCurrentWeekKey());
  const week2 = nextWeekKey(week1);

  const weekMenus: WeekMenu[] = [
    {
      weekKey: week1,
      days: {
        Mon: { dishName: '豚の生姜焼き', ingredients: [{ name: '豚ロース', amount: '300g' }, { name: '玉ねぎ', amount: '1個' }, { name: '生姜', amount: '1かけ' }], note: '' },
        Tue: { dishName: 'チキンカレー', ingredients: [{ name: '鶏もも肉', amount: '400g' }, { name: 'じゃがいも', amount: '2個' }, { name: '玉ねぎ', amount: '2個' }, { name: 'カレールー', amount: '1/2箱' }], note: '' },
        Wed: { dishName: '麻婆豆腐', ingredients: [{ name: '豆腐', amount: '1丁' }, { name: '豚ひき肉', amount: '150g' }, { name: '長ねぎ', amount: '1本' }, { name: '豆板醤', amount: '小さじ1' }], note: '' },
        Thu: { dishName: 'サーモンのムニエル', ingredients: [{ name: 'サーモン', amount: '2切れ' }, { name: 'バター', amount: '20g' }, { name: 'レモン', amount: '1/2個' }], note: '' },
        Fri: { dishName: '', ingredients: [], note: '外食' },
        Sat: { dishName: '肉じゃが', ingredients: [{ name: '牛薄切り肉', amount: '200g' }, { name: 'じゃがいも', amount: '3個' }, { name: '玉ねぎ', amount: '1個' }, { name: 'にんじん', amount: '1本' }], note: '' },
        Sun: { dishName: 'ナポリタン', ingredients: [{ name: 'スパゲッティ', amount: '200g' }, { name: 'ウインナー', amount: '4本' }, { name: 'ピーマン', amount: '2個' }, { name: 'ケチャップ', amount: '大さじ3' }], note: '' },
      },
    },
    {
      weekKey: week2,
      days: {
        Mon: { dishName: '唐揚げ', ingredients: [{ name: '鶏もも肉', amount: '500g' }, { name: '醤油', amount: '大さじ2' }, { name: 'にんにく', amount: '1かけ' }, { name: '片栗粉', amount: '適量' }], note: '' },
        Tue: { dishName: '豚汁定食', ingredients: [{ name: '豚バラ肉', amount: '150g' }, { name: 'ごぼう', amount: '1/2本' }, { name: '大根', amount: '1/4本' }, { name: 'こんにゃく', amount: '1/2枚' }], note: '' },
        Wed: { dishName: 'オムライス', ingredients: [{ name: '卵', amount: '3個' }, { name: 'ご飯', amount: '茶碗2杯' }, { name: '鶏もも肉', amount: '100g' }, { name: 'ケチャップ', amount: '大さじ3' }], note: '' },
        Thu: { dishName: '焼き魚（鯖）', ingredients: [{ name: '鯖', amount: '2切れ' }, { name: '塩', amount: '少々' }], note: '' },
        Fri: { dishName: 'ビーフシチュー', ingredients: [{ name: '牛すね肉', amount: '300g' }, { name: 'にんじん', amount: '1本' }, { name: '玉ねぎ', amount: '2個' }, { name: 'シチューのルー', amount: '1/2箱' }], note: '' },
        Sat: { dishName: '', ingredients: [], note: '外食' },
        Sun: { dishName: '餃子', ingredients: [{ name: '餃子の皮', amount: '30枚' }, { name: '豚ひき肉', amount: '200g' }, { name: 'キャベツ', amount: '1/4個' }, { name: 'ニラ', amount: '1束' }], note: '' },
      },
    },
  ];

  const dishes: DishRecord[] = [
    { id: 'seed-001', name: '豚の生姜焼き', ingredients: [{ name: '豚ロース', amount: '300g' }, { name: '玉ねぎ', amount: '1個' }, { name: '生姜', amount: '1かけ' }], updatedAt: new Date().toISOString() },
    { id: 'seed-002', name: 'チキンカレー', ingredients: [{ name: '鶏もも肉', amount: '400g' }, { name: 'じゃがいも', amount: '2個' }, { name: '玉ねぎ', amount: '2個' }, { name: 'カレールー', amount: '1/2箱' }], updatedAt: new Date().toISOString() },
    { id: 'seed-003', name: '麻婆豆腐', ingredients: [{ name: '豆腐', amount: '1丁' }, { name: '豚ひき肉', amount: '150g' }, { name: '長ねぎ', amount: '1本' }, { name: '豆板醤', amount: '小さじ1' }], updatedAt: new Date().toISOString() },
    { id: 'seed-004', name: '唐揚げ', ingredients: [{ name: '鶏もも肉', amount: '500g' }, { name: '醤油', amount: '大さじ2' }, { name: 'にんにく', amount: '1かけ' }, { name: '片栗粉', amount: '適量' }], updatedAt: new Date().toISOString() },
    { id: 'seed-005', name: '肉じゃが', ingredients: [{ name: '牛薄切り肉', amount: '200g' }, { name: 'じゃがいも', amount: '3個' }, { name: '玉ねぎ', amount: '1個' }, { name: 'にんじん', amount: '1本' }], updatedAt: new Date().toISOString() },
  ];

  const pairs: [string, string][] = [
    ['week_keys', JSON.stringify(weekMenus.map((m) => m.weekKey))],
    ...weekMenus.map((m): [string, string] => [`week_menu_${m.weekKey}`, JSON.stringify(m)]),
    ['dish_index', JSON.stringify(dishes.map((d) => d.id))],
    ...dishes.map((d): [string, string] => [`dish_${d.id}`, JSON.stringify(d)]),
  ];

  await AsyncStorage.multiSet(pairs);
}
