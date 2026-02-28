import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { DishRecord, Ingredient } from '../types';
import { loadAllDishes, saveDish, deleteDish as deleteDishStorage } from '../storage/dishStorage';

interface DishState {
  dishes: DishRecord[];
  initialized: boolean;
  loadDishes: () => Promise<void>;
  upsertDish: (name: string, ingredients: Ingredient[]) => Promise<void>;
  updateDish: (id: string, name: string, ingredients: Ingredient[]) => Promise<void>;
  deleteDish: (id: string) => Promise<void>;
}

export const useDishStore = create<DishState>((set, get) => ({
  dishes: [],
  initialized: false,

  loadDishes: async () => {
    const dishes = await loadAllDishes();
    set({ dishes, initialized: true });
  },

  upsertDish: async (name: string, ingredients: Ingredient[]) => {
    const { dishes } = get();
    const existing = dishes.find((d) => d.name === name);

    const dish: DishRecord = existing
      ? { ...existing, ingredients, updatedAt: new Date().toISOString() }
      : {
          id: await Crypto.randomUUID(),
          name,
          ingredients,
          updatedAt: new Date().toISOString(),
        };

    await saveDish(dish);

    set((state) => {
      if (existing) {
        return {
          dishes: state.dishes.map((d) => (d.id === dish.id ? dish : d)),
        };
      }
      return { dishes: [dish, ...state.dishes] };
    });
  },

  updateDish: async (id: string, name: string, ingredients: Ingredient[]) => {
    const { dishes } = get();
    const existing = dishes.find((d) => d.id === id);
    if (!existing) return;

    const updated: DishRecord = {
      ...existing,
      name,
      ingredients,
      updatedAt: new Date().toISOString(),
    };
    await saveDish(updated);
    set((state) => ({
      dishes: state.dishes.map((d) => (d.id === id ? updated : d)),
    }));
  },

  deleteDish: async (id: string) => {
    await deleteDishStorage(id);
    set((state) => ({
      dishes: state.dishes.filter((d) => d.id !== id),
    }));
  },
}));
