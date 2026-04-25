import { View, StyleSheet } from 'react-native';
import { TabWebView } from '../../components/TabWebView';
import { LockToggle } from '../../components/LockToggle';
import { COLORS } from '../../constants/colors';

export default function MypageTab() {
  return (
    <View style={styles.container}>
      <LockToggle />
      <View style={styles.webview}>
        <TabWebView path="/mypage" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  webview: { flex: 1 },
});
