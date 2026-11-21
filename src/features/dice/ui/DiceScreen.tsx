import { memo, useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../core/ui/StateViews';
import { colors, spacing } from '../../../ui/theme';
import type { DiceStorage } from '../data/historyStore';
import {
  DIE_TYPES,
  formatNotation,
  MAX_DICE,
  MAX_MODIFIER,
  MIN_DICE,
  type RollConfig,
  type RollResult,
  type Rng,
} from '../domain/dice';
import { useDiceRoller } from './useDiceRoller';

const keyExtractor = (r: RollResult) => r.id;

export function DiceScreen({ storage, rng, now }: { storage: DiceStorage; rng?: Rng; now?: () => number }) {
  const { state, roll, setConfig, clearHistory, savePreset, removePreset } = useDiceRoller(
    storage,
    rng,
    now,
  );
  const { config, history, presets } = state;
  const latest = history[0];

  const renderItem = useCallback(({ item }: { item: RollResult }) => <HistoryRow item={item} />, []);

  return (
    <View style={styles.flex}>
      <View style={styles.panel}>
        <Stepper
          label="Dice"
          value={config.count}
          min={MIN_DICE}
          max={MAX_DICE}
          onChange={(count) => setConfig({ ...config, count })}
        />
        <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Die type">
          {DIE_TYPES.map((sides) => {
            const selected = config.sides === sides;
            return (
              <Pressable
                key={sides}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${sides} sided die`}
                onPress={() => setConfig({ ...config, sides })}
                style={[styles.chip, selected && styles.chipOn]}
              >
                <Text style={selected ? styles.chipTextOn : undefined}>d{sides}</Text>
              </Pressable>
            );
          })}
        </View>
        <Stepper
          label="Modifier"
          value={config.modifier}
          min={-MAX_MODIFIER}
          max={MAX_MODIFIER}
          onChange={(modifier) => setConfig({ ...config, modifier })}
        />

        <View style={styles.row}>
          <Button title={`Roll ${formatNotation(config)}`} onPress={() => roll()} />
          <Button title="Save preset" variant="text" onPress={savePreset} />
        </View>

        {presets.length > 0 ? (
          <View style={styles.chips}>
            {presets.map((p) => {
              const n = formatNotation(p);
              return (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityLabel={`Roll preset ${n}`}
                  accessibilityHint="Long press to remove"
                  onPress={() => {
                    setConfig(p);
                    roll(p);
                  }}
                  onLongPress={() => removePreset(n)}
                  style={styles.chip}
                >
                  <Text>{n}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {latest ? (
          <View
            style={styles.result}
            accessible
            accessibilityLiveRegion="polite"
            accessibilityLabel={`Rolled ${formatNotation(latest.config)}: ${latest.dice.join(', ')}. Total ${latest.total}`}
          >
            <View style={styles.diceRow}>
              {latest.dice.map((d, i) => (
                <View key={i} style={styles.die}>
                  <Text style={styles.dieText}>{d}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.total} testID="total">
              Total {latest.total}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.historyHeader}>
        <Text style={styles.h2}>History</Text>
        {history.length > 0 ? <Button title="Clear" variant="text" onPress={clearHistory} /> : null}
      </View>
      {!state.loaded ? null : (
        <FlatList
          data={history}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.empty}>No rolls yet. Your history is saved on this device.</Text>
          }
        />
      )}
    </View>
  );
}

const HistoryRow = memo(function HistoryRow({ item }: { item: RollResult }) {
  const time = new Date(item.at).toLocaleTimeString();
  return (
    <View style={styles.historyRow} accessible>
      <Text style={styles.notation}>{formatNotation(item.config)}</Text>
      <Text style={styles.flex} numberOfLines={1}>
        [{item.dice.join(', ')}] = {item.total}
      </Text>
      <Text style={styles.muted}>{time}</Text>
    </View>
  );
});

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) =>
        onChange(e.nativeEvent.actionName === 'increment' ? Math.min(max, value + 1) : Math.max(min, value - 1))
      }
    >
      <Text style={styles.label}>{label}</Text>
      <Button title="−" accessibilityLabel={`Decrease ${label}`} variant="text" disabled={value <= min} onPress={() => onChange(value - 1)} />
      <Text style={styles.value} testID={`${label}-value`}>
        {value}
      </Text>
      <Button title="+" accessibilityLabel={`Increase ${label}`} variant="text" disabled={value >= max} onPress={() => onChange(value + 1)} />
    </View>
  );
}

export type { RollConfig };

const styles = StyleSheet.create({
  flex: { flex: 1 },
  panel: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { width: 80, fontWeight: '600' },
  value: { minWidth: 32, textAlign: 'center', fontSize: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTextOn: { color: '#fff' },
  result: { alignItems: 'center', gap: spacing.sm },
  diceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  die: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dieText: { fontSize: 18, fontWeight: '700' },
  total: { fontSize: 22, fontWeight: '700' },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  h2: { fontSize: 18, fontWeight: '700' },
  historyRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  notation: { fontWeight: '700', width: 64 },
  muted: { color: colors.muted },
  empty: { textAlign: 'center', color: colors.muted, padding: spacing.xl },
});
