export interface Ingredient {
  name: string;   // "玉ねぎ"
  amount: string; // "2個"
}

// 過去の料理履歴（献立入力時の選択候補）
export interface DishRecord {
  id: string;
  name: string;
  ingredients: Ingredient[];
  updatedAt: string;
}

// 1日の献立
export interface DayEntry {
  dishName: string;
  ingredients: Ingredient[]; // DishRecord からコピー・週ごとに編集可
  note: string;
}

export type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

// 1週間の献立
export interface WeekMenu {
  weekKey: string; // "2026-W09"
  days: Partial<Record<DayKey, DayEntry>>;
}

export interface ShoppingItem {
  name: string;
  amount: string;
}
