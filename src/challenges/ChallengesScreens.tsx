import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../core/ui/StateViews';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors, spacing } from '../ui/theme';
import { CHALLENGES } from './registry';

export function ChallengeListScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Challenges'>) {
  return (
    <FlatList
      data={CHALLENGES}
      keyExtractor={(c) => String(c.id)}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Challenge', { id: item.id })}
          style={styles.row}
        >
          <Text style={styles.num}>{item.id}</Text>
          <View style={styles.flex}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.muted} numberOfLines={2}>
              {item.symptom}
            </Text>
          </View>
          <Text style={[styles.tag, item.kind === 'perf' && styles.perf]}>{item.kind === 'bug' ? 'Bug' : 'Perf'}</Text>
        </Pressable>
      )}
    />
  );
}

export function ChallengeScreen({ route }: NativeStackScreenProps<RootStackParamList, 'Challenge'>) {
  const c = CHALLENGES.find((x) => x.id === route.params.id);
  const [mode, setMode] = useState<'buggy' | 'fixed'>('buggy');
  const [answer, setAnswer] = useState(false);
  if (!c) return <Text>Unknown challenge</Text>;
  return (
    <View style={styles.flex}>
      <View style={styles.info}>
        <Text style={styles.label}>Symptom</Text>
        <Text>{c.symptom}</Text>
        <Text style={styles.label}>Try it</Text>
        <Text>{c.tryIt}</Text>
        {answer ? (
          <>
            <Text style={styles.label}>Root cause</Text>
            <Text>{c.cause}</Text>
            <Text style={styles.label}>Fix</Text>
            <Text>{c.fix}</Text>
          </>
        ) : null}
        <View style={styles.toggleRow}>
          {(['buggy', 'fixed'] as const).map((m) => (
            <Pressable
              key={m}
              accessibilityRole="radio"
              accessibilityState={{ selected: mode === m }}
              onPress={() => setMode(m)}
              style={[styles.toggle, mode === m && styles.toggleOn]}
            >
              <Text style={mode === m ? styles.toggleTextOn : undefined}>{m === 'buggy' ? 'Buggy' : 'Fixed'}</Text>
            </Pressable>
          ))}
          <View style={styles.flex} />
          <Button title={answer ? 'Hide answer' : 'Show answer'} variant="text" onPress={() => setAnswer((a) => !a)} />
        </View>
      </View>
      {/* key = mode: switching gives the demo a fresh mount. */}
      <View key={mode} style={styles.flex}>
        {mode === 'buggy' ? c.buggy() : c.fixed()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  num: { width: 24, fontWeight: '700', color: colors.primary },
  title: { fontWeight: '600' },
  muted: { color: colors.muted },
  tag: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: '#FDECEA', color: colors.error, overflow: 'hidden' },
  perf: { backgroundColor: '#E8F5E9', color: colors.success },
  info: { padding: spacing.lg, gap: 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  label: { fontWeight: '700', marginTop: spacing.sm },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  toggle: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  toggleOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleTextOn: { color: '#fff' },
});
