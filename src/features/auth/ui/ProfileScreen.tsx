import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useServices } from '../../../app/ServicesContext';
import { userMessage, type AppError } from '../../../core/error/appError';
import { safeCall } from '../../../core/network/http';
import { Button, ErrorView, LoadingView } from '../../../core/ui/StateViews';
import { spacing } from '../../../ui/theme';
import type { Profile } from '../data/authApi';
import { useAuth } from './AuthContext';

/** Protected screen: GET /auth/me with the bearer token (refreshed automatically). */
export function ProfileScreen() {
  const { http } = useServices();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<Profile>();
  const [error, setError] = useState<AppError>();

  useEffect(() => {
    const controller = new AbortController();
    safeCall(() => http.get<Profile>('auth/me', { signal: controller.signal })).then((r) => {
      if (controller.signal.aborted) return;
      if (r.ok) setProfile(r.data.data);
      else setError(r.error);
    });
    return () => controller.abort();
  }, [http]);

  if (error && error.kind !== 'unauthorized') return <ErrorView message={userMessage(error)} />;
  if (!profile) return <LoadingView />;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, {profile.firstName}</Text>
      <Text>@{profile.username}</Text>
      <Text>{profile.email}</Text>
      <Button title="Log out" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, gap: spacing.md },
  title: { fontSize: 22, fontWeight: '700' },
});
