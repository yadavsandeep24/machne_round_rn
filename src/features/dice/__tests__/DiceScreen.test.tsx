import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { createMemoryStore } from '../../../core/storage/keyValueStore';
import { createDiceStorage } from '../data/historyStore';
import { DiceScreen } from '../ui/DiceScreen';

const fixedRng = () => 0.5; // every die shows sides/2 + 1
let t = 0;
const clock = () => ++t;

test('first launch shows the empty state', async () => {
  await render(<DiceScreen storage={createDiceStorage(createMemoryStore())} rng={fixedRng} now={clock} />);
  expect(await screen.findByText(/No rolls yet/)).toBeTruthy();
});

test('configure 3d6+2, roll, see dice, total and history', async () => {
  await render(<DiceScreen storage={createDiceStorage(createMemoryStore())} rng={fixedRng} now={clock} />);
  await screen.findByText(/No rolls yet/);
  await fireEvent.press(screen.getByLabelText('Increase Dice'));
  await fireEvent.press(screen.getByLabelText('Increase Modifier'));
  await fireEvent.press(screen.getByLabelText('Increase Modifier'));
  await fireEvent.press(screen.getByText('Roll 3d6+2'));
  expect(screen.getByTestId('total')).toHaveTextContent('Total 14'); // 4+4+4+2
  expect(screen.getByText('[4, 4, 4] = 14')).toBeTruthy();
});

test('rapid taps: every roll is recorded, newest first', async () => {
  await render(<DiceScreen storage={createDiceStorage(createMemoryStore())} rng={fixedRng} now={clock} />);
  await screen.findByText(/No rolls yet/);
  for (let i = 0; i < 5; i++) await fireEvent.press(screen.getByText('Roll 2d6'));
  expect(screen.getAllByText('[4, 4] = 8')).toHaveLength(5);
});

test('history survives a restart; clear empties it', async () => {
  const kv = createMemoryStore();
  const first = await render(<DiceScreen storage={createDiceStorage(kv)} rng={fixedRng} now={clock} />);
  await screen.findByText(/No rolls yet/);
  await fireEvent.press(screen.getByLabelText('20 sided die'));
  await fireEvent.press(screen.getByText('Roll 2d20'));
  await waitFor(async () => expect(await kv.getItem('dice_history_v1')).toContain('"sides":20'));
  await first.unmount();

  await render(<DiceScreen storage={createDiceStorage(kv)} rng={fixedRng} now={clock} />);
  expect(await screen.findByText('[11, 11] = 22')).toBeTruthy();
  await fireEvent.press(screen.getByText('Clear'));
  expect(await screen.findByText(/No rolls yet/)).toBeTruthy();
});

test('presets: save the current config and roll it with one tap', async () => {
  await render(<DiceScreen storage={createDiceStorage(createMemoryStore())} rng={fixedRng} now={clock} />);
  await screen.findByText(/No rolls yet/);
  await fireEvent.press(screen.getByLabelText('8 sided die'));
  await fireEvent.press(screen.getByText('Save preset'));
  await fireEvent.press(screen.getByLabelText('4 sided die'));
  await fireEvent.press(screen.getByLabelText('Roll preset 2d8'));
  expect(screen.getByText('[5, 5] = 10')).toBeTruthy();
});
