# 開発フロー

## 前提

- Node.js 20+ インストール済み（`/Users/nakagawakeita/node-bin/bin/` に配置）
- Xcode インストール済み（iOS シミュレーター使用）
- iPhone に Expo Go アプリ（SDK 54）インストール済み（UI確認用）

---

## ステップ 1: 環境セットアップ

```bash
export PATH="/Users/nakagawakeita/node-bin/bin:$PATH"
cd "/Users/nakagawakeita/Products/APP/Kondate Cart/KondateCart app"

# パッケージインストール（legacy-peer-deps が必要）
npm install --legacy-peer-deps
```

---

## ステップ 2: 型定義

`src/types/index.ts` に Ingredient / DishRecord / DayEntry / WeekMenu を定義。
→ REQUIREMENTS.md の「3. データモデル」を参照。

---

## ステップ 3: Storage 層

`src/storage/dishStorage.ts` — DishRecord の CRUD（saveDish / loadAllDishes / deleteDish）
`src/storage/menuStorage.ts` — WeekMenu の CRUD

---

## ステップ 4: Zustand Store

`src/store/dishStore.ts` — dishes, loadDishes, upsertDish, updateDish, deleteDish
`src/store/menuStore.ts` — weekKey（デフォルト: 来週）, weekMenu, setWeekKey, loadWeekMenu, saveDayEntry, clearDayEntry
`src/store/shoppingStore.ts` — mode('nextWeek'|'twoWeeks'), items, setMode, generate, removeItem

---

## ステップ 5: ユーティリティ

`src/utils/weekUtils.ts`

```typescript
getWeekKey(date: Date): string        // → "2026-W09"
getCurrentWeekKey(): string
getWeekDates(weekKey: string): Date[] // 月〜日の7日分
formatWeekTitle(weekKey: string): string
prevWeekKey(key: string): string
nextWeekKey(key: string): string
```

---

## ステップ 6: コンポーネント（src/components/）

> **重要**: コンポーネントは `app/` 外の `src/components/` に配置する。
> `app/` 直下に置くと Expo Router がルートとして認識し、余分なタブが増える。

- `WeekCalendar.tsx` — 週間カレンダーグリッド
- `DayEntrySheet.tsx` — 料理入力ボトムシート（KeyboardAvoidingView でキーボード対応・未保存確認ダイアログあり）
- `DishEditSheet.tsx` — 料理履歴編集ボトムシート（名前・材料の編集）
- `ShoppingItem.tsx` — 買い物リスト行コンポーネント

---

## ステップ 7: Expo Router 画面（app/）

```
app/
├── _layout.tsx     # GestureHandlerRootView + <Tabs> 3本
├── index.tsx       # 献立画面（デフォルト来週表示）
├── shopping.tsx    # 買い物リスト（来週/再来週 切り替え）
└── history.tsx     # 履歴画面（料理履歴の閲覧・編集・削除）
```

**_layout.tsx のポイント**:
- `GestureHandlerRootView` で全体をラップ（必須）
- `headerShown: false` を設定

---

## ステップ 8: 起動・動作確認（UI のみ）

```bash
export PATH="/Users/nakagawakeita/node-bin/bin:$PATH"
npx expo start
```

iPhone の Expo Go でQRコードをスキャン。

> **注意**: IAP（アプリ内課金）は Expo Go では動作しない。IAP のテストは下記「EAS Development Build」を使う。

確認項目：
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

## ステップ 9: EAS Development Build（IAP / AdMob テスト時）

IAP・AdMob はネイティブモジュールを使うため、Expo Go では動作しない。

```bash
export PATH="/Users/nakagawakeita/node-bin/bin:$PATH"

# Development Build をビルドして実機インストール
eas build --profile development --platform ios

# ビルド完了後、QR コードから実機にインストールして起動
npx expo start --dev-client
```

IAP のトラブル時は `IAP_TROUBLESHOOT.md` を参照。

---

## ステップ 10: TestFlight / App Store 提出

```bash
# Preview（TestFlight 用）
eas build --profile preview --platform ios

# Production（App Store 提出用）
eas build --profile production --platform ios
eas submit --platform ios
```
