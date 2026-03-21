import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadAllDishes, saveDish, deleteDish } from '../../src/storage/dishStorage';
import { DishRecord } from '../../src/types';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

function makeDish(id: string, name: string, updatedAt: string): DishRecord {
  return { id, name, ingredients: [], updatedAt };
}

describe('dishStorage', () => {
  it('saveDish → loadAllDishes で取得', async () => {
    const dish = makeDish('d1', 'カレー', '2026-03-01T00:00:00.000Z');
    await saveDish(dish);
    const result = await loadAllDishes();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('カレー');
  });

  it('空状態は空配列', async () => {
    const result = await loadAllDishes();
    expect(result).toEqual([]);
  });

  it('複数保存・取得', async () => {
    await saveDish(makeDish('d1', '肉じゃが', '2026-03-01T00:00:00.000Z'));
    await saveDish(makeDish('d2', '唐揚げ', '2026-03-02T00:00:00.000Z'));
    const result = await loadAllDishes();
    expect(result).toHaveLength(2);
  });

  it('deleteDish でデータ削除', async () => {
    const dish = makeDish('d1', 'カレー', '2026-03-01T00:00:00.000Z');
    await saveDish(dish);
    await deleteDish('d1');
    const result = await loadAllDishes();
    expect(result).toHaveLength(0);
  });

  it('dish_index から ID 削除', async () => {
    await saveDish(makeDish('d1', 'カレー', '2026-03-01T00:00:00.000Z'));
    await deleteDish('d1');
    const raw = await AsyncStorage.getItem('dish_index');
    const ids: string[] = JSON.parse(raw!);
    expect(ids).not.toContain('d1');
  });

  it('updatedAt 降順ソート', async () => {
    await saveDish(makeDish('d1', '古い料理', '2026-01-01T00:00:00.000Z'));
    await saveDish(makeDish('d2', '新しい料理', '2026-03-01T00:00:00.000Z'));
    const result = await loadAllDishes();
    expect(result[0].name).toBe('新しい料理');
    expect(result[1].name).toBe('古い料理');
  });
});
