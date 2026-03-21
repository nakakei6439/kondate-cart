import { create } from 'zustand';
import { ShoppingItem, WeekMenu } from '../types';
import { aggregateIngredients } from '../utils/shoppingUtils';

type ShoppingMode = 'nextWeek' | 'twoWeeks';

interface ShoppingState {
  mode: ShoppingMode;
  items: ShoppingItem[];
  setMode: (mode: ShoppingMode) => void;
  generate: (menus: WeekMenu[]) => void;
  forceGenerate: (menus: WeekMenu[]) => void;
  addItem: (name: string, amount: string) => void;
  toggleItem: (name: string) => void;
  removeByName: (name: string) => void;
}

export const useShoppingStore = create<ShoppingState>((set) => ({
  mode: 'nextWeek',
  items: [],

  setMode: (mode) => set({ mode }),

  generate: (menus: WeekMenu[]) => {
    set((state) => {
      const newItems = aggregateIngredients(menus);
      const checkedNames = new Set(
        state.items.filter((i) => i.checked).map((i) => i.name)
      );
      return {
        items: newItems.map((item) => ({
          ...item,
          checked: checkedNames.has(item.name),
        })),
      };
    });
  },

  forceGenerate: (menus: WeekMenu[]) => {
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

}));
