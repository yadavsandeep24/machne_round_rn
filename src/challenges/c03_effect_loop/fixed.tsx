import { useEffect, useState } from 'react';
import { Text } from 'react-native';

/**
 * FIX: depend on primitives (`term`, `page`), or memoise the object with
 * useMemo. Objects, arrays and functions created during render are new every
 * time; `[]` and `{}` are never equal to the previous ones.
 */
export function SearchFixed({ fetchResults }: { fetchResults: (q: { term: string; page: number }) => Promise<number>; maxRuns?: number }) {
  const [count, setCount] = useState(0);
  const term = 'react';
  const page = 1;
  useEffect(() => {
    let active = true;
    fetchResults({ term, page }).then((n) => active && setCount(n));
    return () => {
      active = false;
    };
  }, [fetchResults, term, page]);
  return <Text>{count} results</Text>;
}
