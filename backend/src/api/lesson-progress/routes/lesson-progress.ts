import { factories } from '@strapi/strapi';

/**
 * Progress rows are written only by the lesson complete/uncomplete endpoints and
 * read only through the progress services. Exposing generic CRUD would let a
 * student forge their own completion records.
 */
export default factories.createCoreRouter('api::lesson-progress.lesson-progress', {
  only: [],
});
