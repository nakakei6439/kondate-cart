import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { create } from 'zustand';

const REVENUECAT_API_KEY = 'appl_uRhiHIrhrxguepSKJBEQHTQAlvX';
const ENTITLEMENT_ID = 'Kondate Cart Premium';
const PREMIUM_STORAGE_KEY = '@is_premium';

interface PurchaseState {
  isPremium: boolean;
  isLoading: boolean;
  offeringPrice: string | null;
  initPurchases: () => Promise<void>;
  purchasePremium: () => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; restored: boolean; error?: string }>;
  resetPremium: () => Promise<void>;
}

export const usePurchaseStore = create<PurchaseState>((set) => ({
  isPremium: false,
  isLoading: false,
  offeringPrice: null,

  initPurchases: async () => {
    try {
      // キャッシュから即時反映
      const cached = await AsyncStorage.getItem(PREMIUM_STORAGE_KEY);
      if (cached === 'true') {
        set({ isPremium: true });
      }

      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }
      Purchases.configure({ apiKey: REVENUECAT_API_KEY });

      // RevenueCat でエンタイトルメントを確認
      const customerInfo = await Purchases.getCustomerInfo();
      const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, isPremium ? 'true' : 'false');

      // Offering から価格を取得
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages[0];
      const offeringPrice = pkg?.product.priceString ?? null;

      set({ isPremium, offeringPrice });
    } catch {
      // 初期化エラーはサイレントに処理（広告は表示される）
    }
  },

  purchasePremium: async () => {
    set({ isLoading: true });
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages[0];
      if (!pkg) {
        set({ isLoading: false });
        return { success: false, error: '商品が見つかりません' };
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, isPremium ? 'true' : 'false');
      set({ isPremium, isLoading: false });
      return { success: true };
    } catch (e: unknown) {
      console.error('[IAP] purchasePremium error:', JSON.stringify(e), e);
      set({ isLoading: false });
      // ユーザーキャンセルは正常扱い
      if (e && typeof e === 'object' && 'userCancelled' in e && (e as { userCancelled: boolean }).userCancelled) {
        return { success: false };
      }
      return { success: false, error: '購入に失敗しました' };
    }
  },

  restorePurchases: async () => {
    set({ isLoading: true });
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, isPremium ? 'true' : 'false');
      set({ isPremium, isLoading: false });
      return { success: true, restored: isPremium };
    } catch {
      set({ isLoading: false });
      return { success: false, restored: false, error: '復元に失敗しました' };
    }
  },

  resetPremium: async () => {
    await AsyncStorage.removeItem(PREMIUM_STORAGE_KEY);
    set({ isPremium: false, offeringPrice: null });
  },
}));
