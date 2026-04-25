import { useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const KEY = 'appLockEnabled';

export function useAuthSettings() {
  const [isLockEnabled, setIsLockEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(KEY).then((value) => {
      setIsLockEnabled(value === 'true');
      setIsLoading(false);
    });
  }, []);

  const setLockEnabled = useCallback(async (enabled: boolean) => {
    await SecureStore.setItemAsync(KEY, String(enabled));
    setIsLockEnabled(enabled);
  }, []);

  return { isLockEnabled, setLockEnabled, isLoading };
}
