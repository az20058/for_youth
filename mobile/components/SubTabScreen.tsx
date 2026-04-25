import { useRef, useState, useEffect, useCallback } from 'react';
import { View, Animated, StyleSheet, Platform, BackHandler, ActivityIndicator, Text, Pressable, type NativeSyntheticEvent } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { SubTabBar } from './SubTabBar';
import { useIsFocused } from './useIsFocused';
import { subscribePendingNav } from '../hooks/notificationNav';
import { useTabTransition } from '../hooks/useTabTransition';
import { BASE_URL, USER_AGENT } from '../constants/config';
import { HIDE_WEB_CHROME_JS } from '../constants/webview';
import { COLORS } from '../constants/colors';

interface Tab {
  label: string;
  path: string;
}

interface SubTabScreenProps {
  tabs: Tab[];
  defaultIndex?: number;
}

export function SubTabScreen({ tabs, defaultIndex = 0 }: SubTabScreenProps) {
  const webViewRefs = useRef<(WebView | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState<Set<number>>(() => new Set([defaultIndex]));
  const [loadingTabs, setLoadingTabs] = useState<Set<number>>(() => new Set([defaultIndex]));
  const [errorTabs, setErrorTabs] = useState<Set<number>>(new Set());
  const isFocused = useIsFocused();
  const isFocusedRef = useRef(isFocused);
  isFocusedRef.current = isFocused;
  const pendingNavRef = useRef<string | null>(null);
  const { translateX, opacity } = useTabTransition(isFocused);

  const applyWebNav = useCallback((webUrl: string) => {
    const urlPath = webUrl.split('?')[0];
    const tabIndex = tabs.findIndex(t => t.path === urlPath);
    if (tabIndex === -1) return;
    setActiveIndex(tabIndex);
    setLoadedTabs(prev => new Set(prev).add(tabIndex));
    setTimeout(() => {
      webViewRefs.current[tabIndex]?.injectJavaScript(
        `window.location.href = '${BASE_URL}${webUrl}'; true;`
      );
    }, 150);
  }, [tabs]);

  useEffect(() => {
    return subscribePendingNav((nav) => {
      if (!nav) return;
      const urlPath = nav.webUrl.split('?')[0];
      if (tabs.findIndex(t => t.path === urlPath) === -1) return;
      if (isFocusedRef.current) {
        applyWebNav(nav.webUrl);
      } else {
        pendingNavRef.current = nav.webUrl;
      }
    });
  }, [tabs, applyWebNav]);

  useEffect(() => {
    if (isFocused && pendingNavRef.current) {
      const webUrl = pendingNavRef.current;
      pendingNavRef.current = null;
      applyWebNav(webUrl);
    }
  }, [isFocused, applyWebNav]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        const activeRef = webViewRefs.current[activeIndex];
        if (canGoBack && activeRef) {
          activeRef.goBack();
          return true;
        }
        return false;
      });
      return () => handler.remove();
    }
  }, [canGoBack, activeIndex]);

  const handleNavigationStateChange = (index: number) => (navState: WebViewNavigation) => {
    if (index === activeIndex) {
      setCanGoBack(navState.canGoBack);
    }
  };

  const handleTabPress = (index: number) => {
    setActiveIndex(index);
    setLoadedTabs(prev => new Set(prev).add(index));
    setErrorTabs(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const handleLoadStart = (index: number) => () => {
    setLoadingTabs(prev => new Set(prev).add(index));
  };

  const handleLoadEnd = (index: number) => () => {
    setLoadingTabs(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const handleError = (index: number) => (_e: NativeSyntheticEvent<unknown>) => {
    setErrorTabs(prev => new Set(prev).add(index));
    setLoadingTabs(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const handleHttpError = (index: number) => (e: NativeSyntheticEvent<{ statusCode: number }>) => {
    if (e.nativeEvent.statusCode >= 500) {
      setErrorTabs(prev => new Set(prev).add(index));
    }
  };

  const handleRetry = (index: number) => () => {
    setErrorTabs(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    webViewRefs.current[index]?.reload();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateX }], opacity },
      ]}
    >
      <SubTabBar tabs={tabs} activeIndex={activeIndex} onTabPress={handleTabPress} />
      <View style={styles.webviewContainer}>
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          const isLoaded = loadedTabs.has(index);
          const isLoading = loadingTabs.has(index);
          const hasError = errorTabs.has(index);

          if (!isLoaded) return null;

          return (
            <View
              key={tab.path}
              style={[styles.webviewLayer, !isActive && styles.hidden]}
            >
              <WebView
                ref={(ref) => { webViewRefs.current[index] = ref; }}
                source={{ uri: `${BASE_URL}${tab.path}` }}
                style={styles.webview}
                onNavigationStateChange={handleNavigationStateChange(index)}
                onLoadStart={handleLoadStart(index)}
                onLoadEnd={handleLoadEnd(index)}
                onError={handleError(index)}
                onHttpError={handleHttpError(index)}
                injectedJavaScript={HIDE_WEB_CHROME_JS}
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
                  <Pressable style={styles.retryButton} onPress={handleRetry(index)}>
                    <Text style={styles.retryText}>다시 시도</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webviewContainer: {
    flex: 1,
  },
  webviewLayer: {
    ...StyleSheet.absoluteFillObject,
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
