import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#1C1C1E' } }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
