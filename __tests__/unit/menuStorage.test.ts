import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadWeekMenu, saveWeekMenu } from '../../src/storage/menuStorage';
import { WeekMenu } from '../../src/types';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

const sampleMenu: WeekMenu = {
  weekKey: '2026-W09',
  days: {
    Mon: {
      dishes: [{ dishName: 'カレー', ingredients: [{ name: '玉ねぎ', amount: '1個' }] }],
      note: 'メモ',
    },
  },
};

describe('menuStorage', () => {
  it('save → load でデータ取得', async () => {
    await saveWeekMenu(sampleMenu);
    const result = await loadWeekMenu('2026-W09');
    expect(result?.weekKey).toBe('2026-W09');
    expect(result?.days.Mon?.dishes[0].dishName).toBe('カレー');
  });

  it('存在しない weekKey は null を返す', async () => {
    const result = await loadWeekMenu('2026-W99');
    expect(result).toBeNull();
  });

  it('week_keys インデックスに追加される', async () => {
    await saveWeekMenu(sampleMenu);
    const raw = await AsyncStorage.getItem('week_keys');
    const keys: string[] = JSON.parse(raw!);
    expect(keys).toContain('2026-W09');
  });

  it('同一 weekKey を2回 save しても week_keys に重複しない', async () => {
    await saveWeekMenu(sampleMenu);
    await saveWeekMenu(sampleMenu);
    const raw = await AsyncStorage.getItem('week_keys');
    const keys: string[] = JSON.parse(raw!);
    expect(keys.filter((k) => k === '2026-W09')).toHaveLength(1);
  });

  it('旧 DayEntry 形式（dishName + note）を新 DayRecord 形式に自動移行', async () => {
    const oldFormat = {
      weekKey: '2026-W08',
      days: {
        Mon: { dishName: '煮物', ingredients: [{ name: '大根', amount: '1/2本' }], note: '古いメモ' },
      },
    };
    await AsyncStorage.setItem('week_menu_2026-W08', JSON.stringify(oldFormat));
    const result = await loadWeekMenu('2026-W08');
    expect(result?.days.Mon?.dishes[0].dishName).toBe('煮物');
    expect(result?.days.Mon?.note).toBe('古いメモ');
  });
});
