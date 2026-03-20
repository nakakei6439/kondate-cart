import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MobileAds, { AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { usePurchaseStore } from '../src/store/purchaseStore';

export default function Layout() {
  const initPurchases = usePurchaseStore((s) => s.initPurchases);
  const initialized = useRef(false);

  useEffect(() => {
    const initAds = async () => {
      if (initialized.current) return;
      initialized.current = true;

      // iOS 17+ では UIWindow が完全にアクティブになる前に ATT を呼ぶとダイアログが無視される。
      // AppState が active になった後 300ms 待機することで表示を確実にする。
      await new Promise<void>((resolve) => setTimeout(resolve, 300));

      await requestTrackingPermissionsAsync();
      const consentInfo = await AdsConsent.requestInfoUpdate();
      if (
        consentInfo.isConsentFormAvailable &&
        consentInfo.status === AdsConsentStatus.REQUIRED
      ) {
        await AdsConsent.showForm();
      }
      await MobileAds().setRequestConfiguration({
        testDeviceIdentifiers: ['6cf69f5a258c42af022c76908b5f92d8'],
      });
      await MobileAds().initialize();
      initPurchases();
    };

    if (AppState.currentState === 'active') {
      initAds();
    } else {
      const subscription = AppState.addEventListener(
        'change',
        (nextState: AppStateStatus) => {
          if (nextState === 'active') {
            subscription.remove();
            initAds();
          }
        }
      );
      return () => subscription.remove();
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#E8692A',
          tabBarInactiveTintColor: '#9E9E9E',
          tabBarStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarLabel: '献立',
            tabBarIcon: ({ color }) => (
              <Ionicons name="restaurant-outline" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="shopping"
          options={{
            tabBarLabel: '買い物',
            tabBarIcon: ({ color }) => (
              <Ionicons name="cart-outline" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            tabBarLabel: '履歴',
            tabBarIcon: ({ color }) => (
              <Ionicons name="time-outline" size={22} color={color} />
            ),
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}
