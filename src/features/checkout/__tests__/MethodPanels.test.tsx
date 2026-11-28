import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { MethodPanels, type Method } from '../MethodPanels';
import { createFakeUpiApi } from '../upiApi';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

async function advance(ms: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

function setup(strategy: 'activity' | 'conditional', approveAfterPolls = 100) {
  const api = createFakeUpiApi(approveAfterPolls);
  const ui = (selected: Method) => (
    <MethodPanels selected={selected} upiApi={api} pollIntervalMs={1000} strategy={strategy} />
  );
  return { api, ui };
}

const checks = (calls: string[]) => calls.filter((c) => c.startsWith('check:')).length;

describe('AFTER: <Activity>', () => {
  test('typed card number survives switching tabs', async () => {
    const { ui } = setup('activity');
    const view = await render(ui('card'));
    await fireEvent.changeText(screen.getByLabelText('Card number'), '4111111111111111');

    await view.rerender(ui('upi'));
    await view.rerender(ui('card'));

    expect(screen.getByLabelText('Card number').props.value).toBe('4111 1111 1111 1111');
    expect(screen.getByText('Card number looks valid')).toBeTruthy();
  });

  test('hidden panels stay mounted but are not visible or accessible', async () => {
    const { ui } = setup('activity');
    await render(ui('upi'));

    expect(screen.queryByLabelText('Card number')).toBeNull();
    expect(screen.getByLabelText('Card number', { includeHiddenElements: true })).toBeTruthy();
  });

  test('polling effect pauses while UPI is hidden and resumes when shown', async () => {
    const { api, ui } = setup('activity');
    const view = await render(ui('upi'));
    await fireEvent.changeText(screen.getByLabelText('UPI ID'), 'asha@okhdfc');
    await fireEvent.press(screen.getByRole('button', { name: 'Send collect request' }));
    await advance(3000);
    expect(checks(api.calls)).toBe(3);

    await view.rerender(ui('card')); // effect cleanup runs: interval cleared
    await advance(5000);
    expect(checks(api.calls)).toBe(3);

    await view.rerender(ui('upi')); // effect re-runs with the same requestId from state
    await advance(2000);
    expect(checks(api.calls)).toBe(5);
    expect(screen.getByLabelText('UPI ID').props.value).toBe('asha@okhdfc');
    expect(screen.getByText('Approve the request in your UPI app…')).toBeTruthy();
  });

  test('approval arrives after the user comes back to UPI', async () => {
    const { ui } = setup('activity', 2);
    const view = await render(ui('upi'));
    await fireEvent.changeText(screen.getByLabelText('UPI ID'), 'asha@okhdfc');
    await fireEvent.press(screen.getByRole('button', { name: 'Send collect request' }));
    await advance(1000);
    await view.rerender(ui('netbanking'));
    await view.rerender(ui('upi'));
    await advance(1000);

    expect(screen.getByText('UPI payment approved')).toBeTruthy();
  });
});

describe('BEFORE: conditional rendering', () => {
  test('typed card number is lost when switching tabs', async () => {
    const { ui } = setup('conditional');
    const view = await render(ui('card'));
    await fireEvent.changeText(screen.getByLabelText('Card number'), '4111111111111111');

    await view.rerender(ui('upi'));
    await view.rerender(ui('card'));

    expect(screen.getByLabelText('Card number').props.value).toBe('');
  });

  test('pending UPI request is forgotten after a round trip', async () => {
    const { ui } = setup('conditional');
    const view = await render(ui('upi'));
    await fireEvent.changeText(screen.getByLabelText('UPI ID'), 'asha@okhdfc');
    await fireEvent.press(screen.getByRole('button', { name: 'Send collect request' }));

    await view.rerender(ui('card'));
    await view.rerender(ui('upi'));

    expect(screen.queryByText('Approve the request in your UPI app…')).toBeNull();
    expect(screen.getByLabelText('UPI ID').props.value).toBe('');
  });
});
