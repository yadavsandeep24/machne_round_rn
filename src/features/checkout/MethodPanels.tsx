import { Activity, type ReactNode } from 'react';

import { CardPanel, NetbankingPanel, UpiPanel } from './panels';
import type { UpiApi } from './upiApi';

export type Method = 'upi' | 'card' | 'netbanking';
export const METHODS: { key: Method; label: string }[] = [
  { key: 'upi', label: 'UPI' },
  { key: 'card', label: 'Card' },
  { key: 'netbanking', label: 'Netbanking' },
];

type Props = {
  selected: Method;
  upiApi: UpiApi;
  pollIntervalMs: number;
  /**
   * 'activity' (React 19.2): every panel stays mounted; hidden ones keep state, pause effects.
   * 'conditional' (before): only the selected panel is mounted; switching away destroys its state.
   * Both are kept so the README and tests can compare them side by side.
   */
  strategy?: 'activity' | 'conditional';
};

export function MethodPanels({ selected, upiApi, pollIntervalMs, strategy = 'activity' }: Props) {
  const panels: Record<Method, ReactNode> = {
    upi: <UpiPanel api={upiApi} intervalMs={pollIntervalMs} />,
    card: <CardPanel />,
    netbanking: <NetbankingPanel />,
  };

  if (strategy === 'conditional') {
    // BEFORE: `{tab === 'card' && <CardPanel />}`. Typed data is lost on every switch.
    return panels[selected];
  }

  // AFTER: hidden panels render with display: none. React cleans up their effects and
  // processes their updates at low priority, but keeps their state and DOM/native views.
  return METHODS.map(({ key }) => (
    <Activity key={key} mode={key === selected ? 'visible' : 'hidden'}>
      {panels[key]}
    </Activity>
  ));
}
