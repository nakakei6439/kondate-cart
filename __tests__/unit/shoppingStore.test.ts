import { useShoppingStore } from '../../src/store/shoppingStore';
import { WeekMenu } from '../../src/types';

function makeMenu(ingredients: { name: string; amount: string }[]): WeekMenu {
  return {
    weekKey: '2026-W09',
    days: {
      Mon: {
        dishes: [{ dishName: '料理', ingredients }],
        note: '',
      },
    },
  };
}

beforeEach(() => {
  useShoppingStore.setState({ items: [], mode: 'nextWeek' });
});

describe('shoppingStore', () => {
  it('generate 後 toggleItem → 再 generate でチェック保持', () => {
    const menu = makeMenu([{ name: '玉ねぎ', amount: '1個' }]);
    useShoppingStore.getState().generate([menu]);
    useShoppingStore.getState().toggleItem('玉ねぎ');
    useShoppingStore.getState().generate([menu]);

    const item = useShoppingStore.getState().items.find((i) => i.name === '玉ねぎ');
    expect(item?.checked).toBe(true);
  });

  it('forceGenerate でチェックリセット', () => {
    const menu = makeMenu([{ name: '玉ねぎ', amount: '1個' }]);
    useShoppingStore.getState().generate([menu]);
    useShoppingStore.getState().toggleItem('玉ねぎ');
    useShoppingStore.getState().forceGenerate([menu]);

    const item = useShoppingStore.getState().items.find((i) => i.name === '玉ねぎ');
    expect(item?.checked).toBe(false);
  });

  it('献立から消えた食材は再生成後に除去される', () => {
    const menu = makeMenu([{ name: '玉ねぎ', amount: '1個' }, { name: '人参', amount: '1本' }]);
    useShoppingStore.getState().generate([menu]);

    const menuWithout = makeMenu([{ name: '玉ねぎ', amount: '1個' }]);
    useShoppingStore.getState().generate([menuWithout]);

    const names = useShoppingStore.getState().items.map((i) => i.name);
    expect(names).not.toContain('人参');
    expect(names).toContain('玉ねぎ');
  });
});
