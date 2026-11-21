import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import { useDebouncedValue } from '../../../core/hooks/useDebouncedValue';
import { EmptyView, ErrorView, LoadingView, LoadMoreFooter } from '../../../core/ui/StateViews';
import { colors, spacing } from '../../../ui/theme';
import type { TxnApi } from '../data/txnApi';
import {
  DEFAULT_FILTER,
  formatAmount,
  groupByDay,
  type Section,
  type Transaction,
  type TxnFilter,
} from '../domain/transaction';
import { useTransactions } from './useTransactions';

const TYPE_OPTIONS: { value: TxnFilter['type']; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'credit', label: 'Received' },
  { value: 'debit', label: 'Paid' },
];
const STATUS_OPTIONS: { value: TxnFilter['status']; label: string }[] = [
  { value: 'all', label: 'Any status' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

const keyExtractor = (t: Transaction) => t.id;

export function TransactionsScreen({
  api,
  now = () => new Date(),
  debounceMs = 300,
}: {
  api: TxnApi;
  now?: () => Date;
  debounceMs?: number;
}) {
  const [type, setType] = useState<TxnFilter['type']>(DEFAULT_FILTER.type);
  const [status, setStatus] = useState<TxnFilter['status']>(DEFAULT_FILTER.status);
  const [text, setText] = useState('');
  const query = useDebouncedValue(text, debounceMs).trim();
  // Memoised so the data hook only restarts when the filter really changes.
  const filter = useMemo(() => ({ type, status, query }), [type, status, query]);

  const { state, refresh, retry, loadMore } = useTransactions(api, filter);
  // Grouping is derived data: computed once per item list, not per render.
  const sections = useMemo(() => groupByDay(state.items, now()), [state.items, now]);

  const renderItem = useCallback(({ item }: { item: Transaction }) => <TxnRow t={item} />, []);
  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => <DayHeader section={section} />,
    [],
  );
  const onEndReached = useCallback(() => void loadMore(), [loadMore]);

  return (
    <View style={styles.flex}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Search name or note"
        accessibilityLabel="Search transactions"
        style={styles.search}
        autoCorrect={false}
      />
      <Chips options={TYPE_OPTIONS} value={type} onChange={setType} />
      <Chips options={STATUS_OPTIONS} value={status} onChange={setStatus} />
      {state.status === 'loading' ? (
        <LoadingView />
      ) : state.status === 'error' ? (
        <ErrorView message="Could not load transactions." onRetry={retry} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={refresh} />}
          ListEmptyComponent={<EmptyView message="No transactions match these filters" />}
          ListFooterComponent={
            state.end ? undefined : (
              <LoadMoreFooter
                loading={state.loadingMore}
                errorMessage={state.moreError ? 'Could not load more.' : undefined}
                onRetry={() => void loadMore(true)}
              />
            )
          }
          initialNumToRender={15}
          testID="txn-list"
        />
      )}
    </View>
  );
}

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chips} accessibilityRole="radiogroup">
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === o.value }}
          onPress={() => onChange(o.value)}
          style={[styles.chip, value === o.value && styles.chipOn]}
        >
          <Text style={value === o.value ? styles.chipTextOn : undefined}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const DayHeader = memo(function DayHeader({ section }: { section: Section }) {
  return (
    <View style={styles.header} accessibilityRole="header">
      <Text style={styles.headerTitle}>{section.title}</Text>
      <Text style={styles.muted}>
        {formatAmount({ type: section.netMinor >= 0 ? 'credit' : 'debit', amountMinor: Math.abs(section.netMinor) })}
      </Text>
    </View>
  );
});

const TxnRow = memo(function TxnRow({ t }: { t: Transaction }) {
  const time = new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const amount = formatAmount(t);
  const verb = t.type === 'credit' ? 'Received from' : 'Paid to';
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${verb} ${t.counterparty}, ${amount}, ${time}${t.status !== 'success' ? `, ${t.status}` : ''}`}
    >
      <View style={styles.flex}>
        <Text style={styles.name}>{t.counterparty}</Text>
        <Text style={styles.muted}>
          {time}
          {t.note ? ` · ${t.note}` : ''}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, t.type === 'credit' && styles.credit, t.status === 'failed' && styles.strike]}>
          {amount}
        </Text>
        {t.status !== 'success' ? (
          <Text style={t.status === 'failed' ? styles.failed : styles.pending}>{t.status === 'failed' ? 'Failed' : 'Pending'}</Text>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  search: { margin: spacing.md, padding: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  chips: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTextOn: { color: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontWeight: '700' },
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  name: { fontWeight: '600' },
  muted: { color: colors.muted },
  right: { alignItems: 'flex-end' },
  amount: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  credit: { color: colors.success },
  strike: { textDecorationLine: 'line-through', color: colors.muted },
  failed: { color: colors.error, fontSize: 12 },
  pending: { color: '#B26A00', fontSize: 12 },
});
