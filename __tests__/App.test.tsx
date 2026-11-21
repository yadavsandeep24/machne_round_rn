import { render, screen } from '@testing-library/react-native';

import App from '../App';
import { testServices } from '../test/testServices';

test('app opens the transaction history', async () => {
  await render(<App services={testServices()} />);
  expect(await screen.findByLabelText('Search transactions')).toBeTruthy();
});
