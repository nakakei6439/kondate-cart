# 開発フロー

## 前提

- Node.js 20+ インストール済み
- Xcode インストール済み（iOS シミュレーター使用）
- `npx expo` コマンドが使える状態

---

## ステップ 1: 環境セットアップ

```bash
# パッケージ追加
npx expo install expo-router zustand @react-native-async-storage/async-storage expo-crypto

# app.json に追記（Expo Router 有効化）
# "scheme": "menu" を main セクションに追加
```

---

## ステップ 2: 型定義

`src/types/index.ts` に Ingredient / DishRecord / DayEntry / WeekMenu を定義。
→ REQUIREMENTS.md の「3. データモデル」をそのままコピー。

---

## ステップ 3: Storage 層

`src/storage/dishStorage.ts` — DishRecord の CRUD
`src/storage/menuStorage.ts` — WeekMenu の CRUD

```typescript
// 例: dishStorage.ts
export const saveDish = async (dish: DishRecord) => { ... }
export const loadAllDishes = async (): Promise<DishRecord[]> => { ... }
```

---

## ステップ 4: Zustand Store

`src/store/dishStore.ts`
`src/store/menuStore.ts`
`src/store/shoppingStore.ts`

```typescript
// 例: dishStore.ts
const useDishStore = create<DishState>((set) => ({
  dishes: [],
  loadDishes: async () => { ... },
  saveDish: async (dish) => { ... },
}))
```

---

## ステップ 5: ユーティリティ

`src/utils/weekUtils.ts`

```typescript
getWeekKey(date: Date): string      // → "2026-W09"
getWeekDates(weekKey: string): Date[] // 月〜日の7日分
formatDate(date: Date): string      // → "2/23(月)"
```

---

## ステップ 6: Expo Router 画面

```
app/
├── _layout.tsx         # <Tabs> でタブ定義
├── index.tsx           # 献立画面
└── shopping.tsx        # 買い物リスト画面
```

**実装順序**

1. `_layout.tsx` — タブ2本の骨格を作る
2. `index.tsx` — 週カレンダー表示（スタブデータで確認）
3. `shopping.tsx` — 材料リスト表示（スタブデータで確認）
4. `DayEntrySheet.tsx` — 料理入力ボトムシート
5. Store と画面を接続 → 実データで動作確認

---

## ステップ 7: 動作確認

```bash
npx expo start --ios
```

確認項目：
- [ ] 週カレンダーが表示される
- [ ] 曜日タップでボトムシートが開く
- [ ] 過去の料理を選択すると材料が入力される
- [ ] 買い物リストに材料が集計される
- [ ] 「再生成」で削除した材料が戻る
- [ ] アプリ再起動後もデータが保持されている
