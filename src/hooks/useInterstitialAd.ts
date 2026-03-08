import { useEffect, useRef } from 'react';
import {
  AdEventType,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';
import { usePurchaseStore } from '../store/purchaseStore';

const AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-6037843763000573/8286005190';

export function useInterstitialAd() {
  const isPremium = usePurchaseStore((s) => s.isPremium);
  const adRef = useRef<InterstitialAd | null>(null);
  const onAdClosedRef = useRef<(() => void) | null>(null);
  const loadedRef = useRef(false);

  function loadAd() {
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_ID);
    ad.addAdEventListener(AdEventType.LOADED, () => {
      loadedRef.current = true;
    });
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      loadedRef.current = false;
      onAdClosedRef.current?.();
      onAdClosedRef.current = null;
      loadAd(); // 次回のために再ロード
    });
    ad.addAdEventListener(AdEventType.ERROR, () => {
      loadedRef.current = false;
    });
    ad.load();
    adRef.current = ad;
  }

  useEffect(() => {
    loadAd();
  }, []);

  function showAd(onAdClosed: () => void) {
    // プレミアム購入済みの場合は広告をスキップ
    if (isPremium) {
      onAdClosed();
      return;
    }
    if (loadedRef.current && adRef.current) {
      onAdClosedRef.current = onAdClosed;
      adRef.current.show();
    } else {
      // 広告未ロードの場合は即コールバック実行
      onAdClosed();
    }
  }

  return { showAd };
}
