# アプリ内課金（IAP）トラブルシューティングガイド

**対象アプリ**: 献立カート
**Bundle ID**: `com.nakakei6439.kondatecart`
**IAP方式**: RevenueCat (react-native-purchases v9.11.2)
**商品**: 広告除去 買い切り ¥300
**Entitlement ID**: `Kondate Cart Premium`

---

## 目次

1. [最優先で確認すること（ここから始める）](#1-最優先で確認すること)
2. [App Store Connect 設定チェック](#2-app-store-connect-設定チェック)
3. [RevenueCat ダッシュボード設定チェック](#3-revenuecat-ダッシュボード設定チェック)
4. [コード設定チェック](#4-コード設定チェック)
5. [ビルド設定チェック](#5-ビルド設定チェック)
6. [サンドボックステスト手順](#6-サンドボックステスト手順)
7. [デバッグ方法（ログの読み方）](#7-デバッグ方法)
8. [よくある原因と解決策（優先度順）](#8-よくある原因と解決策)

---

## 1. 最優先で確認すること

IAPが動かないとき、まずこの3点を確認する。これだけで解決するケースが多い。

### 1-1. Expo Go ではなく Development Build を使っているか？

| 状態 | 結果 |
|------|------|
| Expo Go アプリ上で動かしている | **IAP は絶対に動かない**（Expo Go はネイティブIAPをサポートしない） |
| EAS Development Build (ipa) をインストールして動かしている | 動作可能 |

**確認方法**: 画面を長押しするか、デバッグメニューを開いて「Expo Go」か独自アプリかを確認する。

**正しい状態**: アプリアイコンが献立カートのアイコンで、EASでビルドしたipaをインストールしている。

**修正方法**:
```bash
cd "KondateCart app"
npx eas build --profile development --platform ios
# ビルド完了後、QRコードまたはリンクからデバイスにインストール
```

---

### 1-2. app.json に react-native-purchases プラグインが登録されているか？

**現在の状態**: `app.json` の `plugins` に `react-native-purchases` が**含まれていない**。これが原因で、ネイティブビルドにRevenueCatのネイティブ設定が含まれない可能性がある。

**確認方法**: `KondateCart app/app.json` を開いて `plugins` の配列を確認する。

**正しい状態**: 以下のように `react-native-purchases` が含まれていること。

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-updates",
      "react-native-purchases",
      ["react-native-google-mobile-ads", { ... }]
    ]
  }
}
```

**修正方法**: `app.json` の `plugins` 配列に `"react-native-purchases"` を追加し、EAS Build を再実行する。

---

### 1-3. App Store Connect に有効な銀行口座と税務情報が登録されているか？

これが未登録だと、商品がサンドボックスでも「商品が見つかりません」になることがある。

**確認方法**: App Store Connect > 契約・税金・銀行口座

**正しい状態**:
- 「有料App」の契約が「アクティブ」になっている
- 銀行口座情報が登録済み
- 税務情報（マイナンバー等）が登録済み

---

## 2. App Store Connect 設定チェック

### 2-1. アプリ内課金商品の作成と状態

**確認場所**: App Store Connect > マイ App > 献立カート > App 内課金

**確認項目と正しい状態**:

| 項目 | 確認内容 | 正しい状態 |
|------|---------|-----------|
| 商品の種類 | 非消耗型（Non-Consumable）になっているか | 「非消耗型」 |
| 商品ID | RevenueCatに登録した商品IDと一致しているか | 完全に一致 |
| 価格 | ¥300 (Tier 3相当) に設定されているか | Tier 3 |
| 審査情報 | スクリーンショットと説明文が登録されているか | 登録済み |
| 状態 | 「準備完了」または「承認済み」になっているか | 「準備完了」以上 |

**注意**: 商品の状態が「審査待ち」「拒否」「開発者による削除」の場合はサンドボックスでも購入できない。

---

### 2-2. サンドボックステスターの設定

**確認場所**: App Store Connect > ユーザーとアクセス > Sandbox テスター

**確認項目**:

| 項目 | 正しい状態 |
|------|-----------|
| サンドボックスアカウントが作成されている | 少なくとも1つある |
| テストに使うiPhoneでそのアカウントがサインインできる | サインイン可能 |
| テスターのメールアドレスがApple IDとして有効 | 有効なメールアドレス |

**重要**: 本番のApple IDではサンドボックステストできない。必ず専用のサンドボックスアカウントを使う。

---

### 2-3. 銀行口座・税務情報・契約

**確認場所**: App Store Connect > 契約・税金・銀行口座

**正しい状態**:

```
有料 App の契約状態: アクティブ
銀行情報: 登録済み
税務情報: 登録済み（日本の場合はマイナンバー等）
```

この画面で何かが「アクション必要」になっていたら、先に対応する。

---

## 3. RevenueCat ダッシュボード設定チェック

**URL**: https://app.revenuecat.com

### 3-1. App Store Connect API キーの連携

**確認場所**: RevenueCat > プロジェクト > App Store Connect API

**確認項目**:

| 項目 | 正しい状態 |
|------|-----------|
| App Store Connect API Key が登録されている | 登録済み |
| Issuer ID が正しい | App Store Connect の値と一致 |
| Key ID が正しい | `Q5L256WMRM`（プロジェクトルートの.p8ファイルに対応） |
| .p8ファイルがアップロードされている | アップロード済み |

**注意**: このAPI連携がないと、RevenueCatがAppleの商品情報を取得できず Offering が空になる。

---

### 3-2. 商品（Product）の登録

**確認場所**: RevenueCat > プロジェクト > Products

**確認項目**:

| 項目 | 正しい状態 |
|------|-----------|
| 商品が登録されている | App Store Connectの商品IDと完全一致した商品が存在する |
| ストア | App Store (iOS) |
| 商品IDの一致 | App Store Connectの「参照名」ではなく「商品ID」と一致 |

---

### 3-3. エンタイトルメント（Entitlement）の設定

**確認場所**: RevenueCat > プロジェクト > Entitlements

**確認項目**:

| 項目 | 正しい状態 |
|------|-----------|
| エンタイトルメントが存在する | ID が `Kondate Cart Premium` のエンタイトルメントがある |
| **IDのスペルが完全一致** | `Kondate Cart Premium`（大文字小文字・スペースも含め完全一致） |
| 商品が紐付いている | 上で登録した商品がこのエンタイトルメントに紐付いている |

**重要**: コード側の `ENTITLEMENT_ID = 'Kondate Cart Premium'` とRevenueCat側のIDが1文字でも違うと、購入が成功してもプレミアム判定されない。

---

### 3-4. Offering（オファリング）の設定

**確認場所**: RevenueCat > プロジェクト > Offerings

**確認項目**:

| 項目 | 正しい状態 |
|------|-----------|
| Offering が存在する | 少なくとも1つある |
| 「Current」に設定されている | デフォルトのOfferingが「Current」になっている |
| Package が含まれている | Offering内にPackageが1つ以上ある |
| PackageにProductが紐付いている | 各PackageにApp Store Connectの商品が紐付いている |

**コードが参照している箇所**:
```typescript
// purchaseStore.ts
const offerings = await Purchases.getOfferings();
const pkg = offerings.current?.availablePackages[0]; // Current Offering の最初のパッケージ
```

`offerings.current` が null の場合、「商品が見つかりません」エラーになる。

---

## 4. コード設定チェック

### 4-1. app.json プラグイン設定

**ファイル**: `KondateCart app/app.json`

**現在の状態（問題あり）**:
```json
"plugins": [
  "expo-router",
  "expo-updates",
  ["react-native-google-mobile-ads", { ... }]
]
```

**正しい状態**:
```json
"plugins": [
  "expo-router",
  "expo-updates",
  "react-native-purchases",
  ["react-native-google-mobile-ads", { ... }]
]
```

**修正後**: 必ず EAS Build を再実行する（プラグイン変更はビルドに反映されないと意味がない）。

---

### 4-2. Entitlement ID の一致確認

**ファイル**: `KondateCart app/src/store/purchaseStore.ts`

```typescript
// 現在の定義（7行目付近）
const ENTITLEMENT_ID = 'Kondate Cart Premium';
```

**正しい状態**: RevenueCatダッシュボードの Entitlement ID と**完全一致**していること。

**確認チェック**:
- [ ] 大文字小文字が一致している
- [ ] スペースの数が一致している
- [ ] 前後に余分なスペースがない

---

### 4-3. RevenueCat API キーの確認

**ファイル**: `KondateCart app/src/store/purchaseStore.ts`

```typescript
const REVENUECAT_API_KEY = 'appl_uRhiHIrhrxguepSKJBEQHTQAlvX';
```

**確認場所**: RevenueCat > プロジェクト設定 > API Keys

**正しい状態**:
- `appl_` で始まるiOS用Public APIキーである
- RevenueCatダッシュボードの値と一致している
- Android用キー（`goog_`）と間違っていない

---

### 4-4. エラーの可視化（デバッグ時の推奨対応）

現在の `initPurchases` はエラーをサイレント処理しているため、何が失敗しているか分からない。
**開発中は一時的に以下のようにログを追加する**:

```typescript
// purchaseStore.ts の initPurchases 内の catch ブロックを変更
} catch (error) {
  console.error('[IAP] initPurchases error:', error);
  // 本番でもサイレントにしたい場合はこのまま（エラーは握り潰す）
}
```

同様に `purchasePremium` のエラーも:
```typescript
} catch (e: unknown) {
  console.error('[IAP] purchasePremium error:', e); // 追加
  set({ isLoading: false });
  ...
}
```

---

## 5. ビルド設定チェック

### 5-1. Development Build のビルドプロファイル確認

**ファイル**: `KondateCart app/eas.json`

**正しい状態**:
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

**IAP のテストに使うべきプロファイル**:
- `development`: 開発中のテスト（Development Buildが必要）
- `preview`: TestFlight相当（実際の購入フローに近い）
- `production`: App Store 提出用

**サンドボックステストは `development` または `preview` ビルドで行う。**

---

### 5-2. ビルドコマンド

```bash
cd "KondateCart app"

# Development Build（デバイスにインストールして開発）
npx eas build --profile development --platform ios

# Preview Build（TestFlightに近い環境）
npx eas build --profile preview --platform ios

# ビルド後、デバイス上でアプリを起動してサンドボックステストを実施
```

---

### 5-3. app.json変更後の必須作業

app.jsonの `plugins` や設定を変更した場合、以下の順で作業する:

```
1. app.json を編集
2. npx eas build --profile development --platform ios を実行
3. 完成したipaをデバイスにインストール
4. アプリを起動してIAPをテスト
```

**NG**: `npx expo start` だけでは app.json のプラグイン変更はネイティブに反映されない。

---

## 6. サンドボックステスト手順

### 手順1: サンドボックステスターアカウントの準備

1. App Store Connect > ユーザーとアクセス > Sandbox テスター にアクセス
2. 「+」ボタンで新しいテスターを追加
3. 実在しないメールアドレスを使う（例: `sandbox.test.kondatecart@gmail.com`）
4. 名前・パスワードを設定して保存

### 手順2: iPhone の設定

1. iPhone の **設定 > App Store** を開く
2. 一番下の「サンドボックスアカウント** セクションでサインイン（本番のApple IDからサインアウト不要）
3. サンドボックステスターのメールアドレスとパスワードでサインイン

**注意**: iCloud（設定 > ～のApple ID）からサインアウトする必要はない。App Store の設定だけ変える。

### 手順3: Development Build でアプリを起動

1. EAS Development Build でビルドしたアプリをデバイスにインストール
2. アプリを起動
3. 設定モーダルを開いて「広告を消す」ボタンをタップ

### 手順4: 購入ダイアログの確認

**正しい状態**:
- Appleの購入確認ダイアログが表示される
- 「[環境: サンドボックス]」の表示がある
- 価格が表示されている

**NG の状態**:
- 「商品が見つかりません」エラー → 上記のチェックリストを確認
- ダイアログが表示されず処理が終わる → ログを確認

### 手順5: 購入完了の確認

サンドボックスでは購入確認ダイアログで「購入」を選ぶと即完了。請求は発生しない。

**購入完了後の正しい状態**:
- 設定モーダルに「✓ 広告なし（購入済み）」が表示される
- アプリを閉じて再起動しても「購入済み」状態が維持される
- RevenueCat ダッシュボード > Customer Lookup でユーザーの購入履歴が確認できる

---

## 7. デバッグ方法

### 7-1. RevenueCat のデバッグログを確認する

現在のコードでは `__DEV__` のときに DEBUG ログが有効になっている:

```typescript
// purchaseStore.ts
if (__DEV__) {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
}
```

**ログの確認方法**:
1. iPhone を Mac に接続
2. Xcode > Window > Devices and Simulators を開く
3. アプリを起動してログを確認

または:
```bash
# React Native の Metro Bundler のコンソールでも一部確認できる
npx expo start
```

**正常時のログ例**:
```
[Purchases] - DEBUG: Configuring Purchases with API key
[Purchases] - DEBUG: Getting offerings
[Purchases] - DEBUG: Vending offerings from cache
```

**エラー時のログ例**:
```
[Purchases] - ERROR: Error fetching offerings: ...
[Purchases] - ERROR: No offerings found
```

---

### 7-2. RevenueCat ダッシュボードでの確認

**Customer Lookup**:
- RevenueCat > Customer Lookup
- App User ID（デフォルトはランダムUUID）で検索
- 購入履歴、エンタイトルメント状態を確認できる

**ログのリアルタイム確認**:
- RevenueCat > Logs でAPIコールのリアルタイムログを確認できる

---

### 7-3. よくあるエラーメッセージと意味

| エラー / 症状 | 意味 | 対処 |
|-------------|------|------|
| `商品が見つかりません` | `offerings.current` が null | RevenueCatのOffering設定を確認 |
| StoreKit エラー 0 | 一般的な通信エラー | ネットワーク確認、しばらく待つ |
| StoreKit エラー `cannot connect to iTunes Store` | Appleサーバーへの接続失敗 | ネットワーク確認 |
| `Invalid product identifier` | App Store Connectの商品IDが不正 | 商品IDのスペルを確認 |
| `This in-app purchase has already been bought` | サンドボックスで既に購入済み | テスターアカウントを変更するか購入履歴をリセット |
| 購入後もプレミアムにならない | Entitlement IDの不一致 | コードとRevenueCatのIDを照合 |
| `PurchasesError: There was a problem with the App Store.` | App Store接続の問題 | デバイスを再起動、しばらく待つ |

---

### 7-4. サンドボックス購入のリセット方法

サンドボックスでは「非消耗型」でも購入履歴をリセットできる:

1. iPhone 設定 > App Store > サンドボックスアカウント
2. テスターアカウントをタップ
3. 「App内課金の管理」 > 購入済み商品をリセット

---

## 8. よくある原因と解決策

優先度の高い順に確認する。

### 優先度 1: ビルドの問題（最多）

**症状**: 購入ダイアログが出ない、「商品が見つかりません」
**原因**: Expo Go で動かしている、または Development Build が古い
**解決策**: EAS Build で新しいビルドを作成してインストール

---

### 優先度 2: app.json プラグイン未登録

**症状**: RevenueCatの初期化がサイレントに失敗している
**原因**: `app.json` の `plugins` に `react-native-purchases` がない
**解決策**:
1. `app.json` の `plugins` に `"react-native-purchases"` を追加
2. EAS Build を再実行

---

### 優先度 3: RevenueCat の Offering 未設定

**症状**: 「商品が見つかりません」エラー
**原因**: RevenueCat ダッシュボードで Offering が設定されていない、または Current に設定されていない
**解決策**: RevenueCat ダッシュボードで Product → Entitlement → Offering → Package の順に設定

---

### 優先度 4: App Store Connect の商品が未承認

**症状**: 「商品が見つかりません」または StoreKit エラー
**原因**: 商品の状態が「審査待ち」「拒否」など
**解決策**: App Store Connect で商品の状態を確認し、問題があれば修正・再申請

---

### 優先度 5: 銀行口座・税務情報の未登録

**症状**: サンドボックスでも商品が取得できない
**原因**: App Store Connect の契約が「アクティブ」でない
**解決策**: App Store Connect > 契約・税金・銀行口座 でアクティブにする

---

### 優先度 6: Entitlement ID の不一致

**症状**: 購入は成功するがプレミアム判定されない
**原因**: コードの `ENTITLEMENT_ID` と RevenueCat のエンタイトルメントIDが一致していない
**解決策**: 両方を確認して完全一致させる

```typescript
// purchaseStore.ts
const ENTITLEMENT_ID = 'Kondate Cart Premium'; // ← RevenueCatと完全一致させる
```

---

### 優先度 7: RevenueCat API キーの誤り

**症状**: 初期化が失敗する（ログに ERROR が出る）
**原因**: iOS用APIキーが間違っている
**解決策**: RevenueCat > プロジェクト設定 > API Keys で `appl_` で始まるPublic API Keyを確認

---

## まとめ：最短チェックリスト

IAPが動かないとき、この順番で確認する:

```
[ ] 1. Expo Go ではなく Development Build を使っているか？
[ ] 2. app.json の plugins に "react-native-purchases" があるか？
[ ] 3. App Store Connect の「有料App」契約がアクティブか？
[ ] 4. App Store Connect に商品（非消耗型）が「準備完了」以上の状態で存在するか？
[ ] 5. RevenueCat に商品・エンタイトルメント・Offering が設定されているか？
[ ] 6. RevenueCat の Entitlement ID が "Kondate Cart Premium" と完全一致しているか？
[ ] 7. サンドボックステスターアカウントで iPhone にサインインしているか？
[ ] 8. ログを確認して具体的なエラーメッセージを把握したか？
```

---

*最終更新: 2026-03-07*
