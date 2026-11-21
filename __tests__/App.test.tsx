import { render, screen } from '@testing-library/react-native';

import App from '../App';
import { testServices } from '../test/testServices';

test('app opens the dice roller', async () => {
  await render(<App services={testServices()} />);
  expect(await screen.findByText('Roll 2d6')).toBeTruthy();
});
