import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { usePurchaseStore } from '../store/purchaseStore';

const PRIVACY_POLICY_URL = 'https://nakakei6439.github.io/kondate-cart/privacy-policy.html';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: Props) {
  const { isPremium, isLoading, offeringPrice, purchasePremium, restorePurchases } = usePurchaseStore();

  async function handlePurchase() {
    const result = await purchasePremium();
    if (result.success) {
      Alert.alert('購入完了', '広告が非表示になりました。ありがとうございます！');
    } else if (result.error) {
      Alert.alert('購入エラー', result.error);
    }
  }

  async function handleRestore() {
    const result = await restorePurchases();
    if (!result.success) {
      Alert.alert('復元エラー', result.error ?? '復元に失敗しました');
    } else if (result.restored) {
      Alert.alert('復元完了', '購入が復元されました。広告が非表示になりました。');
    } else {
      Alert.alert('復元結果', '復元できる購入履歴が見つかりませんでした。');
    }
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>設定</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* プレミアムセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>プレミアム</Text>

          {isPremium ? (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>✓  広告なし（購入済み）</Text>
            </View>
          ) : (
            <>
              <Text style={styles.premiumDesc}>
                広告を非表示にします。一度の購入で永続的に有効です。
              </Text>
              <TouchableOpacity
                style={[styles.purchaseBtn, isLoading && styles.btnDisabled]}
                onPress={handlePurchase}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.purchaseBtnText}>広告を消す{offeringPrice ? `  ${offeringPrice}` : ''}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.restoreBtn, isLoading && styles.btnDisabled]}
                onPress={handleRestore}
                disabled={isLoading}
              >
                <Text style={styles.restoreBtnText}>購入を復元</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* リンクセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>その他</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          >
            <Text style={styles.linkText}>プライバシーポリシー</Text>
            <Text style={styles.linkChevron}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: '#C7C7CC',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 18, color: '#8E8E93' },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  premiumBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  premiumBadgeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E7D32',
  },
  premiumDesc: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 14,
  },
  purchaseBtn: {
    backgroundColor: '#E8692A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#E8692A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  purchaseBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  restoreBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  restoreBtnText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 15,
    color: '#1C1C1E',
  },
  linkChevron: {
    fontSize: 18,
    color: '#C7C7CC',
  },
});
