# コマンド一覧

Claude Code で使えるスラッシュコマンドの一覧です。

---

## `/save`

現在の変更を GitHub に保存する。

- `git status` で変更確認 → ステージング → コミット → push まで自動実行
- コミットメッセージは変更内容から自動生成（`feat/fix/docs/chore/style` 形式）

```text
/save
```

---

## `/decisions`

このセッションで行われた重要な決定を記録する。

- 現セッションの意思決定を洗い出して整理する
- 既存エントリとの重複はスキップ
- セッション末に Claude が自動実施するが、途中で手動記録したい場合にも使える

> **注意**: `decisions.md` は現在このリポジトリに存在しない。記録が必要な場合は別途ファイルを作成すること。

```text
/decisions
```

---

## `/usage`

Claude API の利用残高・使用量を確認する。

- Anthropic コンソールの請求ページと使用量ページをブラウザで開く

```text
/usage
```

---

## ローカル iOS ビルド（EAS クォータ消費なし）

EAS クラウドを使わず、ローカル Mac で IPA をビルドする。
出力先: `dist/ipa/app-{profile}.ipa`

### npm コマンド

| コマンド | プロファイル | 方式 |
| --- | --- | --- |
| `npm run build:ios` | preview（デフォルト） | eas build --local |
| `npm run build:ios:dev` | development | eas build --local |
| `npm run build:ios:preview` | preview | eas build --local |
| `npm run build:ios:production` | production | eas build --local |
| `npm run build:ios:xcode:preview` | preview | 純粋な xcodebuild |
| `npm run build:ios:xcode:production` | production | 純粋な xcodebuild |

### 直接実行

```bash
# eas build --local（推奨 — 証明書を EAS が自動処理）
./scripts/build-ios.sh preview
./scripts/build-ios.sh production

# 純粋な xcodebuild（EAS 不要 / Keychain に Distribution 証明書が必要）
./scripts/build-ios.sh preview --xcodebuild
./scripts/build-ios.sh production --xcodebuild
```

### eas build --local と xcodebuild の違い

| 項目 | eas build --local | xcodebuild |
| --- | --- | --- |
| EAS クォータ消費 | なし | なし |
| 証明書管理 | EAS が自動処理 | Keychain に Distribution 証明書が必要 |
| ExportOptions.plist | 不要 | `scripts/ExportOptions-{profile}.plist` が必要 |
| オフライン動作 | 不可（初回認証が必要） | 可 |

### TestFlight / App Store 提出

ローカルビルドの IPA を EAS submit で提出できる:

```bash
eas submit --platform ios --path dist/ipa/app-production.ipa
```
