# 献立カート 開発履歴

> ソースコードには残らない、開発過程の判断・手順・コマンド・トラブルを記録したドキュメント。

---

## プロジェクト概要

- **アプリ名:** 献立カート（Kondate Cart）
- **目的:** 週単位の夕食献立を管理し、買い物リストを自動生成するiOSアプリ
- **ターゲット:** 食費節約・衝動買い防止を望む日本の一般家庭・一人暮らし
- **マネタイズ:** 無料＋広告表示、広告非表示のIAP（¥300、買い切り）
- **Bundle ID:** `com.nakakei6439.kondatecart`
- **Expo Project ID:** `09de0c14-0ba0-48e3-b88e-75ba1a52a4c4`

---

## 使用技術スタック

| カテゴリ | 技術 | バージョン | 選定理由 |
| --- | --- | --- | --- |
| フレームワーク | React Native (Expo) | SDK 54 | クロスプラットフォーム対応、OTAアップデート |
| 言語 | TypeScript | 5.3.3 | 型安全、補完効率化 |
| ナビゲーション | Expo Router | 6.x | ファイルベースルーティング、設定が最小限 |
| 状態管理 | Zustand | 5.0.0 | 軽量、ボイラープレートなし |
| 永続化 | AsyncStorage | 2.2.0 | オフライン対応、このスケールでは十分 |
| 多言語対応 | i18next / react-i18next | — | 5言語対応（日・英・中・韓・西） |
| 端末言語検出 | expo-localization | — | 起動時に端末ロケールを取得 |
| IAP | react-native-purchases (RevenueCat) | 9.x | iOS/Android統合管理 |
| 広告 | react-native-google-mobile-ads | 16.x | AdMob公式対応 |
| レビュー誘導 | expo-store-review | — | SKStoreReviewAPI |
| 触覚フィードバック | expo-haptics | 15.x | iOS標準のHapticをシンプルに呼び出せる |
| UUID生成 | expo-crypto | 15.x | ネイティブのランダム性を使ったUUID生成 |

---

## フェーズ別 開発履歴

### Phase 0: 環境構築

- Node.js 20+ を `/Users/nakagawakeita/node-bin/bin/` にインストール（PATH設定が必要）
- Xcodeをインストール（iOSシミュレータ用）
- Apple Developer Program に登録（¥14,800/年）
- Expo CLIをグローバルにはインストールせず、`npx` 経由で使用する方針を採用
- EAS CLI をグローバルインストール
  ```sh
  npm install -g eas-cli
  ```
- 新規Expoプロジェクトを作成
  ```sh
  npx create-expo-app KondateCart app --template blank-typescript
  ```
- 依存ライブラリをインストール（`--legacy-peer-deps` が必要）
  ```sh
  npm install --legacy-peer-deps
  ```

---

### Phase 1: MVP実装

#### 設計方針

- **UIライブラリは使用しない** → `StyleSheet` のみで純粋なiOSデザインを実現
- **コンポーネントは `src/components/` に置く**（`app/` に置くとExpo Routerが余分なタブを生成してしまうため）
- **Copy-on-save パターン** → DishRecordの食材をDayEntryにコピーすることで、週ごとのカスタマイズを可能にする
- **ISO 8601 週キー**（例: `2026-W09`）でデータを管理

#### 実装順序

1. TypeScript型定義（`src/types/index.ts`）
2. AsyncStorageレイヤー（`src/storage/menuStorage.ts`, `dishStorage.ts`）
3. Zustandストア（`src/store/menuStore.ts`, `dishStore.ts`, `shoppingStore.ts`）
4. ユーティリティ関数（`src/utils/weekUtils.ts`）
5. UIコンポーネント（`src/components/`）
6. Expo Router画面（`app/index.tsx`, `shopping.tsx`, `history.tsx`）

---

### Phase 2: 収益化実装（v1.0.0）

#### Google AdMob セットアップ

