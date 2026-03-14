# CLAUDE.md

週間献立管理 + 買い物リスト自動生成 iOS アプリ（React Native / Expo）

## ルール

- 回答は必ず日本語
- セッション末に重要な決定を `decisions.md` へ追記する（セミオート：Claude が自発的に実施）
- 手動で記録したい場合は `/decisions` コマンドを使う
- カスタムコマンドを `.claude/commands/` に追加したら `COMMANDS.md` にも追記する

## ドキュメント

- [REQUIREMENTS.md](REQUIREMENTS.md) — 要件定義・データモデル・機能仕様
- [DEVGUIDE.md](DEVGUIDE.md) — 環境構築・開発フロー・設定値
- [COMMANDS.md](COMMANDS.md) — Claude Code スラッシュコマンド一覧
- [decisions.md](decisions.md) — 意思決定ログ
- [BUSINESS_PLAN.md](BUSINESS_PLAN.md) — 事業計画書（収益目標・ロードマップ）

## Git ルール

- `main` は常にリリース可能な状態を維持
- 作業は `feature/*` ブランチで行い、PR → squash マージ
- `git push`・PR作成・マージは必ずユーザー確認を取ってから実行
- `--force`・`--no-verify`・main 直接 push は禁止
- コミット規約: `feat/fix/refactor/style/docs/chore: メッセージ`
