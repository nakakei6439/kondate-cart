import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : 'ca-app-pub-6037843763000573/XXXXXXXXXX'; // TODO: AdMob で作成したバナー広告ユニット ID に置き換える

export function AdBanner() {
  return (
    <BannerAd
      unitId={AD_UNIT_ID}
      size={BannerAdSize.BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
    />
  );
}
