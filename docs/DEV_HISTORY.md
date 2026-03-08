# 献立カート 開発履歴

> ソースコードには残らない、開発過程の判断・手順・コマンド・トラブルを記録したドキュメント。

---

## プロジェクト概要

- **アプリ名:** 献立カート（Kondate Cart）
- **目的:** 週単位の夕食献立を管理し、買い物リストを自動生成するiOSアプリ
- **ターゲット:** 食費節約・衝動買い防止を望む日本の一般家庭・一人暮らし
- **マネタイズ:** 無料＋広告表示、広告非表示のIAP（¥300、買い切り）
- **収益目標:** 3〜4ヶ月でMAU 400〜600、月収¥10,000
- **Bundle ID:** `com.nakakei6439.kondatecart`
- **Expo Project ID:** `09de0c14-0ba0-48e3-b88e-75ba1a52a4c4`

---

## 使用技術スタック

| カテゴリ | 技術 | バージョン | 選定理由 |
| --- | --- | --- | --- |
| フレームワーク | React Native (Expo) | SDK 54 | クロスプラットフォーム対応、OTAアップデート |
| 言語 | TypeScript | 5.3.3 | 型安全、補完効率化 |
| ナビゲーション | Expo Router | 6.0.23 | ファイルベースルーティング、設定が最小限 |
| 状態管理 | Zustand | 5.0.0 | 軽量、ボイラープレートなし、ReduxやContextより簡潔 |
| 永続化 | AsyncStorage | 2.2.0 | オフライン対応、このスケールでは十分 |
| IAP | react-native-purchases (RevenueCat) | 9.11.2 | iOS/Android統合管理、ダッシュボードで把握しやすい |
| 広告 | react-native-google-mobile-ads | 16.2.1 | AdMob公式対応、インタースティシャル実装が容易 |
| 触覚フィードバック | expo-haptics | 15.0.8 | iOS標準のHapticをシンプルに呼び出せる |
| UUID生成 | expo-crypto | 15.0.8 | ネイティブのランダム性を使ったUUID生成 |

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
- Expoアカウント作成・ログイン
  ```sh
  eas login
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

#### 開発サーバー起動

```sh
# 通常の開発（Expo Go対応）
PATH="/Users/nakagawakeita/node-bin/bin:$PATH" npx expo start

# Development Build 用
PATH="/Users/nakagawakeita/node-bin/bin:$PATH" npx expo start --dev-client
```

---

### Phase 2: 収益化実装

#### Google AdMob セットアップ

- [admob.google.com](https://admob.google.com) でアカウント作成（無料）
- iOSアプリを登録し、インタースティシャル広告ユニットを作成
- 取得した ID:
  - AdMob アプリ ID: `ca-app-pub-6037843763000573~3751863813`
  - インタースティシャル広告ユニット ID: `ca-app-pub-6037843763000573/8286005190`
- `app.json` の `plugins` に以下を追加:
  ```json
  [
    "react-native-google-mobile-ads",
    {
      "iosAppId": "ca-app-pub-6037843763000573~3751863813"
    }
  ]
  ```

#### RevenueCat セットアップ

- [app.revenuecat.com](https://app.revenuecat.com) でアカウント作成（無料 〜 $2,500/月まで）
- プロジェクト作成 → iOSアプリ登録
- App Store Connect API Key を取得・登録
  - Key ID: `Q5L256WMRM`（Issuer IDも合わせて登録）
- Product を登録（App Store ConnectのProduct IDと完全一致が必要）
- Entitlement を作成（ID: `Kondate Cart Premium`）
- Offering を作成 → "Current" に設定
- Package を作成して Offering に紐づけ

#### App Store Connect IAP セットアップ

- [appstoreconnect.apple.com](https://appstoreconnect.apple.com) でアプリ登録
- In-App Purchase を作成:
  - 種別: **非消耗型**（Non-Consumable）
  - 価格: Tier 3（¥300）
  - ステータスが「準備完了」以上である必要あり
- 有料アプリ契約・銀行口座・税務情報を登録（IAP動作の必須条件）
- サンドボックステスターを作成（存在しないメールアドレスを使用）

#### EAS Build 設定

- プロジェクトを EAS に紐づけ:
  ```sh
  eas init
  ```
- `eas.json` を作成:
  ```json
  {
    "build": {
      "development": {
        "developmentClient": true,
        "distribution": "internal"
      },
      "preview": {
        "distribution": "internal"
      },
      "production": {}
    }
  }
  ```

---

### Phase 3: ビルド・テスト・申請

#### Development Build 作成（IAP動作確認用）

```sh
# Development Build（シミュレータ or 実機用）
npx eas build --profile development --platform ios
```

> **重要:** `npx expo start` だけでは `app.json` のプラグイン変更が反映されない。IAP・広告ライブラリの動作確認にはDevelopment Build が必須。

#### サンドボックステスト手順

1. iPhone の設定 → App Store → サンドボックスアカウント にテスターでサインイン（iCloudとは別）
2. Development Build をインストール
3. アプリ内でIAP購入フローを実行
4. ダイアログに `[環境: サンドボックス]` と表示されれば正常
5. テスト後のリセット: iPhone の設定 → App Store → Sandbox Account → 購入をリセット

#### 本番ビルド・App Store申請

```sh
# 本番ビルド
npx eas build --profile production --platform ios

