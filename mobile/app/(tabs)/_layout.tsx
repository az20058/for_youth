import { Tabs } from 'expo-router';
import { Home, Briefcase, Calendar } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FE6E6E',
        tabBarInactiveTintColor: '#9C9C9C',
        tabBarStyle: {
          backgroundColor: '#1C1C1E',
          borderTopColor: 'rgba(255,255,255,0.1)',
          borderTopWidth: 1,
          height: 56,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#1C1C1E',
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontSize: 14,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: '지원 현황',
          tabBarIcon: ({ color }) => <Briefcase size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: '일정',
          tabBarIcon: ({ color }) => <Calendar size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
