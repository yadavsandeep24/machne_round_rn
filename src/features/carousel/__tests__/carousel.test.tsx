import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { DEALS } from '../demoProducts';
import { CARD_GAP, CARD_WIDTH } from '../ui/ProductCard';
import { ProductCarousel, getItemLayout, type ViewableInfo } from '../ui/ProductCarousel';

test('card exposes one accessible label with title, price and rating', async () => {
  await render(<ProductCarousel title="Deals" products={DEALS.slice(0, 1)} />);
  expect(
    screen.getByLabelText('Deal product number 1 with a long name, $9.99, rated 3.5 out of 5'),
  ).toBeTruthy();
});

test('press reports the product id', async () => {
  const onPress = jest.fn();
  await render(<ProductCarousel title="Deals" products={DEALS} onPressProduct={onPress} />);
  await fireEvent.press(screen.getByText('Deal product number 2 with a long name'));
  expect(onPress).toHaveBeenCalledWith('deal-2');
});

test('horizontal getItemLayout uses card width + gap', () => {
  expect(getItemLayout(null, 3)).toEqual({ length: CARD_WIDTH + CARD_GAP, offset: 3 * (CARD_WIDTH + CARD_GAP), index: 3 });
});

test('the dot follows the first visible card; the callback identity never changes', async () => {
  const { rerender } = await render(<ProductCarousel title="Deals" products={DEALS} />);
  const list = screen.getByTestId('carousel');
  const firstCallback = list.props.onViewableItemsChanged;

  await act(async () =>
    firstCallback({ viewableItems: [{ index: 4, item: DEALS[4] }], changed: [] } as unknown as ViewableInfo),
  );
  // Dots are hidden from screen readers (decorative), so include hidden elements.
  const dots = screen.getAllByTestId('dot-active', { includeHiddenElements: true });
  expect(dots).toHaveLength(1);

  await rerender(<ProductCarousel title="Deals" products={DEALS} />);
  expect(screen.getByTestId('carousel').props.onViewableItemsChanged).toBe(firstCallback);
});

test('an empty shelf renders nothing', async () => {
  await render(<ProductCarousel title="Empty" products={[]} />);
  expect(screen.queryByText('Empty')).toBeNull();
});
