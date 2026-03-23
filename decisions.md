# 意思決定ログ

## 2026-03-15

- **ATT（App Tracking Transparency）未設定がTestFlight広告非表示の根本原因と特定** — IDFA未取得によりAdMobがデバイスを識別できず、testDeviceIdentifiersの値にかかわらず広告が表示されなかった
- **`expo-tracking-transparency` を採用** — ATT許可リクエストの実装に使用。`requestTrackingPermissionsAsync()` をAdMob初期化前に呼ぶことで正しい順序を保証
- **`NSUserTrackingUsageDescription` を `app.json` の `infoPlist` に追加** — ATTダイアログのメッセージとして「広告をパーソナライズするために使用します。」を設定
- **`expo-tracking-transparency` を `app.json` の `plugins` に追加** — プラグイン未登録ではATTダイアログが表示されないことが判明したため追加
- **testDeviceIdentifiers を `6cf69f5a258c42af022c76908b5f92d8` に更新** — Xcodeコンソールログから取得した実機のAdMobデバイスハッシュ
- **EASクラウドビルドの代替としてローカルビルド（`--local`）を採用** — 無料プランの月次ビルド上限に達したため、`eas build --local` に切り替え。Fastlaneのインストールが必要
- **TestFlightへのアップロードに `xcrun altool` を使用** — App用パスワード（appleid.apple.comで生成）が必要。通常のApple IDパスワードは使用不可
- **ビルド番号管理はEASリモートバージョン管理に依存** — `app.json` の `buildNumber` は無視される設定のため、`eas build:version:set` で番号を更新する必要がある
- **ドキュメント構成を整理** — `DEVFLOW.md` と `DEVMEMO.md` を `DEVGUIDE.md` に統合・削除。`IAP_TROUBLESHOOT.md` は `decisions.md` に統合・削除。`microbusiness_plan.md` を削除し `BUSINESS_PLAN.md` として新規作成
- **`BUSINESS_PLAN.md` を新規作成** — `microbusiness_plan.md` は構成が散漫だったため、個人管理向けに11セクション構成（エグゼクティブサマリー・収益予測・ロードマップ等）で書き直し
- **`REQUIREMENTS.md` に収益化セクションを追加** — MVP時点の要件定義に IAP・AdMob・ATT の要件が未記載だったため追記。フォルダ構成も `purchaseStore.ts`・`useInterstitialAd.ts` を反映

- **UMP（User Messaging Platform）同意フローを `_layout.tsx` に追加** — Google の必須要件。`AdsConsent.requestInfoUpdate()` / `showForm()` を ATT の後・`MobileAds().initialize()` の前に実行する順序に決定
- **TestFlight で広告が表示されない原因は AdMob アカウント審査待ちと判明** — コードの問題ではなくアカウント側の未設定が原因。お支払い情報の入力とアプリストアリンクが必要だった
- **GitHub Pages（nakakei6439.github.io）を開発者ウェブサイトとして採用** — app-ads.txt 設置のため。ルートドメインに `app-ads.txt` を置く必要があるため、ユーザーページ用リポジトリ（`nakakei6439.github.io`）を新規作成
- **マルチアプリ対応のディレクトリ構成を採用** — `nakakei6439.github.io/kondate-cart/` を献立カート専用、ルートを開発者トップページとして分離。将来のアプリはサブディレクトリに追加する方針
- **App Store の `sellerUrl`（マーケティングURL）が app-ads.txt ドメイン照合に使用される** — `supportUrl` ではなく `sellerUrl` が Google のドメイン確認対象。マーケティングURLの設定が必須
- **App Store Connect のプライバシー設定でデバイスID・広告データをトラッキング目的で申告** — `NSUserTrackingUsageDescription` がある場合、これらをトラッキング用途として申告しないと審査提出がブロックされる

- **iCloud の代わりにエクスポート／インポートを先行実装** — iCloud は Provisioning Profile 再設定・実機テスト必須など手間が大きいため、JSONファイルを ShareSheet で保存・DocumentPicker で復元する方式を採用。iCloud はロードマップに残す
- **エクスポート／インポートは無料機能として維持する** — データはユーザー自身のものという考え方が主流（Apple/Google ガイドラインもデータポータビリティを推奨）。「データを人質にする」印象を与えると低評価につながりやすいため、¥300 の課金軸は「広告削除」のみに絞る方針を確認
- **設定歯車アイコンを全タブに設置** — 買い物タブのみにあった設定アイコンを献立タブ（右上・ゴミ箱アイコン横）・履歴タブ（タイトル右端）にも追加。全タブから設定モーダルを開けるようにした
- **`expo-file-system/legacy` を採用** — expo-file-system v19 で旧API（`writeAsStringAsync` 等）が廃止になったため、`expo-file-system/legacy` 経由で使用する方針に決定
- **`importData()` の戻り値を `boolean` に変更** — DocumentPicker キャンセル時にも「インポート完了」アラートが表示されるバグを修正。`false`（キャンセル）/ `true`（成功）を返し、呼び出し元でチェックする

