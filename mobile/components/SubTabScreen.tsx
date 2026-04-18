import { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Platform, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { SubTabBar } from './SubTabBar';

const BASE_URL = 'https://for-youth.site';

const HIDE_WEB_NAV = `
  (function() {
    var style = document.createElement('style');
    style.textContent = '[data-web-header] { display: none !important; } [data-web-footer] { display: none !important; }';
    document.head.appendChild(style);
  })();
`;

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
  };

  return (
    <View style={styles.container}>
      <SubTabBar tabs={tabs} activeIndex={activeIndex} onTabPress={handleTabPress} />
      <View style={styles.webviewContainer}>
        {tabs.map((tab, index) => (
          <View
            key={tab.path}
            style={[
              styles.webviewLayer,
              index !== activeIndex && styles.hidden,
            ]}
          >
            <WebView
              ref={(ref) => { webViewRefs.current[index] = ref; }}
              source={{ uri: `${BASE_URL}${tab.path}` }}
              style={[styles.webview, { backgroundColor: '#1C1C1E' }]}
              onNavigationStateChange={handleNavigationStateChange(index)}
              injectedJavaScript={HIDE_WEB_NAV}
              userAgent="ForYouthApp"
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              allowsBackForwardNavigationGestures
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
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
  },
});
