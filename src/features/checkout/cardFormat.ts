/** "4111111111111111" -> "4111 1111 1111 1111" (digits only, max 19). */
export function formatCardNumber(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** Luhn checksum, used by every card network. */
export function isLuhnValid(input: string): boolean {
  const digits = input.replace(/\D/g, '');
  if (digits.length < 12) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}
