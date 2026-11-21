import { ScrollView } from 'react-native';

import { Row, SIZE } from './shared';

/**
 * SLOW: "leaderboard takes seconds to open". ScrollView + map mounts all
 * 2000 rows (and their native views) up front, even though ~15 are visible.
 */
export function LeaderboardBuggy() {
  return (
    <ScrollView>
      {Array.from({ length: SIZE }, (_, i) => (
        <Row key={i} rank={i + 1} />
      ))}
    </ScrollView>
  );
}
