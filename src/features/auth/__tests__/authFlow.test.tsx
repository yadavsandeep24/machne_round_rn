import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { fireEvent, render, screen } from '@testing-library/react-native';

import App from '../../../../App';
import { testServices } from '../../../../test/testServices';

beforeEach(async () => {
  (SecureStore as unknown as { __reset(): void }).__reset();
  await AsyncStorage.clear();
});

async function signIn(password: string) {
  await fireEvent.changeText(await screen.findByLabelText('Username'), 'demo');
  await fireEvent.changeText(screen.getByLabelText('Password'), password);
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
}

test('validation errors before any request', async () => {
  await render(<App services={testServices()} />);
  await screen.findByLabelText('Username');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  expect(screen.getByText('Enter your username')).toBeTruthy();
  expect(screen.getByText('Enter your password')).toBeTruthy();
});

test('wrong password shows a generic message', async () => {
  await render(<App services={testServices()} />);
  await signIn('wrongpass');
  expect(await screen.findByText('Wrong username or password')).toBeTruthy();
});

test('sign in → profile; tokens are in SecureStore, never AsyncStorage', async () => {
  await render(<App services={testServices()} />);
  await signIn('secret12');
  expect(await screen.findByText('Hello, Demo')).toBeTruthy();
  expect(await SecureStore.getItemAsync('session_v1')).toContain('a1');
  expect(await AsyncStorage.getAllKeys()).toEqual([]);
});

test('session restores at launch; log out returns to sign in', async () => {
  await SecureStore.setItemAsync('session_v1', JSON.stringify({ accessToken: 'a1', refreshToken: 'r1' }));
  await render(<App services={testServices()} />);
  expect(await screen.findByText('Hello, Demo')).toBeTruthy();
  await fireEvent.press(screen.getByText('Log out'));
  expect(await screen.findByLabelText('Username')).toBeTruthy();
  expect(await SecureStore.getItemAsync('session_v1')).toBeNull();
});
