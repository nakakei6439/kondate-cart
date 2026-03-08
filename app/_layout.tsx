import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { usePurchaseStore } from '../src/store/purchaseStore';

export default function Layout() {
  const initPurchases = usePurchaseStore((s) => s.initPurchases);

  useEffect(() => {
    initPurchases();
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
