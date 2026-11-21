import { render, screen } from '@testing-library/react-native';

import App from '../App';

test('blank app renders', async () => {
  await render(<App />);
  expect(screen.getByText('Start here')).toBeTruthy();
});
