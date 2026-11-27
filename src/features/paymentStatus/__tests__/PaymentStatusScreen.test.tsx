import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ServicesProvider } from '../../../app/ServicesContext';
import { testServices } from '../../../../test/testServices';
import { createFakePaymentStatusApi } from '../paymentStatusApi';
import { PaymentStatusScreen } from '../PaymentStatusScreen';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

async function advance(ms: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

async function renderScreen(pendingPolls = 2) {
  const payments = createFakePaymentStatusApi(pendingPolls);
  await render(
    <ServicesProvider services={testServices({ payments })}>
      <PaymentStatusScreen intervalMs={1000} />
    </ServicesProvider>,
  );
  await advance(0);
  return payments;
}

test('toggling the receipt switch while waiting uses the latest value and does not restart polling', async () => {
  const payments = await renderScreen(2);
  expect(screen.getByText('Waiting for the bank…')).toBeTruthy();

  await fireEvent(screen.getByLabelText('Email me a receipt'), 'valueChange', true);
  await fireEvent(screen.getByLabelText('Email me a receipt'), 'valueChange', false);
  await fireEvent(screen.getByLabelText('Email me a receipt'), 'valueChange', true);
  expect(payments.calls).toHaveLength(1); // three re-renders, still one request

  await advance(2000);

  expect(screen.getByText('Payment successful')).toBeTruthy();
  expect(screen.getByText('Receipt sent to your email.')).toBeTruthy();
  expect(screen.getByLabelText('Status checks: 3')).toBeTruthy();
});

test('a failed payment shows the failure message and a new payment can start', async () => {
  const payments = await renderScreen(1);
  await advance(1000);
  expect(screen.getByText('No receipt requested.')).toBeTruthy();

  await fireEvent(screen.getByLabelText('Next payment fails'), 'valueChange', true);
  await fireEvent.press(screen.getByRole('button', { name: 'Start a new payment' }));
  expect(screen.getByText('Payment pay_2-fail')).toBeTruthy();

  await advance(0);
  await advance(1000);
  expect(screen.getByText('Payment failed')).toBeTruthy();
  expect(screen.getByText('No money was taken. You can try again.')).toBeTruthy();
  expect(payments.calls.filter((id) => id === 'pay_2-fail')).toHaveLength(2);
});
