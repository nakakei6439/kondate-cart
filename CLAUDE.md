# CLAUDE.md

週間献立管理 + 買い物リスト自動生成 iOS アプリ（React Native / Expo）

## ルール

- 回答は必ず日本語
- セッション末に重要な決定を `decisions.md` へ追記する（セミオート：Claude が自発的に実施）
- 手動で記録したい場合は `/decisions` コマンドを使う
- カスタムコマンドを `.claude/commands/` に追加したら `COMMANDS.md` にも追記する

## カスタムコマンドの作り方

### ファイル配置

```
.claude/commands/コマンド名.md   ← コマンド本体
COMMANDS.md                      ← 一覧への追記（必須）
```

### コマンドファイルの書き方（`.claude/commands/コマンド名.md`）

```markdown
コマンドの説明（1〜2行）

手順：
1. ステップ1
2. ステップ2
...

完了後、追記内容を日本語で簡潔に報告する
```

### ルール

- ファイル名 = スラッシュコマンド名（例: `decisions.md` → `/decisions`）
- 冒頭に目的・トリガー条件を明記する
- 手順は番号付きリストで書く
- 完了報告の指示を末尾に入れる
- 作成後は必ず `COMMANDS.md` に概要を追記する

## ドキュメント

- [REQUIREMENTS.md](REQUIREMENTS.md) — 要件定義・データモデル・機能仕様
- [DEVGUIDE.md](DEVGUIDE.md) — 環境構築・開発フロー・設定値
- [COMMANDS.md](COMMANDS.md) — Claude Code スラッシュコマンド一覧
- [decisions.md](decisions.md) — 意思決定ログ
- [BUSINESS_PLAN.md](BUSINESS_PLAN.md) — 事業計画書（収益目標・ロードマップ）

## 新しいアプリをリリースするときのチェックリスト

### RevenueCat（IAP）
- [ ] App Store Connect に商品（非消耗型）を作成し「準備完了」状態にする
- [ ] RevenueCat に Product → Entitlement → Offering → Package を設定する
- [ ] App Store Connect の「有料App」契約がアクティブか確認する
- [ ] **App Store 審査を通過しないと本番 IAP は使えない**（サンドボックスのみ動作）

### AdMob（広告）
- [ ] AdMob コンソールにアプリを追加し、広告ユニット ID を発行する
- [ ] `app.json` の `iosAppId` と `androidAppId` を更新する
- [ ] `nakakei6439.github.io` に新アプリ用サポートページを追加する（`/新アプリ名/index.html`）
- [ ] App Store Connect のマーケティングURL に `https://nakakei6439.github.io/新アプリ名/` を設定する（`sellerUrl` として app-ads.txt 照合に使われる）
- [ ] App Store Connect のプライバシー設定でデバイスID・広告データをトラッキング用途で申告する
- [ ] AdMob コンソールでアプリをストアにリンクし「Verify app」を実行する
- [ ] **AdMob の審査を通過しないと本番広告は配信されない**（テスト広告 `TestIds` は審査前でも使用可）

### 両方に共通
- **App Store 審査と AdMob 審査は別々のプロセス**。どちらか一方が完了しても、もう一方が未完了なら本番では動作しない
- app-ads.txt（`https://nakakei6439.github.io/app-ads.txt`）は複数アプリで共通・変更不要

## Git ルール

- `main` は常にリリース可能な状態を維持
- 作業は `feature/*` ブランチで行い、PR → squash マージ
- `git push`・PR作成・マージは必ずユーザー確認を取ってから実行
- `--force`・`--no-verify`・main 直接 push は禁止
- コミット規約: `feat/fix/refactor/style/docs/chore: メッセージ`
