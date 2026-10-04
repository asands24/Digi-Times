import { getEventsForDate, getHistorySelection, historicalEvents } from '../data/historicalEvents';
it('never labels monthly fallback milestones as exact-day matches', () => {
  expect(getEventsForDate(9, 30)).toEqual([]);
  const selection = getHistorySelection(new Date(2026, 8, 30));
  expect(selection.exact).toEqual([]);
  expect(selection.nearby.length).toBeGreaterThanOrEqual(2);
  expect(selection.nearby.every(event => event.month === 9 && event.day !== 30)).toBe(true);
});
it('is deterministic, source-backed and covers every month including leap day fallback', () => {
  for (let month = 0; month < 12; month++) {
    const { exact, nearby } = getHistorySelection(new Date(2026, month, 1));
    expect(exact.length + nearby.length).toBeGreaterThanOrEqual(2);
    expect(exact.length + nearby.length).toBeLessThanOrEqual(3);
  }
  expect(getEventsForDate(4, 16, 3, 'pets')).toEqual(getEventsForDate(4, 16, 3, 'pets'));
  expect(historicalEvents.every(event => event.source.startsWith('https://'))).toBe(true);
  expect(getHistorySelection(new Date(2024, 1, 29)).nearby).toHaveLength(2);
  expect(getHistorySelection(new Date('invalid'))).toEqual({ exact: [], nearby: [] });
});