# App Store申請
npx eas submit --platform ios
```

---

## CLIコマンド一覧

| コマンド | 目的 | 使用タイミング |
| --- | --- | --- |
| `npx create-expo-app <name> --template blank-typescript` | プロジェクト作成 | Phase 0（初回のみ） |
| `npm install --legacy-peer-deps` | 依存ライブラリインストール | 初回・ライブラリ追加後 |
| `npx expo start` | 開発サーバー起動（Expo Go） | MVP開発中 |
| `npx expo start --dev-client` | 開発サーバー起動（Dev Build） | IAP・広告動作確認時 |
| `eas login` | EASへのログイン | 初回セットアップ |
| `eas init` | プロジェクトをEASに紐づけ | 初回セットアップ |
| `eas build --profile development --platform ios` | Development Build作成 | IAP・広告テスト前 |
| `eas build --profile preview --platform ios` | Preview Build作成 | TestFlight配信前 |
| `eas build --profile production --platform ios` | 本番ビルド作成 | App Store申請前 |
| `eas submit --platform ios` | App Storeへ申請 | 本番ビルド完成後 |
| `eas update` | OTAアップデート配信 | JS変更のみの軽微な更新時 |

---

## 外部サービス一覧

| サービス | 用途 | URL | コスト |
| --- | --- | --- | --- |
| Apple Developer Program | App Store配信、IAP | developer.apple.com | ¥14,800/年 |
| App Store Connect | アプリ管理、IAP設定 | appstoreconnect.apple.com | 無料 |
| RevenueCat | IAP管理・分析 | app.revenuecat.com | 無料（〜$2,500/月） |
| Google AdMob | 広告配信 | admob.google.com | 無料（収益分配） |
| Expo / EAS | ビルド・配信 | expo.dev | 無料（個人プラン） |
| GitHub | ソース管理 | github.com | 無料 |

---

## ライブラリ選定の理由

- **Expo Router（over React Navigation）:** ファイルベースルーティングで設定が最小限。追加の Navigator 定義が不要。
- **Zustand（over Redux/Context）:** 1ファイルで完結するストア定義、ボイラープレートなし、パフォーマンスも十分。
- **AsyncStorage（over SQLite/MMKV）:** 今のデータ規模ではオーバーエンジニアリング不要。完全オフライン対応。
- **RevenueCat（over StoreKit直接実装）:** iOS/Android両対応、ダッシュボードで購入状況把握、Sandbox/本番の切り替えが自動。
- **UIライブラリなし（over NativeBase等）:** iOSのデザインガイドラインに沿った純粋なStyleSheetで完全制御を優先。

---

## 遭遇したエラーと解決策

### 1. Expo Go で IAP が動作しない

- **原因:** Expo Go はサンドボックス環境のため、ネイティブモジュール（react-native-purchases）が利用不可
- **解決:** Development Build を使用する（`eas build --profile development`）

### 2. `app.json` に `react-native-purchases` プラグインが未登録

- **原因:** プラグインを追記せずにビルドしたため、ネイティブコードがリンクされない
- **解決:** `app.json` の `plugins` に `"react-native-purchases"` を追加してから再ビルド
  ```json
  "plugins": [
    "expo-router",
    "expo-updates",
    "react-native-purchases",
    ["react-native-google-mobile-ads", { ... }]
  ]
  ```

### 3. Expo Router が余分なタブを生成する

- **原因:** `app/` フォルダ内にコンポーネントファイルを置くと、Expo Routerがそれをページとして認識する
- **解決:** UIコンポーネントはすべて `src/components/` に配置する

### 4. Entitlement ID の不一致でIAP認証失敗

- **原因:** RevenueCatのEntitlement IDとコード内の文字列が大文字小文字・スペース含め完全一致していなかった
- **解決:** Entitlement ID `Kondate Cart Premium` を RevenueCat・コード両方で完全一致させる

### 5. IAPが動作しない（有料契約未登録）

- **原因:** App Store Connectで銀行口座・税務情報・有料アプリ契約が未完了
- **解決:** App Store Connect → 契約 → 有料アプリ契約を完了させてから再テスト

### 6. `npm install` が依存関係エラーで失敗

- **原因:** peer dependencies の競合
- **解決:** `npm install --legacy-peer-deps` で回避

---

## 設計上の重要な決定事項

- **Copy-on-save:** 献立に料理を登録する際、DishRecord の食材をそのままコピーする。こうすることで、過去の料理履歴を変更しても今週の献立には影響しない
- **ISO 8601 週キー:** `2026-W09` 形式のキーでAsyncStorageを管理。日付計算が一貫して行える
- **週の開始日は月曜日:** 日本の慣習に合わせてISO週の月曜始まりを採用
- **オフライン専用:** ネットワーク通信なし（広告・IAP除く）。ユーザーデータはすべてデバイス内に保存
- **ポートレートオンリー:** 献立・買い物リスト用途では縦画面のみ想定

---

## 現在の状況・保留中のタスク

### 現状（2026年3月時点）

- App Store 審査申請済み → **審査通過待ち**
- `app.json` に `react-native-purchases` プラグインが未登録（既知の問題）
- **購入テスト・購入復元テスト が未実施**（審査通過後に実施予定）

### 審査通過後にやること（チェックリスト）

#### Step 1: app.json プラグイン修正

```json
"plugins": [
  "expo-router",
  "expo-updates",
  "react-native-purchases",
  ["react-native-google-mobile-ads", { "iosAppId": "ca-app-pub-6037843763000573~3751863813" }]
]
```

#### Step 2: Development Build を再作成

```sh
npx eas build --profile development --platform ios
```

> プラグイン変更はビルドし直さないと反映されない

#### Step 3: 購入テスト（サンドボックス）

1. iPhone の **設定 → App Store → サンドボックスアカウント** にテスターでサインイン
2. Development Build をインストール
3. アプリを開き、設定から「広告を削除（¥300）」をタップ
4. ダイアログに `[環境: サンドボックス]` と表示されることを確認
5. 購入を完了 → **広告が非表示になることを確認**

#### Step 4: 購入復元テスト（サンドボックス）

1. アプリをアンインストール
2. Development Build を再インストール
3. 設定から「購入を復元」をタップ
4. **広告が再び非表示になることを確認**

#### Step 5: サンドボックスのリセット（テスト後の後片付け）

- iPhone の 設定 → App Store → Sandbox Account → 購入をリセット

#### Step 6: 本番ビルド作成・再申請

```sh
npx eas build --profile production --platform ios
npx eas submit --platform ios
```

---

## 関連ドキュメント

| ファイル | 内容 |
| --- | --- |
| [REQUIREMENTS.md](./REQUIREMENTS.md) | MVP要件定義（What を定義） |
| [DEV_FLOW.md](./DEV_FLOW.md) | 開発手順チェックリスト（Step by Step） |
| [IAP_TROUBLESHOOT.md](./IAP_TROUBLESHOOT.md) | IAP実装の詳細トラブルシューティング |
| [microbusiness_plan.md](./microbusiness_plan.md) | ビジネス計画・収益化戦略 |
| **DEV_HISTORY.md** | **本ファイル：実際の開発履歴記録** |
