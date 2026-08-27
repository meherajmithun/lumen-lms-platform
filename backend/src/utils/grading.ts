export type SubmittedAnswer = { questionId: string; selectedOptionId: string | null };

export type GradableQuestion = {
  documentId: string;
  correctOptionId: string;
};

export type GradeResult = {
  answers: Array<{
    questionId: string;
    selectedOptionId: string | null;
    correctOptionId: string;
    correct: boolean;
  }>;
  correctCount: number;
  totalQuestions: number;
  score: number;
  passed: boolean;
};

/** Pure grading logic; the service owns database reads, this owns the maths. */
export function gradeQuestions(
  questions: GradableQuestion[],
  submitted: SubmittedAnswer[],
  passingScore: number
): GradeResult {
  // Last answer wins deterministically; each quiz question is still counted once.
  const given = new Map(submitted.map((answer) => [answer.questionId, answer.selectedOptionId]));
  const answers = questions.map((question) => {
    const selectedOptionId = given.get(question.documentId) ?? null;
    return {
      questionId: question.documentId,
      selectedOptionId,
      correctOptionId: question.correctOptionId,
      correct: selectedOptionId !== null && selectedOptionId === question.correctOptionId,
    };
  });
  const totalQuestions = questions.length;
  const correctCount = answers.filter((answer) => answer.correct).length;
  const score = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);

  return { answers, correctCount, totalQuestions, score, passed: score >= passingScore };
}
