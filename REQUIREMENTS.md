# 要件定義書 — 献立カート

アプリ名: 献立カート / バージョン: 1.0.4 / フェーズ: App Store リリース済み

---

## 1. アプリ概要

夕食の献立を週単位で管理し、買い物リストを自動生成する iOS アプリ。
過去に作った料理を呼び出して材料を再利用・編集できる。

- **プラットフォーム**: iOS（React Native / Expo）
- **動作**: オフライン完全動作
- **収益モデル**: 無料 + IAP 広告削除 ¥300（フリーミアム）

---

## 2. 機能（3タブ）

### 共通 — 設定

- 全タブから設定モーダルを開ける（各タブのタイトル右上に歯車アイコン）
- **プレミアム購入** — 広告削除 IAP（¥300）の購入・復元
- **データ管理**
  - エクスポート: 全データ（献立・料理履歴）を JSON ファイルとして ShareSheet 経由で保存
  - インポート: バックアップ JSON を選択して上書き復元（確認アラートあり）
  - ※アプリ削除後もバックアップファイルが残れば再インストール後に復元可能
- **バージョン表示**: アプリバージョンとビルド番号を最下部に表示

### Tab 1 — 献立

- **デフォルト表示**: 来週（起動時に来週の週が選択されている）
- 1週間表示（月〜日）・前週/次週ナビ（制限なし、過去も閲覧可）
- **曜日行を左スワイプ** → その日の献立を削除
- 曜日タップ → 料理入力シート
  - **1日に複数の料理を登録可能**
  - 料理名フリー入力 **または** 過去の料理履歴から検索・選択
  - 材料リスト（名前＋量）を入力・その週用に編集可能
  - メモ欄（「外食」など）
  - **料理行を左スワイプ → 料理を削除**（複数登録時のみ）
  - 未保存で閉じようとすると保存確認ダイアログを表示
- 保存すると同名料理の材料が履歴に自動蓄積・更新される

### Tab 2 — 買い物リスト

- **来週** / **再来週まで** の切り替え（来週のみ / 来週＋再来週）
- 献立に登録した料理の材料を集計して一覧表示
- タップでチェック済みに（購入済みセクションに移動）
- 左スワイプで削除・手動でアイテムを追加可能
- 「再生成」ボタンで献立から再集計（無料ユーザーはインタースティシャル広告を表示）

### Tab 3 — 履歴

- 過去に登録した料理の一覧（今週・先週・今月・それ以前）
- 料理名で検索・絞り込み
- **左スワイプで削除**
- 各行タップ → 料理編集シート
  - 料理名・材料（名前＋量）の編集・追加・削除（材料行を左スワイプで削除）
  - 保存すると DishRecord が更新され、次回の献立入力「履歴から選択」にも反映される
  - **フッターの削除ボタン**で DishRecord を完全削除（確認アラートあり）

---

## 3. 収益化・広告

### IAP（アプリ内課金）

| 項目 | 値 |
| --- | --- |
| ライブラリ | react-native-purchases v9（RevenueCat） |
| 商品 | 広告削除 買い切り ¥300 |
| Entitlement ID | `Kondate Cart Premium` |
| 手取り | ¥210/件（Apple 手数料 30% 控除後） |

> IAP は Expo Go では動作しない。EAS Development Build が必要。

### AdMob 広告

| 項目 | 値 |
| --- | --- |
| ライブラリ | react-native-google-mobile-ads v16 |
| 表示条件 | `Kondate Cart Premium` 未購入ユーザーのみ |
| 広告種別 | インタースティシャル（買い物リスト再生成時） |

### ATT（App Tracking Transparency）

| 項目 | 値 |
| --- | --- |
| ライブラリ | expo-tracking-transparency |
| 表示タイミング | アプリ起動時・AdMob 初期化前 |
| `NSUserTrackingUsageDescription` | 「広告をパーソナライズするために使用します。」 |

---

## 4. データモデル

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

// 1日の1料理エントリ
interface DishEntry {
  dishName: string;
  ingredients: Ingredient[];  // DishRecord からコピー・週ごとに編集可
}

// 1日の献立（複数料理 + メモ）
interface DayRecord {
  dishes: DishEntry[];
  note: string;
}

