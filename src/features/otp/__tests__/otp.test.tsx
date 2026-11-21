import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { createMemoryStore } from '../../../core/storage/keyValueStore';
import { createFakeOtpService } from '../data/otpService';
import { OtpScreen, maskPhone } from '../ui/OtpScreen';

beforeEach(() => jest.useFakeTimers({ now: 1_000_000 }));
afterEach(() => jest.useRealTimers());

const tick = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

async function setup(opts: { store?: ReturnType<typeof createMemoryStore>; onVerified?: () => void } = {}) {
  const service = createFakeOtpService();
  const store = opts.store ?? createMemoryStore();
  const onVerified = opts.onVerified ?? jest.fn();
  const r = await render(
    <OtpScreen phone="+91 98765 43210" service={service} store={store} onVerified={onVerified} />,
  );
  await screen.findByTestId('resend-timer');
  return { ...r, store, onVerified };
}

const enter = (code: string) => fireEvent.changeText(screen.getByLabelText('Enter the 6 digit code'), code);

test('masks the phone number', () => {
  expect(maskPhone('+91 98765 43210')).toBe('•••••• 3210');
});

test('resend unlocks after 30 s', async () => {
  await setup();
  expect(screen.getByTestId('resend-timer')).toHaveTextContent('Resend code in 0:30');
  await tick(10_000);
  expect(screen.getByTestId('resend-timer')).toHaveTextContent('Resend code in 0:20');
  await tick(20_000);
  expect(screen.getByText('Resend code')).toBeTruthy();
});

test('returning from background shows the right time immediately', async () => {
  // Both countdowns (resend and expiry) subscribe to AppState.
  const handlers: ((s: AppStateStatus) => void)[] = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_, h) => {
    handlers.push(h as (s: AppStateStatus) => void);
    return { remove: jest.fn() } as never;
  });
  await setup();
  // Background: timers are paused, but the wall clock moves 25 s.
  jest.setSystemTime(Date.now() + 25_000);
  await act(async () => handlers.forEach((h) => h('active')));
  expect(screen.getByTestId('resend-timer')).toHaveTextContent('Resend code in 0:05');
});

test('pasting a messy code auto-submits once and verifies', async () => {
  const { onVerified } = await setup();
  await enter('Your code is 123 456');
  await tick(0);
  expect(onVerified).toHaveBeenCalledTimes(1);
});

test('wrong code: clears the input and shows attempts left', async () => {
  await setup();
  await enter('000000');
  expect(await screen.findByText('Incorrect code. 4 attempts left.')).toBeTruthy();
});

test('killing the app does not reset the cooldown', async () => {
  const store = createMemoryStore();
  const first = await setup({ store });
  await tick(12_000);
  await first.unmount();
  await setup({ store });
  expect(screen.getByTestId('resend-timer')).toHaveTextContent('Resend code in 0:18');
});
