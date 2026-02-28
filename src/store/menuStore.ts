import { create } from 'zustand';
import { DayEntry, DayKey, WeekMenu } from '../types';
import { loadWeekMenu, saveWeekMenu } from '../storage/menuStorage';
import { getCurrentWeekKey, nextWeekKey } from '../utils/weekUtils';

interface MenuState {
  weekKey: string;
  weekMenu: WeekMenu | null;
  loadWeekMenu: (key: string) => Promise<void>;
  saveDayEntry: (day: DayKey, entry: DayEntry) => Promise<void>;
  clearDayEntry: (day: DayKey) => Promise<void>;
  clearWeekMenu: () => Promise<void>;
  setWeekKey: (key: string) => void;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  // デフォルトは来週（買い物計画は来週分を先に立てるため）
  weekKey: nextWeekKey(getCurrentWeekKey()),
  weekMenu: null,

  setWeekKey: (key: string) => {
    set({ weekKey: key, weekMenu: null });
  },

  loadWeekMenu: async (key: string) => {
    const menu = await loadWeekMenu(key);
    set({ weekMenu: menu ?? { weekKey: key, days: {} } });
  },

  saveDayEntry: async (day: DayKey, entry: DayEntry) => {
    const { weekKey, weekMenu } = get();
    const current = weekMenu ?? { weekKey, days: {} };
    const updated: WeekMenu = {
      ...current,
      days: { ...current.days, [day]: entry },
    };
    await saveWeekMenu(updated);
    set({ weekMenu: updated });
  },

  clearDayEntry: async (day: DayKey) => {
    const { weekKey, weekMenu } = get();
    const current = weekMenu ?? { weekKey, days: {} };
    const { [day]: _removed, ...rest } = current.days;
    const updated: WeekMenu = { ...current, days: rest };
    await saveWeekMenu(updated);
    set({ weekMenu: updated });
  },

  clearWeekMenu: async () => {
    const { weekKey } = get();
    const updated: WeekMenu = { weekKey, days: {} };
    await saveWeekMenu(updated);
    set({ weekMenu: updated });
  },
}));