// 1週間の献立
interface WeekMenu {
  weekKey: string;  // "2026-W09"
  days: Partial<Record<'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun', DayRecord>>;
}
```

---

## 5. 画面構成

```text
Bottom Tab（3タブ）
├── 献立    🍽️  — 週間カレンダー・料理入力・過去の閲覧
├── 買い物  🛒  — 来週〜再来週の材料リスト
└── 履歴    📋  — 料理履歴の閲覧・編集・削除
```

---

## 6. データ保存（AsyncStorage）

| キー | 内容 |
| --- | --- |
| `week_menu_{weekKey}` | WeekMenu JSON |
| `week_keys` | 保存済み週キー配列 |
| `dish_{id}` | DishRecord JSON |
| `dish_index` | 料理IDの配列 |

---

## 7. 技術スタック

| 項目 | ライブラリ / 選択 | 備考 |
| --- | --- | --- |
| フレームワーク | React Native（Expo managed） | SDK 54 |
| 言語 | TypeScript | — |
| ナビゲーション | Expo Router | ファイル名がそのままページになる |
| 状態管理 | Zustand v5 | 1ファイルで書けるシンプルな設計 |
| 永続化 | AsyncStorage v2 | オフライン動作・このサイズには十分 |
| 多言語対応 | i18next / react-i18next | 日・英・中・韓・西 の5言語 |
| 端末言語検出 | expo-localization | 起動時に端末ロケールを取得 |
| UI | React Native StyleSheet | 外部UIライブラリなし |
| IAP | react-native-purchases v9（RevenueCat） | Expo Go 非対応 |
| 広告 | react-native-google-mobile-ads v16 | Expo Go 非対応 |
| ATT | expo-tracking-transparency | ATT ダイアログ表示 |
| 同意管理 | GoogleUserMessagingPlatform（UMP） | EU 向け同意フロー |
| レビュー誘導 | expo-store-review | SKStoreReviewAPI |
| ファイル操作 | expo-file-system v19 | `expo-file-system/legacy` 経由で旧API使用 |
| 共有 | expo-sharing | iOS ShareSheet 経由でファイル共有 |
| ファイル選択 | expo-document-picker | JSON ファイルの選択・インポート |

---

## 8. フォルダ構成

```text
src/
├── types/index.ts
├── store/
│   ├── menuStore.ts         # 週間献立（Zustand）
│   ├── dishStore.ts         # 料理履歴（Zustand）
│   ├── shoppingStore.ts     # 買い物リスト（Zustand）
│   └── purchaseStore.ts     # IAP 購入状態（Zustand）
├── storage/
│   ├── menuStorage.ts       # AsyncStorage CRUD
│   ├── dishStorage.ts       # AsyncStorage CRUD
│   └── exportStorage.ts     # エクスポート／インポート・ダミーデータ生成
├── hooks/
│   ├── useInterstitialAd.ts # AdMob インタースティシャル制御
│   └── useReviewPrompt.ts   # アプリレビュープロンプト制御
├── i18n/
│   ├── index.ts             # i18next 初期化・端末言語検出
│   └── locales/             # ja / en / zh / ko / es
├── utils/
│   ├── weekUtils.ts         # weekKey・日付計算
│   └── shoppingUtils.ts     # 買い物リスト集計ロジック
└── components/              # 再利用コンポーネント（app/ 外に配置）
    ├── WeekCalendar.tsx
    ├── DayEntrySheet.tsx
    ├── DishEditSheet.tsx
    ├── SettingsModal.tsx
    └── ShoppingItem.tsx

app/                         # Expo Router（ファイル＝ページ）
├── _layout.tsx              # タブ定義（3タブ）+ AdMob/ATT/UMP 初期化
├── index.tsx                # 献立タブ
├── shopping.tsx             # 買い物リストタブ
└── history.tsx              # 履歴タブ
```

> **注意**: コンポーネントは `src/components/` に配置する。`app/` 直下に置くと Expo Router がルートとして認識し、余分なタブが増える。

---

## 9. 将来拡張案

- 先週の献立を一括コピー
- 買い物リストの共有（Share API）
- iCloud バックアップ
- ホーム画面ウィジェット
- Android 版対応
