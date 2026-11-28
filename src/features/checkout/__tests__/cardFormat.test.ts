import { formatCardNumber, isLuhnValid } from '../cardFormat';
import { isValidVpa } from '../upiApi';

test('formats card numbers in groups of four', () => {
  expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
  expect(formatCardNumber('4111-11a')).toBe('4111 11');
});

test('Luhn check', () => {
  expect(isLuhnValid('4111 1111 1111 1111')).toBe(true);
  expect(isLuhnValid('4111 1111 1111 1112')).toBe(false);
  expect(isLuhnValid('4111')).toBe(false);
});

test('VPA validation', () => {
  expect(isValidVpa('asha@okhdfc')).toBe(true);
  expect(isValidVpa('asha')).toBe(false);
});
