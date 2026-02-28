import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Layout() {
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
              <Text style={{ fontSize: 20, color }}>🍽️</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="shopping"
          options={{
            tabBarLabel: '買い物',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>🛒</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            tabBarLabel: '履歴',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>📋</Text>
            ),
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}
