import { Tabs } from 'expo-router';
import { Home, Briefcase, Calendar, User } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { onTabChange } from '../../components/tabDirection';

function HeaderTitle() {
  return (
    <View style={headerStyles.container}>
      <Text style={headerStyles.logo}>🔥</Text>
      <Text style={headerStyles.title}>EMBER</Text>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 28,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

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
          paddingTop: 6,
          paddingBottom: 6,
        },
        tabBarItemStyle: {
          gap: 2,
          minWidth: 56,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#1C1C1E',
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 0,
        },
        headerTitleAlign: 'left',
        headerTitle: () => <HeaderTitle />,
        sceneStyle: { backgroundColor: '#1C1C1E' },
      }}
      screenListeners={{
        tabPress: (e) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTabChange(e.target?.split('-')[0] ?? '');
        },
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
      <Tabs.Screen
        name="mypage"
        options={{
          title: '마이',
          tabBarIcon: ({ color }) => <User size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
