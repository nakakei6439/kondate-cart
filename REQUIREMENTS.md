# 献立管理アプリ 要件定義（MVP）

## 1. アプリ概要

夕食の献立を週単位で管理し、買い物リストを自動生成するiOSアプリ。
過去に作った料理を呼び出して材料を再利用・編集できる。

- **プラットフォーム**: iOS（React Native / Expo）
- **動作**: オフライン完全動作

---

## 2. 機能（3タブ）

### Tab 1 — 献立

- **デフォルト表示**: 来週（起動時に来週の週が選択されている）
- 1週間表示（月〜日）・前週/次週ナビ（制限なし、過去も閲覧可）
- 曜日タップ → 料理入力シート
  - 料理名フリー入力 **または** 過去の料理履歴から検索・選択
  - 材料リスト（名前＋量）を入力・その週用に編集可能
  - メモ欄（「外食」など）
  - 未保存で閉じようとすると保存確認ダイアログを表示
- 保存すると同名料理の材料が履歴に自動蓄積・更新される

### Tab 2 — 買い物リスト

- **来週** / **再来週まで** の切り替え（来週のみ / 来週＋再来週）
- 献立に登録した料理の材料を集計して一覧表示
- 不要な行を手動削除 ＋「再生成」でリセット

### Tab 3 — 履歴

- 過去に登録した料理の一覧（新しい順）
- 各行タップ → 料理編集シート
  - 料理名・材料（名前＋量）の編集・追加・削除
  - 保存すると DishRecord が更新され、次回の献立入力「履歴から選択」にも反映される
  - 削除ボタンで DishRecord を完全削除

---

## 3. データモデル

```typescript
interface Ingredient {
  name: string;    // "玉ねぎ"
  amount: string;  // "2個"
}

// 過去の料理履歴（献立入力時の選択候補）
interface DishRecord {
  id: string;
  name: string;
  ingredients: Ingredient[];
  updatedAt: string;
}

// 1日の献立
interface DayEntry {
  dishName: string;
  ingredients: Ingredient[];  // DishRecord からコピー・週ごとに編集可
  note: string;
}

// 1週間の献立
interface WeekMenu {
  weekKey: string;  // "2026-W09"
  days: Partial<Record<'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun', DayEntry>>;
}
```

---

## 4. 画面構成

```
Bottom Tab（3タブ）
├── 献立    🍽️  — 週間カレンダー・料理入力・過去の閲覧
├── 買い物  🛒  — 来週〜再来週の材料リスト
└── 履歴    📋  — 料理履歴の閲覧・編集・削除
```

---

## 5. データ保存（AsyncStorage）

| キー | 内容 |
|------|------|
| `week_menu_{weekKey}` | WeekMenu JSON |
| `week_keys` | 保存済み週キー配列 |
| `dish_{id}` | DishRecord JSON |
| `dish_index` | 料理IDの配列 |

---

## 6. 技術スタック

| 項目 | 選択 | 備考 |
|------|------|------|
| フレームワーク | React Native（Expo managed） | — |
| 言語 | TypeScript | — |
| ナビゲーション | **Expo Router** | Expoに標準搭載。ファイル名がそのままページになり設定が少ない |
| 状態管理 | **Zustand** | 1ファイルで書けるシンプルな状態管理 |
| 永続化 | AsyncStorage | オフライン動作・このサイズには十分 |
| UI | React Native StyleSheet | 外部UIライブラリなし |

---

## 7. フォルダ構成

```
src/
├── types/index.ts
├── store/
│   ├── menuStore.ts        # 週間献立（Zustand）
│   ├── dishStore.ts        # 料理履歴（Zustand）
│   └── shoppingStore.ts    # 買い物リスト（Zustand）
├── storage/
│   ├── menuStorage.ts      # AsyncStorage CRUD
│   └── dishStorage.ts      # AsyncStorage CRUD
├── utils/weekUtils.ts      # weekKey・日付計算
└── components/             # 再利用コンポーネント（app/ 外に配置）
    ├── WeekCalendar.tsx
    ├── DayEntrySheet.tsx
    ├── DishEditSheet.tsx
    └── ShoppingItem.tsx

app/                        # Expo Router（ファイル＝ページ）
├── _layout.tsx             # タブ定義（3タブ）
├── index.tsx               # 献立タブ
├── shopping.tsx            # 買い物リストタブ
└── history.tsx             # 履歴タブ
```

> **注意**: コンポーネントは `src/components/` に配置する。`app/` 直下に置くと Expo Router がルートとして認識し、余分なタブが増える。

---

## 8. 将来拡張案

- 先週の献立を一括コピー
- 買い物リストの共有（Share API）
- iCloud バックアップ
