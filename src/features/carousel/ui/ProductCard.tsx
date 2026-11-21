import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../../ui/theme';

export interface Product {
  id: string;
  title: string;
  priceCents: number;
  rating: number;
  image?: string;
  badge?: string;
}

export const CARD_WIDTH = 160;
export const CARD_GAP = spacing.md;

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/**
 * A reusable, presentational component: data in via props, events out via
 * callbacks, no fetching, no global state. memo + a stable onPress means a
 * card re-renders only when its product changes.
 */
export const ProductCard = memo(function ProductCard({
  product,
  onPress,
}: {
  product: Product;
  onPress?: (id: string) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${formatPrice(product.priceCents)}, rated ${product.rating} out of 5`}
      onPress={onPress ? () => onPress(product.id) : undefined}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <Text style={styles.placeholder}>🛒</Text>
        )}
        {product.badge ? <Text style={styles.badge}>{product.badge}</Text> : null}
      </View>
      <Text numberOfLines={2} style={styles.title}>
        {product.title}
      </Text>
      <Text style={styles.price}>{formatPrice(product.priceCents)}</Text>
      <Text style={styles.rating}>★ {product.rating.toFixed(1)}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.8 },
  imageWrap: {
    height: 120,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  placeholder: { fontSize: 32 },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.primary,
    color: '#fff',
    fontSize: 11,
    paddingHorizontal: 6,
    borderRadius: 4,
    overflow: 'hidden',
  },
  title: { marginTop: spacing.sm, fontWeight: '600', minHeight: 36 },
  price: { marginTop: 2, fontSize: 16, fontWeight: '700' },
  rating: { color: colors.muted },
});
