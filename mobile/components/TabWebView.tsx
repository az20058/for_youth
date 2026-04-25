import { useRef, useState, useEffect } from 'react';
import { View, Animated, StyleSheet, Platform, BackHandler, ActivityIndicator, Text, Pressable, type NativeSyntheticEvent } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { useIsFocused } from './useIsFocused';
import { registerPushToken } from '../hooks/usePushToken';
import { useTabTransition } from '../hooks/useTabTransition';
import { BASE_URL, USER_AGENT } from '../constants/config';
import { HIDE_WEB_CHROME_JS } from '../constants/webview';
import { COLORS } from '../constants/colors';

interface TabWebViewProps {
  path: string;
}

export function TabWebView({ path }: TabWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [pushInfo, setPushInfo] = useState<{ token: string; platform: string } | null>(null);
  const isFocused = useIsFocused();
  const { translateX, opacity } = useTabTransition(isFocused);

  useEffect(() => {
    registerPushToken().then(setPushInfo).catch(() => {});
  }, []);

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

  const injectedJS = pushInfo
    ? `window.__PUSH_TOKEN__ = ${JSON.stringify(pushInfo)}; true;`
    : '';

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  };

  const handleError = (_e: NativeSyntheticEvent<unknown>) => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleHttpError = (e: NativeSyntheticEvent<{ statusCode: number }>) => {
    if (e.nativeEvent.statusCode >= 500) {
      setHasError(true);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    webViewRef.current?.reload();
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
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={handleError}
        onHttpError={handleHttpError}
        injectedJavaScript={HIDE_WEB_CHROME_JS}
        injectedJavaScriptBeforeContentLoaded={injectedJS}
        userAgent={USER_AGENT}
        javaScriptEnabled
        domStorageEnabled
        allowsBackForwardNavigationGestures
      />
      {isLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
      {hasError && (
        <View style={styles.overlay}>
          <Text style={styles.errorText}>페이지를 불러올 수 없습니다</Text>
          <Pressable style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      )}
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
    backgroundColor: COLORS.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
