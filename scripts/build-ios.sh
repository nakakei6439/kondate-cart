#!/usr/bin/env bash
# =============================================================================
# build-ios.sh — ローカル iOS IPA ビルド（EAS クラウドクォータ消費なし）
#
# 使い方:
#   ./scripts/build-ios.sh [profile] [--xcodebuild]
#
# 引数:
#   profile      development | preview | production  (デフォルト: preview)
#   --xcodebuild  eas build --local の代わりに純粋な xcodebuild を使用
#
# 例:
#   ./scripts/build-ios.sh                          # preview / eas --local
#   ./scripts/build-ios.sh production               # production / eas --local
#   ./scripts/build-ios.sh production --xcodebuild  # production / xcodebuild
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# 環境
# ---------------------------------------------------------------------------
export PATH="/Users/nakagawakeita/node-bin/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
IOS_DIR="$PROJECT_ROOT/ios"
OUTPUT_DIR="$PROJECT_ROOT/dist/ipa"

# ---------------------------------------------------------------------------
# 引数解析
# ---------------------------------------------------------------------------
PROFILE="${1:-preview}"
USE_XCODEBUILD=false

for arg in "$@"; do
  if [[ "$arg" == "--xcodebuild" ]]; then
    USE_XCODEBUILD=true
  fi
done

# --xcodebuild だけ渡された場合
if [[ "$PROFILE" == "--xcodebuild" ]]; then
  PROFILE="preview"
  USE_XCODEBUILD=true
fi

# プロファイルのバリデーション
case "$PROFILE" in
  development|preview|production) ;;
  *)
    echo "ERROR: 不明なプロファイル '$PROFILE'。使用可能: development | preview | production"
    exit 1
    ;;
esac

# ---------------------------------------------------------------------------
# 定数
# ---------------------------------------------------------------------------
WORKSPACE="$IOS_DIR/app.xcworkspace"
SCHEME="app"
ARCHIVE_PATH="$IOS_DIR/build/app-${PROFILE}.xcarchive"

# ---------------------------------------------------------------------------
# ヘルパー
# ---------------------------------------------------------------------------
log()  { echo "[build-ios] $*"; }
fail() { echo "[build-ios] ERROR: $*" >&2; exit 1; }

require_tool() {
  command -v "$1" >/dev/null 2>&1 || fail "'$1' が見つかりません。$2"
}

mkdir -p "$OUTPUT_DIR"

# ---------------------------------------------------------------------------
# 事前チェック
# ---------------------------------------------------------------------------
log "プロファイル: $PROFILE | モード: $([ "$USE_XCODEBUILD" = true ] && echo xcodebuild || echo eas-local)"
log "プロジェクトルート: $PROJECT_ROOT"

require_tool "node"       "PATH に /Users/nakagawakeita/node-bin/bin を追加してください。"
require_tool "xcodebuild" "Mac App Store から Xcode をインストールしてください。"

[[ -d "$WORKSPACE" ]] || fail "ワークスペースが見つかりません: $WORKSPACE。先に 'npx expo prebuild' を実行してください。"

# ---------------------------------------------------------------------------
# ビルド: eas build --local（推奨）
# ---------------------------------------------------------------------------
build_eas_local() {
  require_tool "eas" "次のコマンドでインストール: npm install -g eas-cli"

  log "eas build --local --profile $PROFILE --platform ios を開始..."
  log "IPA はプロジェクトルートに出力後、$OUTPUT_DIR へ移動します"

  cd "$PROJECT_ROOT"

  eas build \
    --local \
    --profile "$PROFILE" \
    --platform ios \
    --non-interactive

  # EAS ローカルビルドは .ipa をプロジェクトルートにタイムスタンプ付きで出力する
  IPA_FILE=$(ls -t "$PROJECT_ROOT"/*.ipa 2>/dev/null | head -1 || true)
  if [[ -n "$IPA_FILE" ]]; then
    DEST="$OUTPUT_DIR/app-${PROFILE}.ipa"
    mv "$IPA_FILE" "$DEST"
    log "IPA 保存先: $DEST"
  else
    log "WARNING: プロジェクトルートに .ipa が見つかりません。EAS の出力ログを確認してください。"
  fi
}

# ---------------------------------------------------------------------------
# ビルド: 純粋な xcodebuild（オフライン / フォールバック）
# ---------------------------------------------------------------------------
build_xcodebuild() {
  log "xcodebuild archive を開始（プロファイル: ${PROFILE}）..."

  case "$PROFILE" in
    development)
      CONFIGURATION="Debug"
      ;;
    preview|production)
      CONFIGURATION="Release"
      ;;
  esac

  EXPORT_OPTIONS_PLIST="$SCRIPT_DIR/ExportOptions-${PROFILE}.plist"

  [[ -f "$EXPORT_OPTIONS_PLIST" ]] || fail \
    "ExportOptions plist が見つかりません: $EXPORT_OPTIONS_PLIST"

  log "Step 1/2: アーカイブ..."
  xcodebuild \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -archivePath "$ARCHIVE_PATH" \
    -destination "generic/platform=iOS" \
    CODE_SIGN_STYLE="Automatic" \
    -allowProvisioningUpdates \
    clean archive

  [[ -d "$ARCHIVE_PATH" ]] || fail "アーカイブが作成されませんでした: $ARCHIVE_PATH"

  log "Step 2/2: IPA エクスポート..."
  xcodebuild \
    -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
    -exportPath "$OUTPUT_DIR" \
    -allowProvisioningUpdates

  log "IPA エクスポート先: $OUTPUT_DIR"
  ls -lh "$OUTPUT_DIR"/*.ipa 2>/dev/null || log "WARNING: $OUTPUT_DIR に .ipa が見つかりません"
}

# ---------------------------------------------------------------------------
# 実行
# ---------------------------------------------------------------------------
if [[ "$USE_XCODEBUILD" == true ]]; then
  build_xcodebuild
else
  build_eas_local
fi

log "完了。"
