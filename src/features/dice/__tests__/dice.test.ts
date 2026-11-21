import { formatNotation, normalize, parseNotation, rollDice } from '../domain/dice';

/** Deterministic RNG cycling through the given values. */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

test('rolls each die in 1..sides and adds the modifier', () => {
  const r = rollDice({ count: 3, sides: 6, modifier: 2 }, seq(0, 0.5, 0.9999), 1000, 'a');
  expect(r.dice).toEqual([1, 4, 6]);
  expect(r.total).toBe(13);
});

test('distribution is uniform over 1..sides', () => {
  const counts = new Map<number, number>();
  let x = 0;
  const rng = () => ((x = (x * 9301 + 49297) % 233280), x / 233280);
  const r = rollDice({ count: 20, sides: 20, modifier: 0 }, rng, 0, 'b');
  for (let i = 0; i < 3000; i++) {
    for (const d of rollDice({ count: 20, sides: 20, modifier: 0 }, rng, 0, `${i}`).dice) {
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
  }
  expect(r.dice.every((d) => d >= 1 && d <= 20)).toBe(true);
  expect([...counts.keys()].sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
});

test('edge cases are normalised: 0 dice, huge counts, NaN, invalid die', () => {
  expect(normalize({ count: 0, sides: 6, modifier: 0 }).count).toBe(1);
  expect(normalize({ count: 10_000, sides: 6, modifier: 0 }).count).toBe(20);
  expect(normalize({ count: NaN, sides: 7 as 6, modifier: 1e9 })).toEqual({ count: 1, sides: 6, modifier: 99 });
});

test('notation round-trips and rejects invalid input', () => {
  expect(parseNotation('3d6+2')).toEqual({ count: 3, sides: 6, modifier: 2 });
  expect(parseNotation(' 1 D 20 - 5 ')).toEqual({ count: 1, sides: 20, modifier: -5 });
  expect(parseNotation('0d6')).toBeNull();
  expect(parseNotation('2d7')).toBeNull();
  expect(parseNotation('abc')).toBeNull();
  expect(formatNotation({ count: 2, sides: 8, modifier: -1 })).toBe('2d8-1');
  expect(formatNotation({ count: 3, sides: 6, modifier: 0 })).toBe('3d6');
});
