# 献立カート / Kondate Cart

週単位で夕食の献立を管理し、買い物リストを自動生成する iOS アプリ。

## 機能

### 献立タブ
- 来週の献立をデフォルト表示（前週・次週ナビあり）
- 曜日タップ → 料理名・材料・メモを入力
- **1日に複数の料理を登録可能**（料理をまとめてスワイプ削除）
- 過去の料理履歴から検索・選択して材料を再利用
- 曜日行を左スワイプ → その日の献立を削除
- 未保存で閉じると保存確認ダイアログを表示

### 買い物リストタブ
- **来週** / **再来週まで** の切り替え
- 献立の材料を自動集計
- タップでチェック済みに（購入済みセクションに移動）
- 左スワイプで削除
- 再生成ボタンで献立から再集計
- 手動でアイテムを追加可能

### 履歴タブ
- 過去に登録した料理の一覧（今週・先週・今月・それ以前）
- 料理名で検索・絞り込み
- 左スワイプで削除
- タップで料理名・材料を編集（削除ボタンあり）

### 設定
- プレミアム購入・復元（広告削除 ¥300 買い切り）
- データのエクスポート / インポート（JSON バックアップ）
- プライバシーポリシー
- バージョン表示

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | React Native (Expo SDK 54) |
| 言語 | TypeScript |
| ナビゲーション | Expo Router v6 |
| 状態管理 | Zustand v5 |
| 永続化 | AsyncStorage |
| 多言語対応 | i18next / react-i18next（日・英・中・韓・西） |
| 広告 | react-native-google-mobile-ads（インタースティシャル） |
| IAP・課金管理 | react-native-purchases / RevenueCat |
| トラッキング許可 | expo-tracking-transparency（ATT） |
| 同意管理 | GoogleUserMessagingPlatform（UMP） |
| レビュー誘導 | expo-store-review（SKStoreReviewAPI） |

## 収益化

- **広告（無料ユーザー）**: 買い物リスト再生成時にインタースティシャル広告を表示（AdMob）
- **プレミアム（¥300 買い切り）**: 広告非表示。RevenueCat で管理

## 起動方法

```bash
export PATH="/Users/nakagawakeita/node-bin/bin:$PATH"
npm install --legacy-peer-deps
npx expo start
```

iPhone の Expo Go アプリでQRコードをスキャン。

> 広告・IAP を含む機能のテストは Development Build が必要（Expo Go では動作しない）

## ビルド

```bash
# ローカルビルド（EAS クォータ消費なし）
npm run build:ios:xcode:production  # production（xcodebuild）
npm run build:ios:production        # production（eas build --local）

# TestFlight 提出
eas submit --platform ios --path dist/ipa/app-production.ipa
```

詳細は [DEVGUIDE.md](DEVGUIDE.md) を参照。

## フォルダ構成

```
app/
├── _layout.tsx     # タブ定義・AdMob/ATT/UMP 初期化
├── index.tsx       # 献立画面
├── shopping.tsx    # 買い物リスト
└── history.tsx     # 料理履歴

src/
├── components/     # UIコンポーネント
├── hooks/          # カスタムフック（useInterstitialAd・useReviewPrompt）
├── i18n/           # 多言語リソース（ja/en/zh/ko/es）
├── store/          # Zustand ストア
├── storage/        # AsyncStorage CRUD・エクスポート
├── types/          # 型定義
└── utils/          # ユーティリティ
```

## ドキュメント

- [REQUIREMENTS.md](REQUIREMENTS.md) — 要件定義・データモデル・機能仕様
- [DEVGUIDE.md](DEVGUIDE.md) — 環境構築・開発フロー・設定値
- [COMMANDS.md](COMMANDS.md) — Claude Code スラッシュコマンド一覧
- [docs/DEV_HISTORY.md](docs/DEV_HISTORY.md) — 開発履歴・トラブルシューティング
