# 開発メモ

重要な設定値・技術的な注意点をまとめたメモ。

---

## アプリ基本情報

| 項目 | 値 |
|------|-----|
| アプリ名 | 献立カート |
| Bundle ID | `com.nakakei6439.kondatecart` |
| Expo SDK | 54 |
| React Native | 0.81.5 |

---

## IAP（アプリ内課金）

| 項目 | 値 |
|------|-----|
| ライブラリ | react-native-purchases v9.11.2（RevenueCat） |
| 商品 | 広告除去 買い切り ¥300 |
| Entitlement ID | `Kondate Cart Premium` |

> IAP は Expo Go では動作しない。EAS Development Build が必要。
> トラブル時は `IAP_TROUBLESHOOT.md` を参照。

---

## 広告（AdMob）

| 項目 | 値 |
|------|-----|
| ライブラリ | react-native-google-mobile-ads v16 |
| 表示条件 | `Kondate Cart Premium` 未購入ユーザーのみ |

---

## 環境・ビルド

| 項目 | 値 |
|------|-----|
| Node.js PATH | `/Users/nakagawakeita/node-bin/bin` |
| npm install | `--legacy-peer-deps` が必要 |
| EAS profile | `development` / `preview` / `production` |

---

## 現在のフェーズ

Phase 1: IAP + AdMob 実装中

収益化の詳細計画は `microbusiness_plan.md` を参照。

---

## 注意事項

- コンポーネントは `src/components/` に配置する（`app/` 直下に置くと余分なタブが生成される）
- `GestureHandlerRootView` で `_layout.tsx` 全体をラップすること