- **1日複数料理対応の型設計: `DishEntry` + `DayRecord` に分割** — `DayEntry`（1料理+note）を廃止。`DishEntry`（料理名+材料のみ）と `DayRecord`（dishes[] + note）に分離し、1日に主菜・副菜など複数料理を管理できるようにした
- **旧データの自動マイグレーションを採用** — `migrateDayRecord()` を `menuStorage.ts` に追加。旧 DayEntry 形式（`dishName`/`ingredients`/`note` がトップレベル）を検出したら自動で新形式に変換。既存ユーザーデータが壊れない
- **献立入力シートを全画面モーダルに変更** — ボトムシート（`transparent=true` + 自前 Animated スライド）から `animationType="slide"` の全画面 Modal に切り替え。`SafeAreaView` でノッチ対応。ヘッダーの「✕」→「‹ 戻る」に変更（iOS ナビゲーション慣習に合わせる）
- **フッターの削除ボタンを廃止** — 献立入力画面下部の「削除」ボタンを削除し、「保存」ボタンのみ全幅表示に変更。削除操作はスワイプ削除に一本化してUIをシンプルに保つ
- **料理削除ボタンをセクションヘッダーから料理名行へ移動** — 複数料理時の削除ボタンがスクロールで隠れる問題を解消。料理名 TextInput 右横にゴミ箱アイコンを配置し、常に見える位置に固定
- **カレンダーセルへの副菜追加＋ボタンは不採用** — 一度実装したが、シンプルさ優先のため削除。副菜追加はシート内の「副菜・もう一品を追加」ボタン経由に統一

## 2026-03-19〜20（App Store 審査対応 / 1.0.2 リリース）

- **ATT ダイアログが iOS 26 で表示されない原因を「タイミング問題」と特定** — `useEffect` は React マウント直後に実行されるが、iOS 17+ では UIWindow が完全にアクティブになる前に `ATTrackingManager.requestTrackingAuthorization()` を呼ぶとダイアログが無音で無視される仕様があった
- **ATT リクエストを `AppState === 'active'` 確認 + 300ms 遅延後に実行するよう変更** — `_layout.tsx` で `AppState.addEventListener` を使い UIWindow の準備完了を待ってから `requestTrackingPermissionsAsync()` を呼ぶ方式に変更。重複実行防止のため `initialized` ref を追加
- **`expo-tracking-transparency` のパッケージ更新は不要と判断** — CHANGELOG を確認した結果、iOS 26 固有の修正は含まれておらず、問題はパッケージではなく呼び出し側のタイミング制御の欠如が原因だった
- **EAS クラウドビルドが月次上限到達のため `xcodebuild` に切り替え** — 無料プランのビルド枠を消費済みだったため、`npm run build:ios:xcode:production` でローカルビルドを実施
- **Xcode の DEVELOPMENT_TEAM を `5Z6T9SM259` → `7PTQ6W4R3T` に修正** — `app.json`・`ExportOptions-production.plist`・`ios/app.xcodeproj/project.pbxproj` の 3 箇所で誤った Team ID が使われていた。Xcode にログイン済みのアカウント（`7PTQ6W4R3T`）に統一
- **アーカイブを `~/Library/Developer/Xcode/Archives/` に移動して Organizer から配布** — `xcodebuild` のカスタム出力パスでは Xcode Organizer に表示されないため、`cp -r` で Xcode のデフォルトアーカイブフォルダに移動後に Distribute App → App Store Connect → Upload を実施
- **TestFlight で ATT ダイアログ表示を確認して修正成功を検証** — 実機の TestFlight ビルドで初回起動時に ATT ダイアログが正しく表示されることを確認。App Store 再申請に進む
- **App Store Connect のマーケティングURLが空欄だったことを確認し設定方針を決定** — AdMob「Verify app」が「app-ads.txt の情報が一致しない」エラーで失敗していた原因。app-ads.txt 自体（`pub-6037843763000573`）は正しく、マーケティングURLの未設定が問題だった。`https://nakakei6439.github.io/kondate-cart/` を設定する方針に決定
- **AdMob「承認状況：要審査」の解消は App Store 審査通過後に行う方針** — マーケティングURL変更はバージョン審査が必要（「変更内容は次のアプリバージョンでリリースされます」）。審査通過後に AdMob「Verify app」を再実行して承認を完了させる

