import { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Platform, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { useIsFocused } from './useIsFocused';

const BASE_URL = 'https://for-youth.site';

// 웹의 헤더·탭바를 숨김 (앱에서 자체 네비게이션 제공)
const HIDE_WEB_NAV = `
  (function() {
    var style = document.createElement('style');
    style.textContent = '[data-web-header] { display: none !important; } [data-web-footer] { display: none !important; }';
    document.head.appendChild(style);
  })();
`;

interface TabWebViewProps {
  path: string;
}

export function TabWebView({ path }: TabWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const isFocused = useIsFocused();

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

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  };

  return (
    <View style={[styles.container, !isFocused && styles.hidden]}>
      <WebView
        ref={webViewRef}
        source={{ uri: `${BASE_URL}${path}` }}
        style={[styles.webview, { backgroundColor: '#1C1C1E' }]}
        onNavigationStateChange={handleNavigationStateChange}
        injectedJavaScript={HIDE_WEB_NAV}
        userAgent="ForYouthApp"
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowsBackForwardNavigationGestures
      />
    </View>
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
