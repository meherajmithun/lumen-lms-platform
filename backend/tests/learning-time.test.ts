import { describe, expect, it } from 'vitest';
import { buildLearningHistory, heartbeatIncrement } from '../src/utils/learning-time';

describe('heartbeatIncrement', () => {
  it('uses server elapsed time', () => {
    expect(heartbeatIncrement(new Date('2026-08-05T10:00:00Z'), new Date('2026-08-05T10:00:15Z'))).toBe(15);
  });

  it('caps delayed heartbeats and rejects negative clock movement', () => {
    expect(heartbeatIncrement(new Date('2026-08-05T10:00:00Z'), new Date('2026-08-05T10:02:00Z'))).toBe(20);
    expect(heartbeatIncrement(new Date('2026-08-05T10:00:15Z'), new Date('2026-08-05T10:00:00Z'))).toBe(0);
  });
});

describe('buildLearningHistory', () => {
  const today = new Date('2026-08-05T12:00:00Z');

  it('fills missing dates with zero and aggregates sessions on one date', () => {
    const history = buildLearningHistory([
      { date: '2026-08-05', activeSeconds: 60 },
      { date: '2026-08-05', activeSeconds: 30 },
      { date: '2026-08-03', activeSeconds: 15 },
    ], 4, today);
    expect(history.data).toEqual([
      { date: '2026-08-02', activeSeconds: 0 },
      { date: '2026-08-03', activeSeconds: 15 },
      { date: '2026-08-04', activeSeconds: 0 },
      { date: '2026-08-05', activeSeconds: 90 },
    ]);
    expect(history.summary).toMatchObject({ totalSeconds: 105, activeDays: 2 });
  });

  it('calculates current and longest streaks', () => {
    const history = buildLearningHistory([
      { date: '2026-08-01', activeSeconds: 10 },
      { date: '2026-08-02', activeSeconds: 10 },
      { date: '2026-08-04', activeSeconds: 10 },
      { date: '2026-08-05', activeSeconds: 10 },
    ], 5, today);
    expect(history.summary).toMatchObject({ currentStreak: 2, longestStreak: 2 });
  });

  it('returns stable zero summaries for no activity', () => {
    expect(buildLearningHistory([], 3, today).summary).toEqual({
      totalSeconds: 0,
      activeDays: 0,
      currentStreak: 0,
      longestStreak: 0,
    });
  });
});
