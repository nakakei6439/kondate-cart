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

// 1料理分のデータ（主菜・副菜など）
export interface DishEntry {
  dishName: string;
  ingredients: Ingredient[];
}

// 1日の献立（複数料理 + 日単位メモ）
export interface DayRecord {
  dishes: DishEntry[];
  note: string;
}

export type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

// 1週間の献立
export interface WeekMenu {
  weekKey: string; // "2026-W09"
  days: Partial<Record<DayKey, DayRecord>>;
}

export interface ShoppingItem {
  name: string;
  amount: string;
  checked: boolean;
}
