import { useEffect, useState } from 'react';
import { Text } from 'react-native';

/**
 * BUG: "the screen calls the API forever". `query` is a new object on every
 * render, so the effect runs after every render, sets state, re-renders, and
 * runs again. (React stops it with "Maximum update depth" only if the update
 * is synchronous; with a fetch it silently hammers the server.)
 */
export function SearchBuggy({ fetchResults, maxRuns = 20 }: { fetchResults: (q: { term: string; page: number }) => Promise<number>; maxRuns?: number }) {
  const [count, setCount] = useState(0);
  const [runs, setRuns] = useState(0);
  const query = { term: 'react', page: 1 }; // new identity each render
  useEffect(() => {
    if (runs >= maxRuns) return; // safety net for the demo only
    fetchResults(query).then((n) => {
      setCount(n);
      setRuns((r) => r + 1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the bug, on purpose
  }, [query]);
  return <Text>{count} results</Text>;
}
