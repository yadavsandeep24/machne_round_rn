import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View, type FlatListProps } from 'react-native';

import { colors, spacing } from '../../../ui/theme';
import { CARD_GAP, CARD_WIDTH, ProductCard, type Product } from './ProductCard';

const ITEM = CARD_WIDTH + CARD_GAP;
const keyExtractor = (p: Product) => p.id;
// Horizontal: length is the WIDTH of one item including the gap.
export const getItemLayout = (_: unknown, index: number) => ({ length: ITEM, offset: ITEM * index, index });
const Separator = () => <View style={{ width: CARD_GAP }} />;

/** RN 0.88 does not export ViewToken from the package root; derive it. */
export type ViewableInfo = Parameters<NonNullable<FlatListProps<Product>['onViewableItemsChanged']>>[0];

// Module-level constant: identity never changes.
const viewabilityConfig = { itemVisiblePercentThreshold: 60 };

export function ProductCarousel({
  title,
  products,
  onPressProduct,
}: {
  title: string;
  products: Product[];
  onPressProduct?: (id: string) => void;
}) {
  const [active, setActive] = useState(0);

  // GOTCHA: FlatList throws "Changing onViewableItemsChanged on the fly is not
  // supported". The callback and the config must keep the same identity for
  // the life of the list: useCallback with no changing deps (setActive is
  // stable) and a module-level config. Never an inline function.
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: ViewableInfo) => {
      const first = viewableItems[0];
      if (first?.index != null) setActive(first.index);
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => <ProductCard product={item} onPress={onPressProduct} />,
    [onPressProduct],
  );

  if (products.length === 0) return null; // hide an empty shelf entirely

  return (
    <View style={styles.section} accessibilityLabel={`${title}, ${products.length} items`}>
      <Text style={styles.heading} accessibilityRole="header">
        {title}
      </Text>
      <FlatList
        horizontal
        data={products}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        ItemSeparatorComponent={Separator}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        // Snap card by card; "fast" feels native on both platforms.
        snapToInterval={ITEM}
        decelerationRate="fast"
        snapToAlignment="start"
        initialNumToRender={4}
        windowSize={5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        testID="carousel"
      />
      <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {products.map((p, i) => (
          <View key={p.id} style={[styles.dot, i === active && styles.dotActive]} testID={i === active ? 'dot-active' : undefined} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingVertical: spacing.md },
  heading: { fontSize: 18, fontWeight: '700', paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  content: { paddingHorizontal: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 16, backgroundColor: colors.primary },
});
