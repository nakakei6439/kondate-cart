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
| Version | 1.0.4 / Build 14 |
| Apple Team ID | 7PTQ6W4R3T |
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

`src/types/index.ts` に Ingredient / DishRecord / DishEntry / DayRecord / WeekMenu を定義。
→ REQUIREMENTS.md の「4. データモデル」を参照。

### ステップ 2 — Storage 層

- `src/storage/dishStorage.ts` — DishRecord の CRUD（saveDish / loadAllDishes / deleteDish）
- `src/storage/menuStorage.ts` — WeekMenu の CRUD（saveDayRecord / clearDayRecord）
- `src/storage/exportStorage.ts` — エクスポート／インポート（exportData / importData）・ダミーデータ生成（seedDummyData）

> **注意**: `expo-file-system` v19 から旧API（`FileSystem.writeAsStringAsync` 等）は `expo-file-system/legacy` 経由で使用する。`expo-file-system` から直接インポートすると `cacheDirectory` や `EncodingType` が見つからずエラーになる。

### ステップ 3 — Zustand Store

- `src/store/dishStore.ts` — dishes, loadDishes, upsertDish, updateDish, deleteDish
- `src/store/menuStore.ts` — weekKey（デフォルト: 来週）, weekMenu, setWeekKey, loadWeekMenu, saveDayRecord, clearDayRecord
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

`src/utils/shoppingUtils.ts`

- 週の献立から材料を集計して ShoppingItem[] を生成するロジック

### ステップ 5 — ローカライズ（i18n）

`src/i18n/index.ts` で i18next を初期化。`expo-localization` で端末のロケールを取得し、対応言語にマッピングする。

対応言語: 日本語（ja）・英語（en）・中国語（zh）・韓国語（ko）・スペイン語（es）

```typescript
// 端末ロケールを取得して i18next の lng に設定
import * as Localization from 'expo-localization';
const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'ja';
```

翻訳ファイルは `src/i18n/locales/{lang}.json` に配置。

### ステップ 6 — コンポーネント（src/components/）

> **重要**: コンポーネントは `app/` 外の `src/components/` に配置する。
> `app/` 直下に置くと Expo Router がルートとして認識し、余分なタブが増える。

- `WeekCalendar.tsx` — 週間カレンダーグリッド（曜日行スワイプ削除対応）
- `DayEntrySheet.tsx` — 料理入力ボトムシート（複数料理・料理行スワイプ削除・未保存確認）
- `DishEditSheet.tsx` — 料理履歴編集ボトムシート（材料スワイプ削除・フッター削除ボタン）
- `SettingsModal.tsx` — 設定モーダル（購入・エクスポート・インポート・バージョン表示）
- `ShoppingItem.tsx` — 買い物リスト行コンポーネント

### ステップ 7 — Expo Router 画面（app/）

```text
app/
├── _layout.tsx     # GestureHandlerRootView + <Tabs> 3本 + AdMob/ATT/UMP 初期化
├── index.tsx       # 献立画面（デフォルト来週表示）
├── shopping.tsx    # 買い物リスト（来週/再来週 切り替え）
└── history.tsx     # 履歴画面（料理履歴の閲覧・編集・削除）
```

`_layout.tsx` のポイント:

- `GestureHandlerRootView` で全体をラップ（必須）
- `headerShown: false` を設定
- ATT → UMP → AdMob の順で初期化

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
- [ ] 1日に複数の料理を登録できる
- [ ] 料理行を左スワイプで削除できる（複数登録時のみ）
- [ ] 曜日行を左スワイプで削除できる
- [ ] キーボードが出ても入力欄が見える
- [ ] 保存せず閉じようとすると確認ダイアログが出る
- [ ] 過去の料理を選択すると材料が入力される
- [ ] 買い物タブが来週/再来週の切り替えになっている
- [ ] 履歴タブで料理の名前・材料を編集・保存できる
- [ ] 履歴タブの料理編集で材料を左スワイプで削除できる
- [ ] 履歴タブの料理編集のフッター「削除」ボタンで料理を完全削除できる
- [ ] 履歴タブで左スワイプ削除できる
- [ ] 設定のバージョン表示が正しい
- [ ] 端末の言語に応じて UI が切り替わる（日/英/中/韓/西）
- [ ] アプリ再起動後もデータが保持されている

---

## IAP 設定（RevenueCat）

| 項目 | 値 |
| --- | --- |
| ライブラリ | react-native-purchases v9 |
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

---

## 広告（AdMob）設定

| 項目 | 値 |
| --- | --- |
| ライブラリ | react-native-google-mobile-ads v16 |
| 表示条件 | `Kondate Cart Premium` 未購入ユーザーのみ |
| 広告種別 | インタースティシャル（買い物リスト再生成時） |
| ATT ライブラリ | expo-tracking-transparency |
| `NSUserTrackingUsageDescription` | 「広告をパーソナライズするために使用します。」 |
| testDeviceIdentifiers | Xcode コンソールの `To get test ads on this device...` のハッシュ値 |
| iOS App ID | `ca-app-pub-6037843763000573~3751863813` |

ATT はアプリ起動時・AdMob 初期化前に許可リクエストを表示すること。

---

## TestFlight / App Store 提出

```bash
# ローカルビルド（EAS クォータ消費なし）
npm run build:ios:xcode:production  # xcodebuild 経由
npm run build:ios:production        # eas build --local 経由

# TestFlight 提出
eas submit --platform ios --path dist/ipa/app-production.ipa
```

> **App用パスワード**: appleid.apple.com →「サインインとセキュリティ」→「App用パスワード」で生成。
> 通常の Apple ID パスワードは使用不可。

---

## 注意事項

- コンポーネントは `src/components/` に配置する（`app/` 直下は Expo Router がルートとして認識する）
- `GestureHandlerRootView` で `_layout.tsx` 全体をラップすること
- IAP・AdMob は Expo Go では動作しない（EAS Development Build 必須）
- `expo-file-system` v19 では旧APIが廃止済み。`import * as FileSystem from 'expo-file-system/legacy'` を使うこと
- `DishEditSheet` などモーダル内で `Swipeable` を使う場合、`GestureHandlerRootView` のスコープに注意（オーバーレイの `TouchableWithoutFeedback` を RNGH スコープ外に置かないとジェスチャーが漏れる）
