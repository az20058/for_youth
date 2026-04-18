import { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';

interface Tab {
  label: string;
  path: string;
}

interface SubTabBarProps {
  tabs: Tab[];
  activeIndex: number;
  onTabPress: (index: number) => void;
}

export function SubTabBar({ tabs, activeIndex, onTabPress }: SubTabBarProps) {
  const animValue = useMemo(() => new Animated.Value(0), []);
  const [tabWidths, setTabWidths] = useState<number[]>([]);
  const isFirstRender = useRef(true);

  const handleLayout = (index: number) => (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setTabWidths((prev) => {
      const next = [...prev];
      next[index] = width;
      return next;
    });
  };

  useEffect(() => {
    if (tabWidths.length < tabs.length) return;
    const targetLeft = tabWidths.slice(0, activeIndex).reduce((sum, w) => sum + w, 0);

    if (isFirstRender.current) {
      animValue.setValue(targetLeft);
      isFirstRender.current = false;
    } else {
      Animated.timing(animValue, {
        toValue: targetLeft,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [activeIndex, tabWidths, animValue, tabs.length]);

  const handlePress = (index: number) => {
    if (index === activeIndex) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabPress(index);
  };

  const indicatorWidth = tabWidths[activeIndex] ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {tabs.map((tab, i) => (
          <Pressable
            key={tab.path}
            onPress={() => handlePress(i)}
            onLayout={handleLayout(i)}
            style={styles.tab}
          >
            <Text style={[styles.label, i === activeIndex ? styles.activeLabel : styles.inactiveLabel]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Animated.View
        style={[
          styles.indicator,
          { left: animValue, width: indicatorWidth },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tabRow: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeLabel: {
    color: '#FFFFFF',
  },
  inactiveLabel: {
    color: '#9C9C9C',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: '#FE6E6E',
  },
});
