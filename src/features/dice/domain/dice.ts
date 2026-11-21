/** Pure domain logic: no React, fully unit-testable. */

export const DIE_TYPES = [4, 6, 8, 10, 12, 20] as const;
export type DieType = (typeof DIE_TYPES)[number];

export const MIN_DICE = 1;
export const MAX_DICE = 20;
export const MAX_MODIFIER = 99;

export interface RollConfig {
  count: number;
  sides: DieType;
  modifier: number;
}

export interface RollResult {
  id: string;
  config: RollConfig;
  dice: number[];
  total: number;
  /** ms since epoch */
  at: number;
}

/** Random source is injected so tests are deterministic. Returns [0, 1). */
export type Rng = () => number;

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Normalises any input (0 dice, 1000 dice, NaN, d7) into a valid config. */
export function normalize(config: RollConfig): RollConfig {
  const count = Number.isFinite(config.count) ? Math.round(config.count) : MIN_DICE;
  const modifier = Number.isFinite(config.modifier) ? Math.round(config.modifier) : 0;
  return {
    count: clamp(count, MIN_DICE, MAX_DICE),
    sides: (DIE_TYPES as readonly number[]).includes(config.sides) ? config.sides : 6,
    modifier: clamp(modifier, -MAX_MODIFIER, MAX_MODIFIER),
  };
}

export function rollDice(input: RollConfig, rng: Rng, now: number, id: string): RollResult {
  const config = normalize(input);
  // floor(rng * sides) + 1 is uniform over 1..sides for rng in [0, 1).
  const dice = Array.from({ length: config.count }, () => Math.floor(rng() * config.sides) + 1);
  const total = dice.reduce((a, b) => a + b, 0) + config.modifier;
  return { id, config, dice, total, at: now };
}

/** "3d6", "1d20+5", "2d8-1" */
export function formatNotation({ count, sides, modifier }: RollConfig): string {
  const mod = modifier === 0 ? '' : modifier > 0 ? `+${modifier}` : `${modifier}`;
  return `${count}d${sides}${mod}`;
}

/** Parses "3d6+2" (case/space-insensitive). Returns null for invalid input. */
export function parseNotation(text: string): RollConfig | null {
  const m = /^\s*(\d{1,3})\s*d\s*(\d{1,3})\s*(?:([+-])\s*(\d{1,3}))?\s*$/i.exec(text);
  if (!m) return null;
  const count = Number(m[1]);
  const sides = Number(m[2]);
  const modifier = m[3] ? Number(m[4]) * (m[3] === '-' ? -1 : 1) : 0;
  if (count < MIN_DICE || count > MAX_DICE) return null;
  if (!(DIE_TYPES as readonly number[]).includes(sides)) return null;
  if (Math.abs(modifier) > MAX_MODIFIER) return null;
  return { count, sides: sides as DieType, modifier };
}
