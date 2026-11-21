import { useEffect, useState } from 'react';
import { Text } from 'react-native';

/**
 * BUG: "the timer shows 1 and never moves". The interval callback closed over
 * `seconds` from the FIRST render (0), so every tick sets 0 + 1.
 * (Adding `seconds` to the deps "fixes" it by recreating the interval every
 * second, which drifts and is wasteful.)
 */
export function TimerBuggy() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds(seconds + 1), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the bug, on purpose
  }, []);
  return <Text testID="timer">Elapsed: {seconds} s</Text>;
}
