# 献立カート / Kondate Cart

週単位で夕食の献立を管理し、買い物リストを自動生成する iOS アプリ。

## 機能

### 献立タブ 🍽️
- 来週の献立をデフォルト表示（前週・次週ナビあり）
- 曜日タップ → 料理名・材料・メモを入力
- 過去の料理履歴から検索・選択して材料を再利用
- 未保存で閉じると保存確認ダイアログを表示

### 買い物リストタブ 🛒
- **来週** / **再来週まで** の切り替え
- 献立の材料を自動集計
- タップでチェック済みに（購入済みセクションに移動）
- 左スワイプで削除
- 再生成ボタンで献立から再集計

### 履歴タブ 📋
- 過去に登録した料理の一覧（新しい順）
- 料理名で検索・絞り込み
- タップで料理名・材料を編集
- 左スワイプで削除

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | React Native (Expo SDK 54) |
| 言語 | TypeScript |
| ナビゲーション | Expo Router v6 |
| 状態管理 | Zustand v5 |
| 永続化 | AsyncStorage |

## 起動方法

```bash
export PATH="/Users/nakagawakeita/node-bin/bin:$PATH"
npm install --legacy-peer-deps
npx expo start
```

iPhone の Expo Go アプリでQRコードをスキャン。

## フォルダ構成

```
app/
├── _layout.tsx     # タブ定義（3タブ）
├── index.tsx       # 献立画面
├── shopping.tsx    # 買い物リスト
└── history.tsx     # 料理履歴

src/
├── components/     # UIコンポーネント（app/外に配置）
├── store/          # Zustand ストア
├── storage/        # AsyncStorage CRUD
├── types/          # 型定義
└── utils/          # ユーティリティ
```
