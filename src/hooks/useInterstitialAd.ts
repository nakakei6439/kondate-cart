import { useEffect, useRef } from 'react';
import {
  AdEventType,
  InterstitialAd,
  RequestOptions,
  TestIds,
} from 'react-native-google-mobile-ads';
import { usePurchaseStore } from '../store/purchaseStore';

const AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-6037843763000573/8286005190';

const REQUEST_OPTIONS: RequestOptions = {
  requestNonPersonalizedAdsOnly: false,
};

export function useInterstitialAd() {
  const isPremium = usePurchaseStore((s) => s.isPremium);
  const adRef = useRef<InterstitialAd | null>(null);
  const onAdClosedRef = useRef<(() => void) | null>(null);
  const pendingCallbackRef = useRef<(() => void) | null>(null);
  const loadedRef = useRef(false);

  function loadAd() {
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_ID, REQUEST_OPTIONS);
    ad.addAdEventListener(AdEventType.LOADED, () => {
      loadedRef.current = true;
      // showAd 呼び出し時に未ロードだった場合、ロード完了後に即表示
      if (pendingCallbackRef.current) {
        onAdClosedRef.current = pendingCallbackRef.current;
        pendingCallbackRef.current = null;
        ad.show();
      }
    });
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      loadedRef.current = false;
      onAdClosedRef.current?.();
      onAdClosedRef.current = null;
      loadAd(); // 次回のために再ロード
    });
    ad.addAdEventListener(AdEventType.ERROR, () => {
      loadedRef.current = false;
      // ロード失敗時は pending callback をスキップ実行して再ロード
      if (pendingCallbackRef.current) {
        pendingCallbackRef.current();
        pendingCallbackRef.current = null;
      }
      loadAd();
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
      // 広告未ロードの場合はロード完了まで待機
      pendingCallbackRef.current = onAdClosed;
    }
  }

  return { showAd };
}
