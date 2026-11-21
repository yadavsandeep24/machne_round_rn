import { fireEvent, render, screen } from '@testing-library/react-native';

import { UsersBuggy } from '../c08_inline_props_memo/buggy';
import { UsersFixed } from '../c08_inline_props_memo/fixed';
import { rowRenders } from '../c08_inline_props_memo/shared';
import { AppBuggy } from '../c09_context_rerenders/buggy';
import { AppFixed } from '../c09_context_rerenders/fixed';
import { consumerRenders } from '../c09_context_rerenders/shared';
import { LeaderboardBuggy } from '../c10_scrollview_map/buggy';
import { LeaderboardFixed } from '../c10_scrollview_map/fixed';
import { renders, SIZE } from '../c10_scrollview_map/shared';

describe('C08 inline props defeat memo', () => {
  const rowsRenderedByOneTap = async () => {
    rowRenders.clear();
    await fireEvent.press(screen.getByText('☆ User 3'));
    return rowRenders.size;
  };
  test('buggy: every visible row re-renders', async () => {
    await render(<UsersBuggy />);
    expect(await rowsRenderedByOneTap()).toBeGreaterThan(5);
  });
  test('fixed: only the row whose selection changed', async () => {
    await render(<UsersFixed />);
    expect(await rowsRenderedByOneTap()).toBe(1);
    expect([...rowRenders.keys()]).toEqual([3]);
  });
});

describe('C09 context re-renders', () => {
  const tapCart = async () => {
    consumerRenders.theme = 0;
    consumerRenders.cart = 0;
    for (let i = 0; i < 3; i++) await fireEvent.press(screen.getByRole('button'));
  };
  test('buggy: the theme label re-renders on every cart change', async () => {
    await render(<AppBuggy />);
    await tapCart();
    expect(consumerRenders.theme).toBe(3);
  });
  test('fixed: only the cart consumer re-renders', async () => {
    await render(<AppFixed />);
    await tapCart();
    expect(consumerRenders.theme).toBe(0);
    expect(consumerRenders.cart).toBe(3);
    expect(screen.getByText('Cart (3)')).toBeTruthy();
  });
});

describe('C10 ScrollView + map', () => {
  beforeEach(() => (renders.count = 0));
  test('buggy: mounts all 2000 rows', async () => {
    await render(<LeaderboardBuggy />);
    expect(renders.count).toBe(SIZE);
  });
  test('fixed: mounts a small window', async () => {
    await render(<LeaderboardFixed />);
    expect(renders.count).toBeLessThan(100);
  });
});