- [admob.google.com](https://admob.google.com) でアカウント作成（無料）
- iOSアプリを登録し、インタースティシャル広告ユニットを作成
- 取得した ID:
  - AdMob アプリ ID: `ca-app-pub-6037843763000573~3751863813`
  - インタースティシャル広告ユニット ID: `ca-app-pub-6037843763000573/8286005190`

#### RevenueCat セットアップ

- [app.revenuecat.com](https://app.revenuecat.com) でアカウント作成
- Product → Entitlement（ID: `Kondate Cart Premium`）→ Offering → Package の順で設定
- App Store Connect API Key を取得・登録（Key ID: `Q5L256WMRM`）

#### App Store Connect IAP セットアップ

- In-App Purchase を作成:
  - 種別: **非消耗型**（Non-Consumable）
  - 価格: Tier 3（¥300）
- 有料アプリ契約・銀行口座・税務情報を登録（IAP動作の必須条件）

#### EAS Build 設定

- `eas.json` を作成し、development / preview / production プロファイルを定義
- ローカルビルド用スクリプト（`scripts/build-ios.sh`）を整備
  - `eas build --local` モードと `xcodebuild` モードを選択可能
  - 出力先: `dist/ipa/app-{profile}.ipa`

---

### Phase 3: テスト基盤整備

- **Jest ユニットテスト** 38件: ストア・ストレージ・ユーティリティをカバー
- **Maestro E2E テスト** 5フロー: 基本的な献立登録・買い物リスト生成・履歴操作を自動化

---

### Phase 4: ローカライズ・UX改善（v1.0.3）

#### 多言語対応（5言語）

- `i18next` / `react-i18next` を導入
- `expo-localization` で端末ロケールを取得して自動適用
- 対応言語: 日本語（ja）・英語（en）・中国語（zh）・韓国語（ko）・スペイン語（es）
- 翻訳ファイルは `src/i18n/locales/{lang}.json` に配置

#### レビュープロンプト

- `expo-store-review` を使用した `useReviewPrompt.ts` フックを実装
- 一定条件を満たしたタイミングで SKStoreReviewAPI を呼び出す

#### エクスポート機能強化

- `exportStorage.ts` を整備し、全データ（献立・料理履歴）を JSON で出力
- ShareSheet 経由でファイル保存・共有が可能に

---

### Phase 5: バグ修正・UI改善（v1.0.4）

#### 1日複数料理対応

- データモデルを `DayEntry`（1料理）→ `DayRecord`（複数料理: `dishes[]`）に変更
- `DayEntrySheet` に料理追加ボタンを実装
- 料理行を左スワイプで削除できる UI を追加（複数登録時のみ有効）

#### スワイプ競合バグの修正

- **問題:** `WeekCalendar` で曜日行をスワイプ削除しようとすると、タップとして認識されてシートが開くことがあった
- **解決:** `swipeActiveRef = useRef<Map<DayKey, boolean>>(new Map())` パターンを導入。`onSwipeableWillOpen` / `onSwipeableClose` で状態を追跡し、スワイプ中はタップを無視する

#### DishEditSheet のジェスチャー競合バグの修正

- **問題:** 料理履歴編集シートで材料を削除しようとスワイプすると、まれにシート自体が閉じてしまう
- **根本原因:** `GestureHandlerRootView` がオーバーレイの `TouchableWithoutFeedback` も内包していたため、RNGH のジェスチャーイベントがオーバーレイに漏れていた
- **解決:** `GestureHandlerRootView` のスコープをシートのみに限定。オーバーレイを RNGH スコープ外の兄弟要素として配置

#### DishEditSheet 削除ボタン追加

- 料理履歴編集シートのフッターに「削除」ボタンを追加（`handleDelete()` は実装済みだったが UI がなかった）
- 削除確認アラートを表示してから DishRecord を完全削除

#### バージョン表示

- 設定モーダルにアプリバージョンとビルド番号を表示
- `Constants.expoConfig?.version` / `Constants.expoConfig?.ios?.buildNumber` を使用

---

## 外部サービス一覧

| サービス | 用途 | コスト |
| --- | --- | --- |
| Apple Developer Program | App Store配信、IAP | ¥14,800/年 |
| App Store Connect | アプリ管理、IAP設定 | 無料 |
| RevenueCat | IAP管理・分析 | 無料（〜$2,500/月） |
| Google AdMob | 広告配信 | 無料（収益分配） |
| Expo / EAS | ビルド・配信 | 無料（個人プラン） |
| GitHub | ソース管理 | 無料 |

---

## ライブラリ選定の理由

- **Expo Router（over React Navigation）:** ファイルベースルーティングで設定が最小限。
- **Zustand（over Redux/Context）:** 1ファイルで完結するストア定義、ボイラープレートなし。
- **AsyncStorage（over SQLite/MMKV）:** 今のデータ規模ではオーバーエンジニアリング不要。
- **RevenueCat（over StoreKit直接実装）:** iOS/Android両対応、Sandbox/本番の切り替えが自動。
- **i18next（over 自前実装）:** 言語検出・フォールバック・複数形対応が標準装備。
- **UIライブラリなし（over NativeBase等）:** iOSのデザインガイドラインに沿った純粋なStyleSheetで完全制御を優先。

---

## 遭遇したエラーと解決策

### 1. Expo Go で IAP が動作しない

- **原因:** Expo Go はサンドボックス環境のため、ネイティブモジュールが利用不可
- **解決:** Development Build を使用する

### 2. Expo Router が余分なタブを生成する

- **原因:** `app/` フォルダ内にコンポーネントファイルを置くと、Expo Routerがそれをページとして認識する
- **解決:** UIコンポーネントはすべて `src/components/` に配置する

### 3. Entitlement ID の不一致でIAP認証失敗

- **原因:** RevenueCatのEntitlement IDとコード内の文字列が大文字小文字・スペース含め完全一致していなかった
- **解決:** Entitlement ID `Kondate Cart Premium` を RevenueCat・コード両方で完全一致させる

### 4. `expo-file-system` v19 で旧APIが見つからない

- **原因:** v19 から `cacheDirectory` や `EncodingType` 等の旧APIが廃止
- **解決:** `import * as FileSystem from 'expo-file-system/legacy'` を使用する

### 5. `npm install` が依存関係エラーで失敗

- **原因:** peer dependencies の競合
- **解決:** `npm install --legacy-peer-deps` で回避

### 6. DishEditSheet でスワイプ中にシートが閉じる

- **原因:** `GestureHandlerRootView` がオーバーレイの `TouchableWithoutFeedback` も内包していたため、RNGH ジェスチャーがオーバーレイに漏れていた
- **解決:** `GestureHandlerRootView` のスコープをシートコンテンツのみに限定し、オーバーレイを兄弟要素として配置する

---

## 設計上の重要な決定事項

- **Copy-on-save:** 献立に料理を登録する際、DishRecord の食材をそのままコピーする。過去の料理履歴を変更しても今週の献立には影響しない
- **ISO 8601 週キー:** `2026-W09` 形式のキーでAsyncStorageを管理。日付計算が一貫して行える
- **週の開始日は月曜日:** 日本の慣習に合わせてISO週の月曜始まりを採用
- **オフライン専用:** ネットワーク通信なし（広告・IAP除く）。ユーザーデータはすべてデバイス内に保存
- **ポートレートオンリー:** 献立・買い物リスト用途では縦画面のみ想定
- **GestureHandlerRootView のスコープ管理:** モーダル内で Swipeable を使う場合、オーバーレイの TouchableWithoutFeedback を RNGH スコープ外に置かないとジェスチャーが漏れる

---

## 関連ドキュメント

| ファイル | 内容 |
| --- | --- |
| [../REQUIREMENTS.md](../REQUIREMENTS.md) | 要件定義（データモデル・機能仕様） |
| [../DEVGUIDE.md](../DEVGUIDE.md) | 環境構築・開発フロー・設定値 |
| [../COMMANDS.md](../COMMANDS.md) | Claude Code スラッシュコマンド一覧 |
| **DEV_HISTORY.md** | **本ファイル：実際の開発履歴記録** |
