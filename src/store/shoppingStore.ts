import { create } from 'zustand';
import { ShoppingItem, WeekMenu } from '../types';

type ShoppingMode = 'nextWeek' | 'twoWeeks';

interface ShoppingState {
  mode: ShoppingMode;
  items: ShoppingItem[];
  setMode: (mode: ShoppingMode) => void;
  generate: (menus: WeekMenu[]) => void;
  addItem: (name: string, amount: string) => void;
  toggleItem: (name: string) => void;
  removeByName: (name: string) => void;
  regenerate: (menus: WeekMenu[]) => void;
}

function aggregateIngredients(menus: WeekMenu[]): ShoppingItem[] {
  // 同名食材の量をまとめる（カンマ区切り）
  const map = new Map<string, string[]>();

  for (const menu of menus) {
    for (const dayEntry of Object.values(menu.days)) {
      if (!dayEntry) continue;
      for (const ing of dayEntry.ingredients) {
        const name = ing.name.trim();
        if (!name) continue;
        const existing = map.get(name) ?? [];
        existing.push(ing.amount);
        map.set(name, existing);
      }
    }
  }

  return Array.from(map.entries()).map(([name, amounts]) => ({
    name,
    amount: amounts.filter((a) => a.trim()).join('、'),
    checked: false,
  }));
}

export const useShoppingStore = create<ShoppingState>((set) => ({
  mode: 'nextWeek',
  items: [],

  setMode: (mode) => set({ mode }),

  generate: (menus: WeekMenu[]) => {
    const items = aggregateIngredients(menus);
    set({ items });
  },

  addItem: (name: string, amount: string) => {
    set((state) => ({
      items: [{ name, amount, checked: false }, ...state.items],
    }));
  },

  toggleItem: (name: string) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.name === name ? { ...item, checked: !item.checked } : item
      ),
    }));
  },

  removeByName: (name: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.name !== name),
    }));
  },

  regenerate: (menus: WeekMenu[]) => {
    const items = aggregateIngredients(menus);
    set({ items });
  },
}));
