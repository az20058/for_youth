import { useRef, useState, useEffect } from 'react';
import { View, Animated, StyleSheet, Platform, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { useIsFocused } from './useIsFocused';
import { getDirection } from './tabDirection';

const BASE_URL = 'https://for-youth.site';

// 웹의 헤더·탭바를 숨김 (앱에서 자체 네비게이션 제공)
const INJECTED_JS = `
  (function() {
    var style = document.createElement('style');
    style.textContent = '[data-web-header] { display: none !important; } [data-web-footer] { display: none !important; } * { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; } input, textarea, [contenteditable] { -webkit-user-select: text; user-select: text; }';
    document.head.appendChild(style);
    var meta = document.querySelector('meta[name=viewport]');
    if (meta) meta.setAttribute('content', meta.getAttribute('content') + ', maximum-scale=1.0, user-scalable=no');
  })();
`;

interface TabWebViewProps {
  path: string;
}

export function TabWebView({ path }: TabWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const isFocused = useIsFocused();
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const prevFocused = useRef(isFocused);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      });
      return () => handler.remove();
    }
  }, [canGoBack]);

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

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        !isFocused && styles.hidden,
        { transform: [{ translateX }], opacity },
      ]}
    >
      <WebView
        ref={webViewRef}
        source={{ uri: `${BASE_URL}${path}` }}
        style={[styles.webview, { backgroundColor: '#1C1C1E' }]}
        onNavigationStateChange={handleNavigationStateChange}
        injectedJavaScript={INJECTED_JS}
        userAgent="ForYouthApp"
        javaScriptEnabled
        domStorageEnabled

        allowsBackForwardNavigationGestures
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  webview: {
    flex: 1,
  },
});
