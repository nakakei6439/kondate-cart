import React from 'react';
import { useTranslation } from 'react-i18next';
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
import { useMenuStore } from '../store/menuStore';
import { useDishStore } from '../store/dishStore';
import { exportData, importData, seedDummyData } from '../storage/exportStorage';

const PRIVACY_POLICY_URL = 'https://nakakei6439.github.io/kondate-cart/privacy-policy.html';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { isPremium, isLoading, offeringPrice, purchasePremium, restorePurchases, resetPremium } = usePurchaseStore();
  const { weekKey, loadWeekMenu } = useMenuStore();
  const { loadDishes } = useDishStore();

  async function handleExport() {
    try {
      await exportData();
    } catch (e: unknown) {
      Alert.alert(t('settings.exportErrorTitle'), e instanceof Error ? e.message : t('settings.exportErrorDefault'));
    }
  }

  async function handleImport() {
    Alert.alert(
      t('settings.importConfirmTitle'),
      t('settings.importConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.importOverwrite'),
          style: 'destructive',
          onPress: async () => {
            try {
              const imported = await importData();
              if (!imported) return;
              await Promise.all([loadWeekMenu(weekKey), loadDishes()]);
              Alert.alert(t('settings.importSuccessTitle'), t('settings.importSuccessMessage'));
            } catch (e: unknown) {
              Alert.alert(t('settings.importErrorTitle'), e instanceof Error ? e.message : t('settings.importErrorDefault'));
            }
          },
        },
      ]
    );
  }

  async function handlePurchase() {
    const result = await purchasePremium();
    if (result.success) {
      Alert.alert(t('settings.purchaseSuccessTitle'), t('settings.purchaseSuccessMessage'));
    } else if (result.error) {
      Alert.alert(t('settings.purchaseErrorTitle'), result.error);
    }
  }

  async function handleRestore() {
    const result = await restorePurchases();
    if (!result.success) {
      Alert.alert(t('settings.restoreErrorTitle'), result.error ?? t('settings.restoreErrorDefault'));
    } else if (result.restored) {
      Alert.alert(t('settings.restoreSuccessTitle'), t('settings.restoreSuccessMessage'));
    } else {
      Alert.alert(t('settings.restoreNothingTitle'), t('settings.restoreNothingMessage'));
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
          <Text style={styles.title}>{t('settings.title')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* プレミアムセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.premiumSection')}</Text>

          {isPremium ? (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>{t('settings.premiumPurchased')}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.premiumDesc}>{t('settings.premiumDesc')}</Text>
              <TouchableOpacity
                style={[styles.purchaseBtn, isLoading && styles.btnDisabled]}
                onPress={handlePurchase}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.purchaseBtnText}>{t('settings.purchaseBtn')}{offeringPrice ? `  ${offeringPrice}` : ''}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.restoreBtn, isLoading && styles.btnDisabled]}
                onPress={handleRestore}
                disabled={isLoading}
              >
                <Text style={styles.restoreBtnText}>{t('settings.restoreBtn')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* デバッグセクション（開発時のみ） */}
        {__DEV__ && (
          <View style={styles.devSection}>
            <Text style={styles.sectionLabel}>{t('settings.debugSection')}</Text>
            <TouchableOpacity
              style={styles.devBtn}
              onPress={async () => {
                await resetPremium();
                Alert.alert(t('settings.resetSuccessTitle'), t('settings.resetSuccessMessage'));
              }}
            >
              <Text style={styles.devBtnText}>{t('settings.resetPremiumBtn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devBtn, { marginTop: 8 }]}
              onPress={async () => {
                await seedDummyData();
                await Promise.all([loadWeekMenu(weekKey), loadDishes()]);
                Alert.alert(t('settings.dummySuccessTitle'), t('settings.dummySuccessMessage'));
              }}
            >
              <Text style={styles.devBtnText}>{t('settings.addDummyBtn')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* データ管理セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.dataSection')}</Text>
          <TouchableOpacity style={styles.linkRow} onPress={handleExport}>
            <Text style={styles.linkText}>{t('settings.export')}</Text>
            <Text style={styles.linkChevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.linkRow} onPress={handleImport}>
            <Text style={styles.importText}>{t('settings.import')}</Text>
            <Text style={styles.linkChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* リンクセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.otherSection')}</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          >
            <Text style={styles.linkText}>{t('settings.privacyPolicy')}</Text>
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
  devSection: {
    backgroundColor: '#FFF3CD',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  devBtn: {
    backgroundColor: '#FF9500',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  devBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
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
  separator: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginVertical: 4,
  },
  importText: {
    fontSize: 15,
    color: '#FF3B30',
  },
});
