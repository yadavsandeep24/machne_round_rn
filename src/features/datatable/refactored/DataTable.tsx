import { memo, useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../core/ui/StateViews';
import { colors, spacing } from '../../../ui/theme';
import type { User, UsersApi } from '../api/usersApi';
import { useRequest } from './useRequest';

const keyExtractor = (u: User) => String(u.id);

export function DataTable({ api }: { api: UsersApi }) {
  const users = useRequest((signal) => api.getUsers(signal));
  const details = useRequest((signal, id: number) => api.getUser(id, signal));

  const loadUsers = useCallback(() => {
    users.run();
  }, [users]);
  // One stable callback for every row: memoised rows do not re-render.
  const showDetails = useCallback((id: number) => details.run(id), [details]);

  const list =
    users.state.status === 'success'
      ? users.state.data
      : 'previous' in users.state
        ? (users.state.previous ?? [])
        : [];

  const renderItem = useCallback(
    ({ item }: { item: User }) => <UserRow user={item} onDetails={showDetails} />,
    [showDetails],
  );

  return (
    <View style={styles.container}>
      <Button title="Get all users" onPress={loadUsers} disabled={users.state.status === 'loading'} />
      {users.state.status === 'loading' ? <ActivityIndicator style={styles.gap} /> : null}
      {users.state.status === 'error' ? (
        <Text style={styles.error} accessibilityRole="alert">
          Could not load users: {users.state.message}
        </Text>
      ) : null}
      <DetailsPanel state={details.state} />
      <FlatList data={list} keyExtractor={keyExtractor} renderItem={renderItem} />
    </View>
  );
}

const UserRow = memo(function UserRow({
  user,
  onDetails,
}: {
  user: User;
  onDetails: (id: number) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.muted}>{user.email}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Details for ${user.name}`}
        onPress={() => onDetails(user.id)}
      >
        <Text style={styles.link}>Details</Text>
      </Pressable>
    </View>
  );
});

function DetailsPanel({ state }: { state: ReturnType<typeof useRequest<[number], User>>['state'] }) {
  switch (state.status) {
    case 'idle':
      return null;
    case 'loading':
      return <ActivityIndicator style={styles.gap} />;
    case 'error':
      return <Text style={styles.error}>Could not load details: {state.message}</Text>;
    case 'success':
      return (
        <Text testID="details" style={styles.details}>
          Selected: {state.data.name}
        </Text>
      );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, gap: spacing.sm },
  flex: { flex: 1 },
  gap: { marginVertical: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  name: { fontWeight: '600' },
  muted: { color: colors.muted },
  link: { color: colors.primary, fontWeight: '600', padding: spacing.sm },
  error: { color: colors.error },
  details: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: 8 },
});
