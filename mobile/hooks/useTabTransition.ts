import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { getDirection } from '../components/tabDirection';

export function useTabTransition(isFocused: boolean) {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const prevFocused = useRef(isFocused);

  useEffect(() => {
    if (isFocused && !prevFocused.current) {
      const dir = getDirection();
      if (dir) {
        const startX = dir === 'right' ? 16 : -16;
        translateX.setValue(startX);
        opacity.setValue(0.6);
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
    prevFocused.current = isFocused;
  }, [isFocused, translateX, opacity]);

  return { translateX, opacity };
}
