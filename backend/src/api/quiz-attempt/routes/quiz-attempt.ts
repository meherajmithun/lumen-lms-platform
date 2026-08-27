import { factories } from '@strapi/strapi';

/**
 * Attempts are written only by the grading endpoint. No generic CRUD, so a
 * student cannot create or edit their own score.
 */
export default factories.createCoreRouter('api::quiz-attempt.quiz-attempt', { only: [] });
