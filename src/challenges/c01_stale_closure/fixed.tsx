import { useEffect, useState } from 'react';
import { Text } from 'react-native';

/** FIX: functional update reads the latest state, so the effect needs no deps. */
export function TimerFixed() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <Text testID="timer">Elapsed: {seconds} s</Text>;
}
