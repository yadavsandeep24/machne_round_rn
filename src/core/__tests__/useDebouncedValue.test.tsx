import { act, renderHook } from '@testing-library/react-native';

import { useDebouncedValue } from '../hooks/useDebouncedValue';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('emits only after typing stops; blank is instant', async () => {
  const { result, rerender } = await renderHook(
    ({ v }: { v: string }) => useDebouncedValue(v, 300),
    { initialProps: { v: '' } },
  );
  await rerender({ v: 'r' });
  await rerender({ v: 're' });
  await rerender({ v: 'react' });
  expect(result.current).toBe('');
  await act(async () => {
    jest.advanceTimersByTime(300);
  });
  expect(result.current).toBe('react');
  await rerender({ v: '' });
  expect(result.current).toBe('');
});
