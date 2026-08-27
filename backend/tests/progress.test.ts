import { describe, expect, it } from 'vitest';
import { calculateProgress } from '../src/utils/progress';

describe('calculateProgress', () => {
  it('returns zero for a course with no lessons', () => {
    expect(calculateProgress([], [])).toEqual({
      completed: 0,
      total: 0,
      percent: 0,
      completedLessonIds: [],
    });
  });

  it('calculates partial progress with defined rounding', () => {
    expect(calculateProgress(['a', 'b', 'c'], ['a'])).toMatchObject({
      completed: 1,
      total: 3,
      percent: 33,
    });
  });

  it('returns 100 for a fully completed course', () => {
    expect(calculateProgress(['a', 'b'], ['a', 'b'])).toMatchObject({
      completed: 2,
      total: 2,
      percent: 100,
    });
  });

  it('deduplicates repeated completion rows', () => {
    expect(calculateProgress(['a', 'b'], ['a', 'a'])).toMatchObject({
      completed: 1,
      percent: 50,
    });
  });

  it('ignores deleted and unrelated lessons', () => {
    expect(calculateProgress(['a', 'b'], ['a', 'other', null, undefined])).toEqual({
      completed: 1,
      total: 2,
      percent: 50,
      completedLessonIds: ['a'],
    });
  });
});
