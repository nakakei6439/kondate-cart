# 開発ガイド — 献立カート

環境構築・開発ステップ・設定値・ビルド手順をまとめたリファレンス。

---

## アプリ基本情報

| 項目 | 値 |
| --- | --- |
| アプリ名 | 献立カート |
| Bundle ID | `com.nakakei6439.kondatecart` |
| Expo SDK | 54 |
| React Native | 0.81.5 |
| Version | 1.0.1 / Build 10 |
| Apple Team ID | 5Z6T9SM259 |
| EAS Project ID | `09de0c14-0ba0-48e3-b88e-75ba1a52a4c4` |

---

## 環境セットアップ

```bash
export PATH="/Users/nakagawakeita/node-bin/bin:$PATH"
cd "/Users/nakagawakeita/Products/APP/KondateCart/KondateCartapp"

# パッケージインストール（legacy-peer-deps が必要）
npm install --legacy-peer-deps
```

| 項目 | 値 |
| --- | --- |
| Node.js PATH | `/Users/nakagawakeita/node-bin/bin` |
| npm install | `--legacy-peer-deps` が必要 |
| EAS profile | `development` / `preview` / `production` |

---

## 開発ステップ

### ステップ 1 — 型定義

`src/types/index.ts` に Ingredient / DishRecord / DayEntry / WeekMenu を定義。
→ REQUIREMENTS.md の「4. データモデル」を参照。

### ステップ 2 — Storage 層

- `src/storage/dishStorage.ts` — DishRecord の CRUD（saveDish / loadAllDishes / deleteDish）
- `src/storage/menuStorage.ts` — WeekMenu の CRUD
- `src/storage/exportStorage.ts` — エクスポート／インポート（exportData / importData）・ダミーデータ生成（seedDummyData）

> **注意**: `expo-file-system` v19 から旧API（`FileSystem.writeAsStringAsync` 等）は `expo-file-system/legacy` 経由で使用する。`expo-file-system` から直接インポートすると `cacheDirectory` や `EncodingType` が見つからずエラーになる。

### ステップ 3 — Zustand Store

- `src/store/dishStore.ts` — dishes, loadDishes, upsertDish, updateDish, deleteDish
- `src/store/menuStore.ts` — weekKey（デフォルト: 来週）, weekMenu, setWeekKey, loadWeekMenu, saveDayEntry, clearDayEntry
- `src/store/shoppingStore.ts` — mode('nextWeek'|'twoWeeks'), items, setMode, generate, removeItem
- `src/store/purchaseStore.ts` — isPremium, checkPurchaseStatus

### ステップ 4 — ユーティリティ

`src/utils/weekUtils.ts`

```typescript
getWeekKey(date: Date): string         // → "2026-W09"
getCurrentWeekKey(): string
getWeekDates(weekKey: string): Date[]  // 月〜日の7日分
formatWeekTitle(weekKey: string): string
prevWeekKey(key: string): string
nextWeekKey(key: string): string
```

### ステップ 5 — コンポーネント（src/components/）

> **重要**: コンポーネントは `app/` 外の `src/components/` に配置する。
> `app/` 直下に置くと Expo Router がルートとして認識し、余分なタブが増える。

- `WeekCalendar.tsx` — 週間カレンダーグリッド
- `DayEntrySheet.tsx` — 料理入力ボトムシート（KeyboardAvoidingView・未保存確認ダイアログ）
- `DishEditSheet.tsx` — 料理履歴編集ボトムシート（名前・材料の編集）
- `SettingsModal.tsx` — 設定モーダル
- `ShoppingItem.tsx` — 買い物リスト行コンポーネント

### ステップ 6 — Expo Router 画面（app/）

```text
app/
├── _layout.tsx     # GestureHandlerRootView + <Tabs> 3本
├── index.tsx       # 献立画面（デフォルト来週表示）
├── shopping.tsx    # 買い物リスト（来週/再来週 切り替え）
└── history.tsx     # 履歴画面（料理履歴の閲覧・編集・削除）
```

`_layout.tsx` のポイント:

- `GestureHandlerRootView` で全体をラップ（必須）
- `headerShown: false` を設定

---

## 起動・動作確認（Expo Go）

```bash
export PATH="/Users/nakagawakeita/node-bin/bin:$PATH"
npx expo start
```

iPhone の Expo Go で QR コードをスキャン。

> **注意**: IAP・AdMob は Expo Go では動作しない。テストは EAS Development Build を使う。

確認項目:

- [ ] タブが3本（献立・買い物・履歴）だけ表示される
- [ ] 起動時に来週の週が表示される
- [ ] 曜日タップでボトムシートが開く
- [ ] キーボードが出ても入力欄が見える
- [ ] 保存せず閉じようとすると確認ダイアログが出る
- [ ] 過去の料理を選択すると材料が入力される
- [ ] 買い物タブが来週/再来週の切り替えになっている
- [ ] 履歴タブで料理の名前・材料を編集・保存できる
- [ ] 履歴タブで削除できる
- [ ] アプリ再起動後もデータが保持されている

---

## IAP 設定（RevenueCat）

| 項目 | 値 |
| --- | --- |
| ライブラリ | react-native-purchases v9.11.2 |
| 商品 | 広告削除 買い切り ¥300 |
| Entitlement ID | `Kondate Cart Premium` |

EAS Development Build でテスト:

```bash
export PATH="/Users/nakagawakeita/node-bin/bin:$PATH"

# Development Build をビルドして実機インストール
eas build --profile development --platform ios --local

# ビルド完了後、dev-client で起動
npx expo start --dev-client
```

トラブル時は [decisions.md](decisions.md) の「IAP トラブルシューティング」セクションを参照。

---

## 広告（AdMob）設定

| 項目 | 値 |
| --- | --- |
| ライブラリ | react-native-google-mobile-ads v16 |
| 表示条件 | `Kondate Cart Premium` 未購入ユーザーのみ |
| 広告種別 | インタースティシャル（画面遷移時） |
| ATT ライブラリ | expo-tracking-transparency |
| `NSUserTrackingUsageDescription` | 「広告をパーソナライズするために使用します。」 |
| testDeviceIdentifiers | Xcode コンソールの `To get test ads on this device...` のハッシュ値 |
| iOS App ID | `ca-app-pub-6037843763000573~3751863813` |

ATT はアプリ起動時・AdMob 初期化前に許可リクエストを表示すること。

---

## TestFlight / App Store 提出

```bash
# ビルド番号を更新（EAS がリモート管理 — app.json は無視される）
eas build:version:set --platform ios

# Preview（TestFlight 用）— ローカルビルド
eas build --profile preview --platform ios --local

# TestFlight にアップロード（App用パスワードが必要）
xcrun altool --upload-app --type ios \
  --file build-*.ipa \
  --username <Apple ID> \
  --password <App用パスワード>

# Production（App Store 提出用）
eas build --profile production --platform ios --local
eas submit --platform ios --path build-*.ipa
```

> **App用パスワード**: appleid.apple.com →「サインインとセキュリティ」→「App用パスワード」で生成。
> 通常の Apple ID パスワードは使用不可。

---

## 注意事項

- コンポーネントは `src/components/` に配置する（`app/` 直下は Expo Router がルートとして認識する）
- `GestureHandlerRootView` で `_layout.tsx` 全体をラップすること
- IAP・AdMob は Expo Go では動作しない（EAS Development Build 必須）
- `expo-file-system` v19 では旧APIが廃止済み。`import * as FileSystem from 'expo-file-system/legacy'` を使うこと
- EASクラウドビルド上限超過時は `npx expo run:ios --device <UDID>` でXcode直接ビルドに切り替える
