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

type DummyDataSet = { weekMenus: { days: WeekMenu['days'] }[]; dishes: Omit<DishRecord, 'id' | 'updatedAt'>[] };

const DUMMY_DATA: Record<string, DummyDataSet> = {
  en: {
    weekMenus: [
      {
        days: {
          Mon: { dishes: [{ dishName: 'Pasta Bolognese', ingredients: [{ name: 'Ground beef', amount: '300g' }, { name: 'Onion', amount: '1' }, { name: 'Tomato sauce', amount: '1 can' }, { name: 'Pasta', amount: '200g' }] }], note: '' },
          Tue: { dishes: [{ dishName: 'Chicken Stir-fry', ingredients: [{ name: 'Chicken breast', amount: '400g' }, { name: 'Bell pepper', amount: '2' }, { name: 'Garlic', amount: '2 cloves' }, { name: 'Soy sauce', amount: '2 tbsp' }] }], note: '' },
          Wed: { dishes: [{ dishName: 'Caesar Salad', ingredients: [{ name: 'Romaine lettuce', amount: '1 head' }, { name: 'Parmesan', amount: '50g' }, { name: 'Croutons', amount: '1 cup' }, { name: 'Caesar dressing', amount: '3 tbsp' }] }], note: '' },
          Thu: { dishes: [{ dishName: 'Salmon Teriyaki', ingredients: [{ name: 'Salmon', amount: '2 fillets' }, { name: 'Teriyaki sauce', amount: '3 tbsp' }, { name: 'Sesame seeds', amount: '1 tsp' }] }], note: '' },
          Fri: { dishes: [], note: 'Eating out' },
          Sat: { dishes: [{ dishName: 'Beef Tacos', ingredients: [{ name: 'Ground beef', amount: '300g' }, { name: 'Tortillas', amount: '8' }, { name: 'Cheddar', amount: '100g' }, { name: 'Salsa', amount: '4 tbsp' }] }, { dishName: 'Guacamole', ingredients: [{ name: 'Avocado', amount: '2' }, { name: 'Lime', amount: '1' }, { name: 'Cilantro', amount: 'a little' }] }], note: '' },
          Sun: { dishes: [{ dishName: 'Vegetable Soup', ingredients: [{ name: 'Carrot', amount: '1' }, { name: 'Potato', amount: '2' }, { name: 'Onion', amount: '1' }, { name: 'Chicken broth', amount: '500ml' }] }], note: '' },
        },
      },
      {
        days: {
          Mon: { dishes: [{ dishName: 'Grilled Chicken', ingredients: [{ name: 'Chicken thigh', amount: '500g' }, { name: 'Olive oil', amount: '2 tbsp' }, { name: 'Garlic', amount: '2 cloves' }, { name: 'Rosemary', amount: 'a little' }] }], note: '' },
          Tue: { dishes: [{ dishName: 'Mushroom Risotto', ingredients: [{ name: 'Rice', amount: '200g' }, { name: 'Mushrooms', amount: '200g' }, { name: 'Onion', amount: '1' }, { name: 'Parmesan', amount: '50g' }] }], note: '' },
          Wed: { dishes: [{ dishName: 'Omelette', ingredients: [{ name: 'Eggs', amount: '3' }, { name: 'Butter', amount: '10g' }, { name: 'Cheese', amount: '30g' }, { name: 'Ham', amount: '2 slices' }] }], note: '' },
          Thu: { dishes: [{ dishName: 'Fish & Chips', ingredients: [{ name: 'White fish', amount: '2 fillets' }, { name: 'Potato', amount: '3' }, { name: 'Flour', amount: '100g' }, { name: 'Oil', amount: 'for frying' }] }], note: '' },
          Fri: { dishes: [{ dishName: 'Beef Stew', ingredients: [{ name: 'Beef', amount: '300g' }, { name: 'Carrot', amount: '1' }, { name: 'Potato', amount: '2' }, { name: 'Red wine', amount: '100ml' }] }], note: '' },
          Sat: { dishes: [], note: 'Eating out' },
          Sun: { dishes: [{ dishName: 'Pancakes', ingredients: [{ name: 'Flour', amount: '200g' }, { name: 'Eggs', amount: '2' }, { name: 'Milk', amount: '300ml' }, { name: 'Butter', amount: '20g' }] }], note: '' },
        },
      },
    ],
    dishes: [
      { name: 'Pasta Bolognese', ingredients: [{ name: 'Ground beef', amount: '300g' }, { name: 'Onion', amount: '1' }, { name: 'Tomato sauce', amount: '1 can' }, { name: 'Pasta', amount: '200g' }] },
      { name: 'Chicken Stir-fry', ingredients: [{ name: 'Chicken breast', amount: '400g' }, { name: 'Bell pepper', amount: '2' }, { name: 'Garlic', amount: '2 cloves' }, { name: 'Soy sauce', amount: '2 tbsp' }] },
      { name: 'Salmon Teriyaki', ingredients: [{ name: 'Salmon', amount: '2 fillets' }, { name: 'Teriyaki sauce', amount: '3 tbsp' }, { name: 'Sesame seeds', amount: '1 tsp' }] },
      { name: 'Beef Stew', ingredients: [{ name: 'Beef', amount: '300g' }, { name: 'Carrot', amount: '1' }, { name: 'Potato', amount: '2' }, { name: 'Red wine', amount: '100ml' }] },
      { name: 'Grilled Chicken', ingredients: [{ name: 'Chicken thigh', amount: '500g' }, { name: 'Olive oil', amount: '2 tbsp' }, { name: 'Garlic', amount: '2 cloves' }, { name: 'Rosemary', amount: 'a little' }] },
    ],
  },
  ko: {
    weekMenus: [
      {
        days: {
          Mon: { dishes: [{ dishName: '김치찌개', ingredients: [{ name: '김치', amount: '300g' }, { name: '돼지고기', amount: '200g' }, { name: '두부', amount: '1/2모' }, { name: '고춧가루', amount: '1큰술' }] }], note: '' },
          Tue: { dishes: [{ dishName: '불고기', ingredients: [{ name: '소고기', amount: '300g' }, { name: '간장', amount: '3큰술' }, { name: '설탕', amount: '1큰술' }, { name: '참기름', amount: '1큰술' }] }], note: '' },
          Wed: { dishes: [{ dishName: '비빔밥', ingredients: [{ name: '밥', amount: '2공기' }, { name: '시금치', amount: '100g' }, { name: '콩나물', amount: '100g' }, { name: '고추장', amount: '2큰술' }] }], note: '' },
          Thu: { dishes: [{ dishName: '된장찌개', ingredients: [{ name: '두부', amount: '1모' }, { name: '된장', amount: '2큰술' }, { name: '애호박', amount: '1/2개' }, { name: '감자', amount: '1개' }] }], note: '' },
          Fri: { dishes: [], note: '외식' },
          Sat: { dishes: [{ dishName: '삼겹살', ingredients: [{ name: '삼겹살', amount: '400g' }, { name: '쌈채소', amount: '1봉' }, { name: '쌈장', amount: '3큰술' }, { name: '마늘', amount: '10쪽' }] }, { dishName: '계란말이', ingredients: [{ name: '계란', amount: '3개' }, { name: '당근', amount: '1/4개' }, { name: '소금', amount: '약간' }] }], note: '' },
          Sun: { dishes: [{ dishName: '순두부찌개', ingredients: [{ name: '순두부', amount: '1봉' }, { name: '해물믹스', amount: '150g' }, { name: '고춧가루', amount: '1큰술' }, { name: '달걀', amount: '1개' }] }], note: '' },
        },
      },
      {
        days: {
          Mon: { dishes: [{ dishName: '제육볶음', ingredients: [{ name: '돼지고기', amount: '300g' }, { name: '고추장', amount: '2큰술' }, { name: '양파', amount: '1개' }, { name: '참기름', amount: '1큰술' }] }], note: '' },
          Tue: { dishes: [{ dishName: '잡채', ingredients: [{ name: '당면', amount: '150g' }, { name: '소고기', amount: '100g' }, { name: '시금치', amount: '100g' }, { name: '간장', amount: '3큰술' }] }], note: '' },
          Wed: { dishes: [{ dishName: '닭볶음탕', ingredients: [{ name: '닭', amount: '1마리' }, { name: '감자', amount: '2개' }, { name: '고추장', amount: '2큰술' }, { name: '간장', amount: '2큰술' }] }], note: '' },
          Thu: { dishes: [{ dishName: '해물파전', ingredients: [{ name: '부침가루', amount: '150g' }, { name: '해물믹스', amount: '200g' }, { name: '쪽파', amount: '1束' }, { name: '식용유', amount: '적당량' }] }], note: '' },
          Fri: { dishes: [{ dishName: '갈비찜', ingredients: [{ name: '갈비', amount: '500g' }, { name: '간장', amount: '4큰술' }, { name: '설탕', amount: '2큰술' }, { name: '무', amount: '200g' }] }], note: '' },
          Sat: { dishes: [], note: '외식' },
          Sun: { dishes: [{ dishName: '떡볶이', ingredients: [{ name: '떡', amount: '300g' }, { name: '고추장', amount: '3큰술' }, { name: '어묵', amount: '100g' }, { name: '대파', amount: '1대' }] }], note: '' },
        },
      },
    ],
    dishes: [
      { name: '김치찌개', ingredients: [{ name: '김치', amount: '300g' }, { name: '돼지고기', amount: '200g' }, { name: '두부', amount: '1/2모' }, { name: '고춧가루', amount: '1큰술' }] },
      { name: '불고기', ingredients: [{ name: '소고기', amount: '300g' }, { name: '간장', amount: '3큰술' }, { name: '설탕', amount: '1큰술' }, { name: '참기름', amount: '1큰술' }] },
      { name: '비빔밥', ingredients: [{ name: '밥', amount: '2공기' }, { name: '시금치', amount: '100g' }, { name: '콩나물', amount: '100g' }, { name: '고추장', amount: '2큰술' }] },
      { name: '삼겹살', ingredients: [{ name: '삼겹살', amount: '400g' }, { name: '쌈채소', amount: '1봉' }, { name: '쌈장', amount: '3큰술' }, { name: '마늘', amount: '10쪽' }] },
      { name: '제육볶음', ingredients: [{ name: '돼지고기', amount: '300g' }, { name: '고추장', amount: '2큰술' }, { name: '양파', amount: '1개' }, { name: '참기름', amount: '1큰술' }] },
    ],
  },
  zh: {
    weekMenus: [
      {
        days: {
          Mon: { dishes: [{ dishName: '宫保鸡丁', ingredients: [{ name: '鸡胸肉', amount: '300g' }, { name: '花生', amount: '50g' }, { name: '干辣椒', amount: '5个' }, { name: '酱油', amount: '2汤匙' }] }], note: '' },
          Tue: { dishes: [{ dishName: '麻婆豆腐', ingredients: [{ name: '豆腐', amount: '1块' }, { name: '猪肉末', amount: '150g' }, { name: '豆瓣酱', amount: '1汤匙' }, { name: '花椒', amount: '少量' }] }], note: '' },
          Wed: { dishes: [{ dishName: '西红柿炒鸡蛋', ingredients: [{ name: '西红柿', amount: '2个' }, { name: '鸡蛋', amount: '3个' }, { name: '盐', amount: '少量' }, { name: '食用油', amount: '适量' }] }], note: '' },
          Thu: { dishes: [{ dishName: '红烧肉', ingredients: [{ name: '五花肉', amount: '500g' }, { name: '酱油', amount: '3汤匙' }, { name: '冰糖', amount: '30g' }, { name: '八角', amount: '2个' }] }], note: '' },
          Fri: { dishes: [], note: '外出用餐' },
          Sat: { dishes: [{ dishName: '蛋炒饭', ingredients: [{ name: '米饭', amount: '2碗' }, { name: '鸡蛋', amount: '2个' }, { name: '葱', amount: '2根' }, { name: '酱油', amount: '1汤匙' }] }, { dishName: '紫菜蛋花汤', ingredients: [{ name: '紫菜', amount: '10g' }, { name: '鸡蛋', amount: '1个' }, { name: '香油', amount: '少量' }] }], note: '' },
          Sun: { dishes: [{ dishName: '饺子', ingredients: [{ name: '饺子皮', amount: '30张' }, { name: '猪肉末', amount: '200g' }, { name: '白菜', amount: '300g' }, { name: '姜', amount: '少量' }] }], note: '' },
        },
      },
      {
        days: {
          Mon: { dishes: [{ dishName: '糖醋里脊', ingredients: [{ name: '猪里脊', amount: '300g' }, { name: '醋', amount: '2汤匙' }, { name: '糖', amount: '2汤匙' }, { name: '番茄酱', amount: '2汤匙' }] }], note: '' },
          Tue: { dishes: [{ dishName: '鱼香肉丝', ingredients: [{ name: '猪肉', amount: '200g' }, { name: '木耳', amount: '50g' }, { name: '胡萝卜', amount: '1根' }, { name: '豆瓣酱', amount: '1汤匙' }] }], note: '' },
          Wed: { dishes: [{ dishName: '清蒸鱼', ingredients: [{ name: '鲈鱼', amount: '1条' }, { name: '姜', amount: '3片' }, { name: '葱', amount: '2根' }, { name: '蒸鱼豉油', amount: '2汤匙' }] }], note: '' },
          Thu: { dishes: [{ dishName: '炸酱面', ingredients: [{ name: '面条', amount: '200g' }, { name: '猪肉末', amount: '150g' }, { name: '黄酱', amount: '3汤匙' }, { name: '黄瓜', amount: '1根' }] }], note: '' },
          Fri: { dishes: [{ dishName: '排骨汤', ingredients: [{ name: '排骨', amount: '500g' }, { name: '玉米', amount: '1根' }, { name: '莲藕', amount: '200g' }, { name: '盐', amount: '少量' }] }], note: '' },
          Sat: { dishes: [], note: '外出用餐' },
          Sun: { dishes: [{ dishName: '煎饼', ingredients: [{ name: '面粉', amount: '200g' }, { name: '鸡蛋', amount: '2个' }, { name: '葱花', amount: '适量' }, { name: '豆腐乳', amount: '适量' }] }], note: '' },
        },
      },
    ],
    dishes: [
      { name: '宫保鸡丁', ingredients: [{ name: '鸡胸肉', amount: '300g' }, { name: '花生', amount: '50g' }, { name: '干辣椒', amount: '5个' }, { name: '酱油', amount: '2汤匙' }] },
      { name: '麻婆豆腐', ingredients: [{ name: '豆腐', amount: '1块' }, { name: '猪肉末', amount: '150g' }, { name: '豆瓣酱', amount: '1汤匙' }, { name: '花椒', amount: '少量' }] },
      { name: '西红柿炒鸡蛋', ingredients: [{ name: '西红柿', amount: '2个' }, { name: '鸡蛋', amount: '3个' }, { name: '盐', amount: '少量' }, { name: '食用油', amount: '适量' }] },
      { name: '红烧肉', ingredients: [{ name: '五花肉', amount: '500g' }, { name: '酱油', amount: '3汤匙' }, { name: '冰糖', amount: '30g' }, { name: '八角', amount: '2个' }] },
      { name: '饺子', ingredients: [{ name: '饺子皮', amount: '30张' }, { name: '猪肉末', amount: '200g' }, { name: '白菜', amount: '300g' }, { name: '姜', amount: '少量' }] },
    ],
  },
  es: {
    weekMenus: [
      {
        days: {
          Mon: { dishes: [{ dishName: 'Tacos de Pollo', ingredients: [{ name: 'Pollo', amount: '400g' }, { name: 'Tortillas', amount: '8' }, { name: 'Cebolla', amount: '1' }, { name: 'Cilantro', amount: 'un poco' }] }], note: '' },
          Tue: { dishes: [{ dishName: 'Arroz con Frijoles', ingredients: [{ name: 'Arroz', amount: '200g' }, { name: 'Frijoles negros', amount: '1 lata' }, { name: 'Ajo', amount: '2 dientes' }, { name: 'Comino', amount: '1 cdta' }] }], note: '' },
          Wed: { dishes: [{ dishName: 'Enchiladas', ingredients: [{ name: 'Tortillas', amount: '8' }, { name: 'Pollo desmenuzado', amount: '300g' }, { name: 'Salsa roja', amount: '200ml' }, { name: 'Queso', amount: '100g' }] }], note: '' },
          Thu: { dishes: [{ dishName: 'Sopa de Fideos', ingredients: [{ name: 'Fideos', amount: '200g' }, { name: 'Jitomate', amount: '2' }, { name: 'Caldo de pollo', amount: '500ml' }, { name: 'Ajo', amount: '2 dientes' }] }], note: '' },
          Fri: { dishes: [], note: 'Comer fuera' },
          Sat: { dishes: [{ dishName: 'Pozole', ingredients: [{ name: 'Maíz pozolero', amount: '300g' }, { name: 'Cerdo', amount: '400g' }, { name: 'Chile guajillo', amount: '3' }, { name: 'Orégano', amount: '1 cdta' }] }, { dishName: 'Guacamole', ingredients: [{ name: 'Aguacate', amount: '2' }, { name: 'Limón', amount: '1' }, { name: 'Cilantro', amount: 'un poco' }, { name: 'Chile', amount: '1' }] }], note: '' },
          Sun: { dishes: [{ dishName: 'Tamales', ingredients: [{ name: 'Masa de maíz', amount: '400g' }, { name: 'Cerdo', amount: '300g' }, { name: 'Chile rojo', amount: '4' }, { name: 'Manteca', amount: '100g' }] }], note: '' },
        },
      },
      {
        days: {
          Mon: { dishes: [{ dishName: 'Caldo de Res', ingredients: [{ name: 'Res', amount: '500g' }, { name: 'Zanahoria', amount: '2' }, { name: 'Chayote', amount: '1' }, { name: 'Elote', amount: '1' }] }], note: '' },
          Tue: { dishes: [{ dishName: 'Chiles Rellenos', ingredients: [{ name: 'Chile poblano', amount: '4' }, { name: 'Queso', amount: '200g' }, { name: 'Huevo', amount: '3' }, { name: 'Salsa de jitomate', amount: '200ml' }] }], note: '' },
          Wed: { dishes: [{ dishName: 'Quesadillas', ingredients: [{ name: 'Tortillas', amount: '4' }, { name: 'Queso', amount: '200g' }, { name: 'Champiñones', amount: '100g' }, { name: 'Epazote', amount: 'un poco' }] }], note: '' },
          Thu: { dishes: [{ dishName: 'Ceviche', ingredients: [{ name: 'Camarón', amount: '300g' }, { name: 'Limón', amount: '5' }, { name: 'Jitomate', amount: '2' }, { name: 'Pepino', amount: '1' }] }], note: '' },
          Fri: { dishes: [{ dishName: 'Mole con Pollo', ingredients: [{ name: 'Pollo', amount: '1 pieza' }, { name: 'Pasta de mole', amount: '200g' }, { name: 'Chocolate', amount: '30g' }, { name: 'Caldo', amount: '300ml' }] }], note: '' },
          Sat: { dishes: [], note: 'Comer fuera' },
          Sun: { dishes: [{ dishName: 'Huevos Rancheros', ingredients: [{ name: 'Huevos', amount: '4' }, { name: 'Tortillas', amount: '4' }, { name: 'Salsa ranchera', amount: '200ml' }, { name: 'Frijoles', amount: '1 taza' }] }], note: '' },
        },
      },
    ],
    dishes: [
      { name: 'Tacos de Pollo', ingredients: [{ name: 'Pollo', amount: '400g' }, { name: 'Tortillas', amount: '8' }, { name: 'Cebolla', amount: '1' }, { name: 'Cilantro', amount: 'un poco' }] },
      { name: 'Enchiladas', ingredients: [{ name: 'Tortillas', amount: '8' }, { name: 'Pollo desmenuzado', amount: '300g' }, { name: 'Salsa roja', amount: '200ml' }, { name: 'Queso', amount: '100g' }] },
      { name: 'Pozole', ingredients: [{ name: 'Maíz pozolero', amount: '300g' }, { name: 'Cerdo', amount: '400g' }, { name: 'Chile guajillo', amount: '3' }, { name: 'Orégano', amount: '1 cdta' }] },
      { name: 'Caldo de Res', ingredients: [{ name: 'Res', amount: '500g' }, { name: 'Zanahoria', amount: '2' }, { name: 'Chayote', amount: '1' }, { name: 'Elote', amount: '1' }] },
      { name: 'Mole con Pollo', ingredients: [{ name: 'Pollo', amount: '1 pieza' }, { name: 'Pasta de mole', amount: '200g' }, { name: 'Chocolate', amount: '30g' }, { name: 'Caldo', amount: '300ml' }] },
    ],
  },
  ja: {
    weekMenus: [
      {
        days: {
          Mon: { dishes: [{ dishName: '豚の生姜焼き', ingredients: [{ name: '豚ロース', amount: '300g' }, { name: '玉ねぎ', amount: '1個' }, { name: '生姜', amount: '1かけ' }] }], note: '' },
          Tue: { dishes: [{ dishName: 'チキンカレー', ingredients: [{ name: '鶏もも肉', amount: '400g' }, { name: 'じゃがいも', amount: '2個' }, { name: '玉ねぎ', amount: '2個' }, { name: 'カレールー', amount: '1/2箱' }] }], note: '' },
          Wed: { dishes: [{ dishName: '麻婆豆腐', ingredients: [{ name: '豆腐', amount: '1丁' }, { name: '豚ひき肉', amount: '150g' }, { name: '長ねぎ', amount: '1本' }, { name: '豆板醤', amount: '小さじ1' }] }], note: '' },
          Thu: { dishes: [{ dishName: 'サーモンのムニエル', ingredients: [{ name: 'サーモン', amount: '2切れ' }, { name: 'バター', amount: '20g' }, { name: 'レモン', amount: '1/2個' }] }], note: '' },
          Fri: { dishes: [], note: '外食' },
          Sat: { dishes: [{ dishName: '肉じゃが', ingredients: [{ name: '牛薄切り肉', amount: '200g' }, { name: 'じゃがいも', amount: '3個' }, { name: '玉ねぎ', amount: '1個' }, { name: 'にんじん', amount: '1本' }] }, { dishName: 'ほうれん草の胡麻和え', ingredients: [{ name: 'ほうれん草', amount: '1束' }, { name: '胡麻', amount: '大さじ2' }] }], note: '' },
          Sun: { dishes: [{ dishName: 'ナポリタン', ingredients: [{ name: 'スパゲッティ', amount: '200g' }, { name: 'ウインナー', amount: '4本' }, { name: 'ピーマン', amount: '2個' }, { name: 'ケチャップ', amount: '大さじ3' }] }], note: '' },
        },
      },
      {
        days: {
          Mon: { dishes: [{ dishName: '唐揚げ', ingredients: [{ name: '鶏もも肉', amount: '500g' }, { name: '醤油', amount: '大さじ2' }, { name: 'にんにく', amount: '1かけ' }, { name: '片栗粉', amount: '適量' }] }], note: '' },
          Tue: { dishes: [{ dishName: '豚汁定食', ingredients: [{ name: '豚バラ肉', amount: '150g' }, { name: 'ごぼう', amount: '1/2本' }, { name: '大根', amount: '1/4本' }, { name: 'こんにゃく', amount: '1/2枚' }] }], note: '' },
          Wed: { dishes: [{ dishName: 'オムライス', ingredients: [{ name: '卵', amount: '3個' }, { name: 'ご飯', amount: '茶碗2杯' }, { name: '鶏もも肉', amount: '100g' }, { name: 'ケチャップ', amount: '大さじ3' }] }], note: '' },
          Thu: { dishes: [{ dishName: '焼き魚（鯖）', ingredients: [{ name: '鯖', amount: '2切れ' }, { name: '塩', amount: '少々' }] }], note: '' },
          Fri: { dishes: [{ dishName: 'ビーフシチュー', ingredients: [{ name: '牛すね肉', amount: '300g' }, { name: 'にんじん', amount: '1本' }, { name: '玉ねぎ', amount: '2個' }, { name: 'シチューのルー', amount: '1/2箱' }] }], note: '' },
          Sat: { dishes: [], note: '外食' },
          Sun: { dishes: [{ dishName: '餃子', ingredients: [{ name: '餃子の皮', amount: '30枚' }, { name: '豚ひき肉', amount: '200g' }, { name: 'キャベツ', amount: '1/4個' }, { name: 'ニラ', amount: '1束' }] }], note: '' },
        },
      },
    ],
    dishes: [
      { name: '豚の生姜焼き', ingredients: [{ name: '豚ロース', amount: '300g' }, { name: '玉ねぎ', amount: '1個' }, { name: '生姜', amount: '1かけ' }] },
      { name: 'チキンカレー', ingredients: [{ name: '鶏もも肉', amount: '400g' }, { name: 'じゃがいも', amount: '2個' }, { name: '玉ねぎ', amount: '2個' }, { name: 'カレールー', amount: '1/2箱' }] },
      { name: '麻婆豆腐', ingredients: [{ name: '豆腐', amount: '1丁' }, { name: '豚ひき肉', amount: '150g' }, { name: '長ねぎ', amount: '1本' }, { name: '豆板醤', amount: '小さじ1' }] },
      { name: '唐揚げ', ingredients: [{ name: '鶏もも肉', amount: '500g' }, { name: '醤油', amount: '大さじ2' }, { name: 'にんにく', amount: '1かけ' }, { name: '片栗粉', amount: '適量' }] },
      { name: '肉じゃが', ingredients: [{ name: '牛薄切り肉', amount: '200g' }, { name: 'じゃがいも', amount: '3個' }, { name: '玉ねぎ', amount: '1個' }, { name: 'にんじん', amount: '1本' }] },
    ],
  },
};

export async function seedDummyData(lang: string = 'ja'): Promise<void> {
  const week1 = nextWeekKey(getCurrentWeekKey());
  const week2 = nextWeekKey(week1);

  const dataSet = DUMMY_DATA[lang] ?? DUMMY_DATA['ja'];
  const now = new Date().toISOString();

  const weekMenus: WeekMenu[] = [
    { weekKey: week1, days: dataSet.weekMenus[0].days },
    { weekKey: week2, days: dataSet.weekMenus[1].days },
  ];

  const dishes: DishRecord[] = dataSet.dishes.map((d, i) => ({
    id: `seed-${String(i + 1).padStart(3, '0')}`,
    name: d.name,
    ingredients: d.ingredients,
    updatedAt: now,
  }));

  const pairs: [string, string][] = [
    ['week_keys', JSON.stringify(weekMenus.map((m) => m.weekKey))],
    ...weekMenus.map((m): [string, string] => [`week_menu_${m.weekKey}`, JSON.stringify(m)]),
    ['dish_index', JSON.stringify(dishes.map((d) => d.id))],
    ...dishes.map((d): [string, string] => [`dish_${d.id}`, JSON.stringify(d)]),
  ];

  await AsyncStorage.multiSet(pairs);
}