## 2026-03-16

- **副菜追加ボタンをヘッダー右上の⊕アイコンに集約** — スクロールエリア内の大きな点線ボーダーボタン（「副菜・もう一品を追加」）を廃止し、ヘッダー右上の `add-circle-outline` アイコン（Ionicons）のみに変更。4案（アイコンのみ・ピル型・テキストのみ・アイコン+テキスト）の中から案A（アイコンのみ）を採用。コンパクトさと常時表示を両立
- **料理・材料追加時に ScrollView を自動スクロール** — 追加した行が画面外で見えない問題を解消。`scrollRef` + `useEffect([dayDishes])` で料理数・材料総数の増加を検知し `scrollToEnd({ animated: true })` を実行。料理追加と材料追加を1つの useEffect にまとめて重複スクロールを防止

---

## IAP トラブルシューティング

**対象**: 献立カート / RevenueCat (react-native-purchases v9.11.2) / Entitlement ID: `Kondate Cart Premium`

### 最短チェックリスト（ここから始める）

```text
[ ] 1. Expo Go ではなく Development Build を使っているか？
[ ] 2. app.json の plugins に "react-native-purchases" があるか？
[ ] 3. App Store Connect の「有料App」契約がアクティブか？
[ ] 4. App Store Connect に商品（非消耗型）が「準備完了」以上の状態で存在するか？
[ ] 5. RevenueCat に商品・エンタイトルメント・Offering が設定されているか？
[ ] 6. RevenueCat の Entitlement ID が "Kondate Cart Premium" と完全一致しているか？
[ ] 7. サンドボックステスターアカウントで iPhone にサインインしているか？
[ ] 8. ログを確認して具体的なエラーメッセージを把握したか？
```

### 優先度別 原因と解決策

| 優先度 | 症状 | 原因 | 解決策 |
| --- | --- | --- | --- |
| 1 | 購入ダイアログが出ない / 「商品が見つかりません」 | Expo Go で動かしている、または Development Build が古い | EAS Build で新しいビルドを作成してインストール |
| 2 | RevenueCat 初期化がサイレントに失敗 | `app.json` の `plugins` に `react-native-purchases` がない | plugins に追加して EAS Build を再実行 |
| 3 | 「商品が見つかりません」 | RevenueCat の Offering が未設定 / Current 未設定 | Product → Entitlement → Offering → Package の順に設定 |
| 4 | 「商品が見つかりません」/ StoreKit エラー | App Store Connect の商品が「審査待ち」「拒否」など | 商品の状態を確認・修正・再申請 |
| 5 | サンドボックスでも商品取得できない | App Store Connect の「有料App」契約が非アクティブ | 契約・税金・銀行口座でアクティブにする |
| 6 | 購入成功するがプレミアム判定されない | コードの `ENTITLEMENT_ID` と RevenueCat のIDが不一致 | 両方を確認して完全一致させる |
| 7 | 初期化が失敗（ログに ERROR） | iOS用APIキーが誤っている | `appl_` で始まる Public API Key を確認 |

### App Store Connect 設定

- **商品**: 非消耗型・¥300（Tier 3）・状態「準備完了」以上
- **サンドボックステスター**: App Store Connect > ユーザーとアクセス > Sandbox テスター
- **契約**: App Store Connect > 契約・税金・銀行口座 → 「有料App」がアクティブ

### RevenueCat ダッシュボード設定

- **API Key**: `appl_uRhiHIrhrxguepSKJBEQHTQAlvX`（iOS Public Key）
- **Entitlement ID**: `Kondate Cart Premium`（大文字小文字・スペース含め完全一致）
- **Offering**: 「Current」に設定・Package に Product が紐付いていること

### サンドボックステスト手順

1. iPhone 設定 > App Store の一番下「サンドボックスアカウント」でサインイン（iCloud サインアウト不要）
2. EAS Development Build のアプリを起動
3. 設定モーダル > 「広告を消す」をタップ → Apple 購入ダイアログに「[環境: サンドボックス]」が表示されれば正常
4. 購入リセット: iPhone 設定 > App Store > サンドボックスアカウント > 「App内課金の管理」

### よくあるエラーメッセージ

| エラー / 症状 | 対処 |
| --- | --- |
| `商品が見つかりません` | RevenueCat の Offering 設定を確認 |
| StoreKit エラー 0 | ネットワーク確認、しばらく待つ |
| `Invalid product identifier` | App Store Connect の商品IDのスペルを確認 |
| 購入後もプレミアムにならない | Entitlement ID の一致を確認 |
| `This in-app purchase has already been bought` | サンドボックスの購入履歴をリセット |

