import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { setPendingNav } from '../hooks/notificationNav';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as { type?: string; relatedId?: string | null };
  const type = data?.type ?? '';
  const relatedId = data?.relatedId;

  if (type === 'POLICY_MATCH') {
    const webUrl = relatedId ? `/programs?open=${relatedId}` : '/programs';
    setPendingNav({ webUrl });
    router.navigate('/');
  } else if (type === 'SCHEDULE') {
    router.navigate('/schedule');
  } else if (type === 'DEADLINE') {
    router.navigate('/applications');
  } else {
    router.navigate('/');
  }
}

export default function RootLayout() {
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(response);
    });

    const sub = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => sub.remove();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#1C1C1E' } }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
