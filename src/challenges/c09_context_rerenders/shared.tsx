/** Debug-only render counters for the tests. */
export const consumerRenders = { theme: 0, cart: 0 };
export function countRender(name: keyof typeof consumerRenders) {
  consumerRenders[name] += 1;
}
