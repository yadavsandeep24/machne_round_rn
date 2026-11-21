/**
 * WHAT THE INTERVIEWER HANDS YOU (kept on purpose, with its problems).
 * "It works. How would you improve it?" The problems, in the order they
 * usually come up:
 *  1. No types for the response.
 *  2. Three independent useStates (loading/error/data) can contradict each
 *     other (loading=true and error set at the same time).
 *  3. RACE: tap "Details" on user 1 (slow), then user 2 (fast): user 1's
 *     response lands last and overwrites user 2.
 *  4. No cancellation: leaving the screen still lets responses set state.
 *  5. fetch does not reject on HTTP 404/500: errors are silently "data".
 *  6. Inline arrow functions per row defeat memoisation.
 *  7. Fetch logic is copy-pasted and lives in the component (not reusable,
 *     hard to test).
 */
import { useState } from 'react';
import { Button, FlatList, Text, View } from 'react-native';

import type { UsersApi } from '../api/usersApi';

export function DataTableStarter({ api }: { api: UsersApi }) {
  const [users, setUsers] = useState<any[]>([]);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllUsers = () => {
    setLoading(true);
    api
      .getUsers()
      .then((data) => setUsers(data))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  const getDetails = (id: number) => {
    setLoading(true);
    api
      .getUser(id)
      .then((data) => setDetails(data))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button title="Get all users" onPress={getAllUsers} />
      {loading && <Text>Loading…</Text>}
      {error && <Text>{error}</Text>}
      {details && <Text testID="details">Selected: {details.name}</Text>}
      <FlatList
        data={users}
        keyExtractor={(u) => String(u.id)}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ flex: 1 }}>{item.name}</Text>
            <Button title="Details" onPress={() => getDetails(item.id)} />
          </View>
        )}
      />
    </View>
  );
}
