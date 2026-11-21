import { render, screen } from '@testing-library/react-native';

import App from '../App';
import { testServices } from '../test/testServices';

test('app shell renders the users table demo', async () => {
  await render(<App services={testServices()} />);
  expect(await screen.findByText('Get all users')).toBeTruthy();
});