### デバッグ用ログ有効化

```typescript
// purchaseStore.ts — 開発中のみ
if (__DEV__) {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
}
```

Xcode > Window > Devices and Simulators でログを確認。RevenueCat ダッシュボードの Logs でAPIコールのリアルタイム確認も可能。

---

## AdMob トラブルシューティング

**対象**: 献立カート / react-native-google-mobile-ads v16.2.1 / インタースティシャル広告

### 最短チェックリスト（ここから始める）

```text
[ ] 1. AdMob アカウントが承認済みか？（ダッシュボードで「アカウントが承認されました」表示）
[ ] 2. お支払いプロファイルが入力済みか？
[ ] 3. アプリがストアにリンクされているか？（App Store URL または「ストア未掲載」）
[ ] 4. app-ads.txt がマーケティングURLのドメインのルートに設置されているか？
[ ] 5. App Store Connect のマーケティングURL（sellerUrl）が設定されているか？
[ ] 6. App Store Connect のプライバシー設定でデバイスID・広告データをトラッキング申告済みか？
[ ] 7. AdMob コンソールで「Verify app」を実行済みか？
[ ] 8. 開発時は TestIds を使用しているか（__DEV__ で切り替え済み）？
```

### 優先度別 原因と解決策

| 優先度 | 症状 | 原因 | 解決策 |
|---|---|---|---|
| 1 | TestFlight で広告が出ない | AdMob アカウント審査待ち | 審査完了まで待つ（24〜72時間） |
| 2 | TestFlight で広告が出ない | アプリがストアにリンクされていない | AdMob コンソール → アプリ設定 → ストアを追加（未公開なら「ストア未掲載」） |
| 3 | app-ads.txt エラー | マーケティングURL未設定 | App Store Connect でマーケティングURLを設定（sellerUrl が照合対象） |
| 4 | app-ads.txt エラー | ファイルがルートにない | `https://ドメイン/app-ads.txt` に設置（サブパス不可） |
| 5 | 審査提出できない | プライバシー申告未設定 | App Store Connect → App プライバシー → デバイスID・広告データをトラッキング用途で申告 |
| 6 | 開発中に広告が出ない | TestIds 未使用 | `__DEV__` で `TestIds.INTERSTITIAL` に切り替え |
| 7 | 本番で広告リクエストが0 | UMP 同意フロー未実装 | `AdsConsent.requestInfoUpdate()` を ATT の後・`initialize()` の前に呼ぶ |

### AdMob コンソール設定

- **App ID (iOS)**: `ca-app-pub-6037843763000573~3751863813`
- **インタースティシャル広告ユニット ID**: `ca-app-pub-6037843763000573/8286005190`
- **パブリッシャー ID**: `pub-6037843763000573`
- **app-ads.txt 内容**: `google.com, pub-6037843763000573, DIRECT, f08c47fec0942fa0`
- **app-ads.txt URL**: `https://nakakei6439.github.io/app-ads.txt`

### 初期化の正しい順序（`_layout.tsx`）

```typescript
await requestTrackingPermissionsAsync();          // 1. ATT
const info = await AdsConsent.requestInfoUpdate(); // 2. UMP
if (info.isConsentFormAvailable && info.status === AdsConsentStatus.REQUIRED) {
  await AdsConsent.showForm();
}
await MobileAds().setRequestConfiguration({        // 3. テストデバイス設定
  testDeviceIdentifiers: ['6cf69f5a258c42af022c76908b5f92d8'],
});
await MobileAds().initialize();                    // 4. 初期化
```

### App Store Connect 必須設定

- **マーケティングURL**: `https://nakakei6439.github.io/kondate-cart/`（sellerUrl として app-ads.txt 照合に使用）
- **サポートURL**: `https://nakakei6439.github.io/kondate-cart/`
- **プライバシー申告**: デバイスID・広告データ → 目的: サードパーティ広告 → トラッキング: はい

### GitHub Pages 構成

```
nakakei6439.github.io/
├── app-ads.txt              ← AdMob 検証用（変更不要）
├── index.html               ← 開発者トップ（アプリ一覧）
└── kondate-cart/
    ├── index.html           ← 献立カート サポートページ
    └── privacy-policy.html  ← プライバシーポリシー
```

次のアプリ追加時: `nakakei6439.github.io/新アプリ名/` にページ追加 → `index.html` にカード追記。`app-ads.txt` は変更不要。
