import { aggregateIngredients } from '../../src/utils/shoppingUtils';
import { WeekMenu } from '../../src/types';

function makeMenu(weekKey: string, dishes: { name: string; ings: { name: string; amount: string }[] }[]): WeekMenu {
  return {
    weekKey,
    days: {
      Mon: {
        dishes: dishes.map((d) => ({
          dishName: d.name,
          ingredients: d.ings.map((i) => ({ name: i.name, amount: i.amount })),
        })),
        note: '',
      },
    },
  };
}

describe('aggregateIngredients', () => {
  it('空の WeekMenu → 空配列', () => {
    const menu: WeekMenu = { weekKey: '2026-W09', days: {} };
    expect(aggregateIngredients([menu])).toEqual([]);
  });

  it('単一食材の集計', () => {
    const menu = makeMenu('2026-W09', [{ name: '鍋', ings: [{ name: '白菜', amount: '1/4株' }] }]);
    const result = aggregateIngredients([menu]);
    expect(result).toEqual([{ name: '白菜', amount: '1/4株', checked: false }]);
  });

  it('同名食材の量を「、」で結合', () => {
    const menu = makeMenu('2026-W09', [
      { name: '料理A', ings: [{ name: '卵', amount: '2個' }] },
      { name: '料理B', ings: [{ name: '卵', amount: '3個' }] },
    ]);
    const result = aggregateIngredients([menu]);
    expect(result).toEqual([{ name: '卵', amount: '2個、3個', checked: false }]);
  });

  it('量が空文字の food はフィルタされる', () => {
    const menu = makeMenu('2026-W09', [
      { name: '料理A', ings: [{ name: '豆腐', amount: '' }, { name: '豆腐', amount: '1丁' }] },
    ]);
    const result = aggregateIngredients([menu]);
    expect(result).toEqual([{ name: '豆腐', amount: '1丁', checked: false }]);
  });

  it('食材名が空白のみ → 無視', () => {
    const menu = makeMenu('2026-W09', [
      { name: '料理A', ings: [{ name: '   ', amount: '1個' }] },
    ]);
    expect(aggregateIngredients([menu])).toEqual([]);
  });

  it('複数週をまたいだ集計', () => {
    const menu1 = makeMenu('2026-W09', [{ name: '料理A', ings: [{ name: '玉ねぎ', amount: '1個' }] }]);
    const menu2 = makeMenu('2026-W10', [{ name: '料理B', ings: [{ name: '玉ねぎ', amount: '2個' }] }]);
    const result = aggregateIngredients([menu1, menu2]);
    expect(result).toEqual([{ name: '玉ねぎ', amount: '1個、2個', checked: false }]);
  });

  it('checked が全て false で初期化される', () => {
    const menu = makeMenu('2026-W09', [{ name: '料理A', ings: [{ name: '塩', amount: '少々' }] }]);
    const result = aggregateIngredients([menu]);
    expect(result.every((i) => i.checked === false)).toBe(true);
  });
});
