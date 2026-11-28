import { fireEvent, render, screen } from '@testing-library/react-native';

import { CheckoutScreen } from '../CheckoutScreen';
import { createFakeUpiApi } from '../upiApi';

test('tabs switch panels and keep the selected bank', async () => {
  await render(<CheckoutScreen upiApi={createFakeUpiApi()} />);
  expect(screen.getByRole('tab', { name: 'UPI', selected: true })).toBeTruthy();

  await fireEvent.press(screen.getByRole('tab', { name: 'Netbanking' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'ICICI Bank' }));
  await fireEvent.press(screen.getByRole('tab', { name: 'Card' }));
  await fireEvent.press(screen.getByRole('tab', { name: 'Netbanking' }));

  expect(screen.getByRole('radio', { name: 'ICICI Bank', selected: true })).toBeTruthy();
});

test('send button is disabled until the UPI ID is valid', async () => {
  await render(<CheckoutScreen upiApi={createFakeUpiApi()} />);
  const send = () => screen.getByRole('button', { name: 'Send collect request' });
  expect(send()).toBeDisabled();

  await fireEvent.changeText(screen.getByLabelText('UPI ID'), 'asha@okhdfc');
  expect(send()).toBeEnabled();
});
