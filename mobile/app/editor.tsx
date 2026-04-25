import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CoverLetterEditor, type CoverLetterQA } from '../components/editor/CoverLetterEditor';
import { COLORS } from '../constants/colors';

export default function EditorScreen() {
  const { applicationId, coverLetters } = useLocalSearchParams<{
    applicationId: string;
    coverLetters: string;
  }>();
  const insets = useSafeAreaInsets();

  let parsed: CoverLetterQA[] = [];
  try {
    parsed = coverLetters ? JSON.parse(coverLetters) : [];
  } catch {
    parsed = [];
  }

  const handleClose = () => {
    router.back();
  };

  const handleSave = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <CoverLetterEditor
          applicationId={applicationId ?? ''}
          initialLetters={parsed}
          onSave={handleSave}
          onClose={handleClose}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
