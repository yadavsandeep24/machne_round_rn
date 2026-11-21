import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { User, UsersApi } from '../api/usersApi';
import { DataTable } from '../refactored/DataTable';
import { DataTableStarter } from '../starter/DataTableStarter';

const users: User[] = [
  { id: 1, name: 'Leanne', email: 'l@x.io' },
  { id: 2, name: 'Ervin', email: 'e@x.io' },
];

/** User 1's details are slow (80 ms), user 2's are fast (5 ms). Real timers: see README. */
function racyApi(): UsersApi & { aborted: number[] } {
  const aborted: number[] = [];
  return {
    aborted,
    getUsers: async () => users,
    getUser: (id, signal) =>
      new Promise((resolve, reject) => {
        const t = setTimeout(() => resolve(users.find((u) => u.id === id)!), id === 1 ? 80 : 5);
        signal?.addEventListener('abort', () => {
          clearTimeout(t);
          aborted.push(id);
          reject(new Error('aborted'));
        });
      }),
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function tapUser1ThenUser2(detailsLabels: string[]) {
  await fireEvent.press(screen.getByText('Get all users'));
  await screen.findByText('Leanne');
  for (const label of detailsLabels) await fireEvent.press(screen.getAllByText(label)[0]!);
}

test('starter: the slow response for user 1 overwrites user 2 (race bug)', async () => {
  await render(<DataTableStarter api={racyApi()} />);
  await fireEvent.press(screen.getByText('Get all users'));
  await screen.findByText('Leanne');
  const buttons = screen.getAllByText('Details');
  await fireEvent.press(buttons[0]!); // user 1 (slow)
  await fireEvent.press(buttons[1]!); // user 2 (fast)
  await waitFor(() => expect(screen.getByTestId('details')).toHaveTextContent('Selected: Ervin'));
  await sleep(120); // let the slow, stale response arrive
  expect(screen.getByTestId('details')).toHaveTextContent('Selected: Leanne'); // wrong!
});

test('refactored: the latest request wins and the stale one is aborted', async () => {
  const api = racyApi();
  await render(<DataTable api={api} />);
  await tapUser1ThenUser2([]);
  await fireEvent.press(screen.getByLabelText('Details for Leanne'));
  await fireEvent.press(screen.getByLabelText('Details for Ervin'));
  await waitFor(() => expect(screen.getByTestId('details')).toHaveTextContent('Selected: Ervin'));
  await sleep(120);
  expect(screen.getByTestId('details')).toHaveTextContent('Selected: Ervin');
  expect(api.aborted).toEqual([1]);
});

test('refactored: unmounting aborts the in-flight request', async () => {
  const api = racyApi();
  const { unmount } = await render(<DataTable api={api} />);
  await tapUser1ThenUser2([]);
  await fireEvent.press(screen.getByLabelText('Details for Leanne'));
  await unmount();
  expect(api.aborted).toEqual([1]);
});

test('refactored: an HTTP error is shown, and the list stays', async () => {
  const api: UsersApi = {
    getUsers: async () => users,
    getUser: async () => {
      throw new Error('HTTP 500');
    },
  };
  await render(<DataTable api={api} />);
  await tapUser1ThenUser2([]);
  await fireEvent.press(screen.getByLabelText('Details for Ervin'));
  expect(await screen.findByText('Could not load details: HTTP 500')).toBeTruthy();
  expect(screen.getByText('Leanne')).toBeTruthy();
});
