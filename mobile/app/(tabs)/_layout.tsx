import { Tabs, useRouter } from 'expo-router';
import { Home, Briefcase, Calendar, User, CircleUserRound } from 'lucide-react-native';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

function HeaderTitle() {
  return (
    <View style={headerStyles.container}>
      <Text style={headerStyles.logo}>🔥</Text>
      <Text style={headerStyles.title}>EMBER</Text>
    </View>
  );
}

function HeaderRight() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/mypage')}
      style={headerStyles.profileButton}
    >
      <CircleUserRound size={24} color="#9C9C9C" />
    </Pressable>
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
  profileButton: {
    marginRight: Platform.OS === 'ios' ? 0 : 12,
    padding: 4,
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
        headerRight: () => <HeaderRight />,
        sceneStyle: { backgroundColor: '#1C1C1E' },
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
