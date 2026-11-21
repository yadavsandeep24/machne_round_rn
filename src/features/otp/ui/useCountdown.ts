import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Countdown to an absolute deadline (ms since epoch), not a decrementing
 * counter. JS timers are throttled or paused in the background and drift
 * under load; computing `deadline - now` on every tick (and when the app
 * returns to the foreground) is always correct.
 */
export function useCountdown(deadline: number | null, now: () => number = Date.now): number {
  const compute = () => (deadline == null ? 0 : Math.max(0, Math.ceil((deadline - now()) / 1000)));
  const [seconds, setSeconds] = useState(compute);

  useEffect(() => {
    const update = () => setSeconds(compute());
    update();
    if (deadline == null) return;
    const id = setInterval(update, 1000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') update(); // jump straight to the right value after background
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- compute only depends on deadline/now
  }, [deadline, now]);

  return seconds;
}

export const formatMmSs = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
