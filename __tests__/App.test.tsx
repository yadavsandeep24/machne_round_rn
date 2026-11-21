import { render, screen } from '@testing-library/react-native';

import App from '../App';
import { testServices } from '../test/testServices';

test('app opens the OTP screen', async () => {
  await render(<App services={testServices()} />);
  expect(await screen.findByText('Enter verification code')).toBeTruthy();
});
