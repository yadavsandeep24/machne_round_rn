import { fireEvent, render, screen } from '@testing-library/react-native';

import { CartBuggy } from '../c04_mutated_state/buggy';
import { CartFixed } from '../c04_mutated_state/fixed';
import { TasksBuggy } from '../c05_index_keys/buggy';
import { TasksFixed } from '../c05_index_keys/fixed';
import { GreetingBuggy } from '../c06_state_from_props/buggy';
import { GreetingFixed } from '../c06_state_from_props/fixed';
import { FeedBuggy } from '../c07_nested_lists/buggy';
import { FeedFixed } from '../c07_nested_lists/fixed';

describe('C04 mutated state', () => {
  const addThree = async () => {
    for (let i = 0; i < 3; i++) await fireEvent.press(screen.getByText('Add'));
  };
  test('buggy: count never updates', async () => {
    await render(<CartBuggy />);
    await addThree();
    expect(screen.getByText('Items in cart: 0')).toBeTruthy();
  });
  test('fixed: 3', async () => {
    await render(<CartFixed />);
    await addThree();
    expect(screen.getByText('Items in cart: 3')).toBeTruthy();
  });
});

describe('C05 index keys', () => {
  const checked = (label: string) =>
    screen.getByLabelText(`Task ${label}`).props.accessibilityState?.checked as boolean;
  const checkBDeleteA = async () => {
    await fireEvent.press(screen.getByLabelText('Task B'));
    await fireEvent.press(screen.getByLabelText('Delete A'));
  };
  test('buggy: the check jumps from B to C', async () => {
    await render(<TasksBuggy />);
    await checkBDeleteA();
    expect(checked('B')).toBe(false);
    expect(checked('C')).toBe(true);
  });
  test('fixed: B stays checked', async () => {
    await render(<TasksFixed />);
    await checkBDeleteA();
    expect(checked('B')).toBe(true);
    expect(checked('C')).toBe(false);
  });
});

describe('C06 props copied into state', () => {
  test('buggy: ignores the new prop', async () => {
    const { rerender } = await render(<GreetingBuggy name="Ada" />);
    await rerender(<GreetingBuggy name="Grace" />);
    expect(screen.getByTestId('greeting')).toHaveTextContent('Hello, Ada');
  });
  test('fixed: follows the prop', async () => {
    const { rerender } = await render(<GreetingFixed name="Ada" />);
    await rerender(<GreetingFixed name="Grace" />);
    expect(screen.getByTestId('greeting')).toHaveTextContent('Hello, Grace');
  });
});

/**
 * On a device React Native logs "VirtualizedLists should never be nested…".
 * Jest's mocked ScrollView provides no scroll context, so the warning never
 * fires there; the test checks the structure instead: a scroll container
 * inside another scroll container with the same orientation.
 */
type Node = { type: unknown; props: Record<string, unknown>; children: (Node | string)[] };
function nestedVerticalScrollers(node: Node, insideScroller = false): number {
  const isScroller = node.type === 'RCTScrollView' && !node.props.horizontal;
  const here = isScroller && insideScroller ? 1 : 0;
  return (
    here +
    node.children.reduce<number>(
      (n, c) => n + (typeof c === 'string' ? 0 : nestedVerticalScrollers(c, insideScroller || isScroller)),
      0,
    )
  );
}

describe('C07 nested virtualized lists', () => {
  test('buggy: a vertical list inside a vertical ScrollView', async () => {
    await render(<FeedBuggy />);
    expect(nestedVerticalScrollers(screen.root as unknown as Node)).toBe(1);
  });
  test('fixed: one scroller; header inside the list; only a window of rows', async () => {
    await render(<FeedFixed />);
    expect(nestedVerticalScrollers(screen.root as unknown as Node)).toBe(0);
    expect(screen.getByText("Today's feed")).toBeTruthy();
    expect(screen.queryByText('Story 199')).toBeNull();
  });
});
