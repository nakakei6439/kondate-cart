import { ShoppingItem, WeekMenu } from '../types';

/** 複数週の献立から食材を集計して買い物リストを生成する */
export function aggregateIngredients(menus: WeekMenu[]): ShoppingItem[] {
  // 同名食材の量をまとめる（「、」区切り）
  const map = new Map<string, string[]>();

  for (const menu of menus) {
    for (const dayRecord of Object.values(menu.days)) {
      if (!dayRecord) continue;
      for (const dish of dayRecord.dishes) {
        for (const ing of dish.ingredients) {
          const name = ing.name.trim();
          if (!name) continue;
          const existing = map.get(name) ?? [];
          existing.push(ing.amount);
          map.set(name, existing);
        }
      }
    }
  }

  return Array.from(map.entries()).map(([name, amounts]) => ({
    name,
    amount: amounts.filter((a) => a.trim()).join('、'),
    checked: false,
  }));
}
