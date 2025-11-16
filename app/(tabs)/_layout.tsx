import { Tabs } from 'expo-router';
import { Home, CreditCard, FileText, ShoppingBag, TrendingUp } from 'react-native-feather';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home color={color} width={24} height={24} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          tabBarIcon: ({ color }) => <CreditCard color={color} width={24} height={24} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color }) => <TrendingUp color={color} width={24} height={24} />,
        }}
      />
      <Tabs.Screen
        name="receipts"
        options={{
          title: 'Receipts',
          tabBarIcon: ({ color }) => <ShoppingBag color={color} width={24} height={24} />,
        }}
      />
      <Tabs.Screen
        name="statements"
        options={{
          title: 'Statements',
          tabBarIcon: ({ color }) => <FileText color={color} width={24} height={24} />,
        }}
      />
      <Tabs.Screen
        name="account/[id]"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
