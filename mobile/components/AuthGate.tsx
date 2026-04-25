import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthSettings } from '../hooks/useAuthSettings';
import { COLORS } from '../constants/colors';

const BACKGROUND_THRESHOLD_MS = 5000;

export function AuthGate({ children }: { children: ReactNode }) {
  const { isLockEnabled, isLoading } = useAuthSettings();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(true);
  const backgroundTimestamp = useRef<number | null>(null);

  const authenticate = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: '앱 잠금 해제',
      fallbackLabel: '비밀번호 사용',
    });
    if (result.success) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (cancelled) return;

      if (!hasHardware) {
        setBiometricAvailable(false);
        setIsAuthenticated(true);
        return;
      }

      if (!isLockEnabled) {
        setIsAuthenticated(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: '앱 잠금 해제',
        fallbackLabel: '비밀번호 사용',
      });
      if (!cancelled && result.success) {
        setIsAuthenticated(true);
      }
    }

    if (!isLoading) {
      init();
    }

    return () => { cancelled = true; };
  }, [isLoading, isLockEnabled]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundTimestamp.current = Date.now();
      } else if (nextState === 'active') {
        const elapsed = backgroundTimestamp.current
          ? Date.now() - backgroundTimestamp.current
          : 0;
        backgroundTimestamp.current = null;

        if (isLockEnabled && biometricAvailable && elapsed > BACKGROUND_THRESHOLD_MS) {
          setIsAuthenticated(false);
          authenticate();
        }
      }
    });

    return () => subscription.remove();
  }, [isLockEnabled, biometricAvailable, authenticate]);

  if (isLoading) {
    return <View style={styles.lockScreen} />;
  }

  if (!isAuthenticated && isLockEnabled && biometricAvailable) {
    return (
      <View style={styles.lockScreen}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.lockText}>앱 잠금이 설정되어 있습니다</Text>
        <TouchableOpacity style={styles.unlockButton} onPress={authenticate}>
          <Text style={styles.unlockButtonText}>잠금 해제</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  lockScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  lockText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    marginBottom: 32,
  },
  unlockButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  unlockButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
