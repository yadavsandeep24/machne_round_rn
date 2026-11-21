import { useEffect, useState } from 'react';

/** Returns `value` after it stopped changing for `delayMs`. Blank is instant. */
export function useDebouncedValue(value: string, delayMs = 300): string {
  const [debounced, setDebounced] = useState(value);
  const isBlank = value.trim() === '';
  useEffect(() => {
    if (isBlank) return;
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id); // the next keystroke cancels the pending update
  }, [value, delayMs, isBlank]);
  // Clearing the field must not wait for the timer.
  return isBlank ? value : debounced;
}
