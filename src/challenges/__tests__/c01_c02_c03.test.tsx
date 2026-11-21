import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Keyboard } from 'react-native';

import { TimerBuggy } from '../c01_stale_closure/buggy';
import { TimerFixed } from '../c01_stale_closure/fixed';
import { KeyboardWatcherBuggy } from '../c02_listener_leak/buggy';
import { KeyboardWatcherFixed } from '../c02_listener_leak/fixed';
import { SearchBuggy } from '../c03_effect_loop/buggy';
import { SearchFixed } from '../c03_effect_loop/fixed';

describe('C01 stale closure', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  const tick = (ms: number) => act(async () => void jest.advanceTimersByTime(ms));

  test('buggy: stuck at 1', async () => {
    await render(<TimerBuggy />);
    await tick(5000);
    expect(screen.getByTestId('timer')).toHaveTextContent('Elapsed: 1 s');
  });
  test('fixed: counts', async () => {
    await render(<TimerFixed />);
    await tick(5000);
    expect(screen.getByTestId('timer')).toHaveTextContent('Elapsed: 5 s');
  });
});

describe('C02 listener leak', () => {
  // Track each subscription separately (the same callback can be added twice).
  let active: Set<object>;
  beforeEach(() => {
    active = new Set();
    jest.spyOn(Keyboard, 'addListener').mockImplementation(() => {
      const sub = { remove: () => active.delete(sub) };
      active.add(sub);
      return sub as never;
    });
  });
  const rerenderThreeTimes = async () => {
    for (let i = 0; i < 3; i++) await fireEvent.press(screen.getByRole('button'));
  };

  test('buggy: 4 listeners after 3 re-renders, still there after unmount', async () => {
    const { unmount } = await render(<KeyboardWatcherBuggy onShow={() => {}} />);
    await rerenderThreeTimes();
    expect(active.size).toBe(4);
    await unmount();
    expect(active.size).toBe(4);
  });
  test('fixed: exactly one, removed on unmount', async () => {
    const { unmount } = await render(<KeyboardWatcherFixed onShow={() => {}} />);
    await rerenderThreeTimes();
    expect(active.size).toBe(1);
    await unmount();
    expect(active.size).toBe(0);
  });
});

describe('C03 object in deps', () => {
  const flush = () => act(async () => void (await new Promise((r) => setTimeout(r, 20))));
  test('buggy: keeps calling the API (capped at 5 here)', async () => {
    const fetch = jest.fn(async () => 7);
    await render(<SearchBuggy fetchResults={fetch} maxRuns={5} />);
    await flush();
    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(5);
  });
  test('fixed: one call', async () => {
    const fetch = jest.fn(async () => 7);
    await render(<SearchFixed fetchResults={fetch} />);
    await flush();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText('7 results')).toBeTruthy();
  });
});
