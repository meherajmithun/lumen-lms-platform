import { factories } from '@strapi/strapi';
import { gradeQuestions, type GradeResult, type SubmittedAnswer } from '../../../utils/grading';

export type { GradeResult, SubmittedAnswer } from '../../../utils/grading';

export default factories.createCoreService('api::quiz.quiz', ({ strapi }) => ({
  /**
   * Grades a submission on the server.
   *
   * We iterate the quiz's questions, not the submission, which makes three edge
   * cases fall out for free: an unanswered question counts as wrong, an unknown
   * questionId in the payload is ignored, and a duplicate answer cannot be
   * double-counted.
   */
  async grade(quizDocumentId: string, submitted: SubmittedAnswer[]): Promise<GradeResult | null> {
    const quiz = await strapi.documents('api::quiz.quiz').findOne({
      documentId: quizDocumentId,
      populate: { questions: true },
    });
    if (!quiz) return null;

    const questions = (quiz.questions ?? []) as Array<{
      documentId: string;
      correctOptionId: string;
    }>;

    return gradeQuestions(questions, submitted, quiz.passingScore ?? 0);
  },
}));
