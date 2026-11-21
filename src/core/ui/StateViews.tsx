import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../ui/theme';

export const LoadingView = memo(function LoadingView() {
  return (
    <View style={styles.center} testID="loading">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
});

export const ErrorView = memo(function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.error} accessibilityRole="alert">
        {message}
      </Text>
      {onRetry ? <Button title="Retry" onPress={onRetry} /> : null}
    </View>
  );
});

export const EmptyView = memo(function EmptyView({ message }: { message: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.muted}>{message}</Text>
    </View>
  );
});

/** Footer for paginated lists: spinner while loading more, retry on error. */
export const LoadMoreFooter = memo(function LoadMoreFooter({
  loading,
  errorMessage,
  onRetry,
}: {
  loading: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}) {
  if (loading) {
    return (
      <View style={styles.footer} testID="load-more-spinner">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (errorMessage) {
    return (
      <View style={[styles.footer, styles.row]}>
        <Text style={styles.muted}>{errorMessage}</Text>
        {onRetry ? <Button title="Retry" onPress={onRetry} variant="text" /> : null}
      </View>
    );
  }
  return null;
});

export function Button({
  title,
  onPress,
  disabled,
  variant = 'filled',
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'filled' | 'text';
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        variant === 'filled' ? styles.filled : styles.text,
        (pressed || disabled) && styles.dim,
      ]}
    >
      <Text style={variant === 'filled' ? styles.filledLabel : styles.textLabel}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  error: { color: colors.error, textAlign: 'center', marginBottom: spacing.lg },
  muted: { color: colors.muted, textAlign: 'center' },
  footer: { padding: spacing.lg, alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  filled: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 24,
  },
  filledLabel: { color: '#fff', fontWeight: '600' },
  text: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  textLabel: { color: colors.primary, fontWeight: '600' },
  dim: { opacity: 0.6 },
});
