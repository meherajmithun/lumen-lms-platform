import { describe, expect, it } from 'vitest';
import { gradeQuestions } from '../src/utils/grading';

const questions = [
  { documentId: 'q1', correctOptionId: 'a' },
  { documentId: 'q2', correctOptionId: 'b' },
  { documentId: 'q3', correctOptionId: 'c' },
];

describe('gradeQuestions', () => {
  it('scores an entirely correct submission', () => {
    const result = gradeQuestions(questions, [
      { questionId: 'q1', selectedOptionId: 'a' },
      { questionId: 'q2', selectedOptionId: 'b' },
      { questionId: 'q3', selectedOptionId: 'c' },
    ], 60);
    expect(result).toMatchObject({ correctCount: 3, totalQuestions: 3, score: 100, passed: true });
  });

  it('counts unanswered and wrong questions as incorrect', () => {
    const result = gradeQuestions(questions, [
      { questionId: 'q1', selectedOptionId: 'wrong' },
    ], 60);
    expect(result).toMatchObject({ correctCount: 0, score: 0, passed: false });
    expect(result.answers[1].selectedOptionId).toBeNull();
  });

  it('ignores unknown questions and counts each real question once', () => {
    const result = gradeQuestions(questions, [
      { questionId: 'unknown', selectedOptionId: 'anything' },
      { questionId: 'q1', selectedOptionId: 'a' },
    ], 33);
    expect(result).toMatchObject({ correctCount: 1, totalQuestions: 3, score: 33, passed: true });
  });

  it('uses the last duplicate answer deterministically', () => {
    const result = gradeQuestions(questions, [
      { questionId: 'q1', selectedOptionId: 'wrong' },
      { questionId: 'q1', selectedOptionId: 'a' },
    ], 0);
    expect(result.correctCount).toBe(1);
    expect(result.answers).toHaveLength(3);
  });

  it('returns a stable zero for a quiz with no questions', () => {
    expect(gradeQuestions([], [], 60)).toMatchObject({
      correctCount: 0,
      totalQuestions: 0,
      score: 0,
      passed: false,
    });
  });

  it('applies the pass mark at its exact boundary', () => {
    const result = gradeQuestions(
      questions,
      [{ questionId: 'q1', selectedOptionId: 'a' }, { questionId: 'q2', selectedOptionId: 'b' }],
      67
    );
    expect(result.score).toBe(67);
    expect(result.passed).toBe(true);
  });
});
