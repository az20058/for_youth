import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthSettings } from '../hooks/useAuthSettings';
import { COLORS } from '../constants/colors';

export function LockToggle() {
  const { isLockEnabled, setLockEnabled, isLoading } = useAuthSettings();
  const [biometricAvailable, setBiometricAvailable] = useState(true);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then((hasHardware) => {
      setBiometricAvailable(hasHardware);
    });
  }, []);

  const handleToggle = async (value: boolean) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: '앱 잠금 활성화',
        fallbackLabel: '비밀번호 사용',
      });
      if (result.success) {
        await setLockEnabled(true);
      }
    } else {
      await setLockEnabled(false);
    }
  };

  if (isLoading) return null;

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>앱 잠금</Text>
        {!biometricAvailable && (
          <Text style={styles.subtitle}>생체 인증을 사용할 수 없습니다</Text>
        )}
      </View>
      <Switch
        value={isLockEnabled}
        onValueChange={handleToggle}
        disabled={!biometricAvailable}
        trackColor={{ false: '#39393D', true: COLORS.primary }}
        thumbColor={COLORS.textPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
