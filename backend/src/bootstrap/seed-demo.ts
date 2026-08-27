import type { Core } from '@strapi/strapi';
import { ROLES, type RoleType } from '../constants/roles';

/**
 * Demo data for local development and for the reviewer walkthrough.
 *
 * Top-up rather than all-or-nothing: every entity is created only if it is
 * missing, keyed on email or slug. That makes the seed safe to run on every boot,
 * and it repairs demo content that was removed during testing instead of leaving
 * a half-populated database behind.
 */

type SeedUser = { username: string; email: string; role: RoleType };

const PASSWORD = process.env.SEED_PASSWORD ?? 'Passw0rd!';

const USERS: SeedUser[] = [
  { username: 'Amina Admin',      email: 'admin@lms.test',         role: ROLES.ADMIN },
  { username: 'Carlos Manager',   email: 'cm@lms.test',            role: ROLES.CONTENT_MANAGER },
  { username: 'Ingrid Teacher',   email: 'instructor.a@lms.test',  role: ROLES.INSTRUCTOR },
  { username: 'Ivan Teacher',     email: 'instructor.b@lms.test',  role: ROLES.INSTRUCTOR },
  { username: 'Sara Student',     email: 'student1@lms.test',      role: ROLES.STUDENT },
  { username: 'Sam Student',      email: 'student2@lms.test',      role: ROLES.STUDENT },
  { username: 'Sofia Student',    email: 'student3@lms.test',      role: ROLES.STUDENT },
];

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const lesson = (title: string, order: number, video?: string) =>
  video
    ? { title, order, contentType: 'video' as const, videoUrl: video, durationMinutes: 8 }
    : {
        title,
        order,
        contentType: 'text' as const,
        durationMinutes: 6,
        body:
          `## ${title}\n\n` +
          `This lesson covers ${title.toLowerCase()}. Work through the explanation, then ` +
          `mark it complete to move your course progress forward.\n\n` +
          `Key points:\n- Understand the core idea\n- Try it yourself\n- Check your understanding in the quiz`,
      };

const COURSES = [
  {
    owner: 'instructor.a@lms.test',
    title: 'Foundations of Web Development',
    level: 'beginner',
    description: 'HTML, CSS and the request/response cycle — the groundwork everything else sits on.',
    coverImageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
    lessons: [
      lesson('How the web actually works', 1),
      lesson('Structuring a page with HTML', 2),
      lesson('Styling with CSS', 3, 'https://www.youtube.com/embed/1PnVor36_40'),
      lesson('Your first deployed page', 4),
    ],
    quiz: {
      title: 'Web Foundations Check',
      passingScore: 60,
      questions: [
        { prompt: 'What does HTTP stand for?', options: ['HyperText Transfer Protocol', 'High Transfer Text Process', 'Hyperlink Type Transfer', 'Host Transfer Protocol'], correct: 0 },
        { prompt: 'Which tag defines the largest heading in HTML?', options: ['<head>', '<h6>', '<h1>', '<title>'], correct: 2 },
        { prompt: 'Which CSS property controls text size?', options: ['text-style', 'font-size', 'text-size', 'font-weight'], correct: 1 },
        { prompt: 'What status code means "Not Found"?', options: ['200', '301', '500', '404'], correct: 3 },
        { prompt: 'Where does CSS usually belong for best performance?', options: ['Inline on every element', 'An external stylesheet', 'Inside a script tag', 'In the URL'], correct: 1 },
      ],
    },
  },
  {
    owner: 'instructor.a@lms.test',
    title: 'JavaScript in Practice',
    level: 'intermediate',
    description: 'Closures, async/await and the event loop, taught through problems rather than definitions.',
    coverImageUrl: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800',
    lessons: [
      lesson('Values, references and mutation', 1),
      lesson('Closures without the mystery', 2),
      lesson('The event loop', 3),
      lesson('async / await in anger', 4),
      lesson('Error handling that helps', 5),
    ],
    quiz: {
      title: 'JavaScript Checkpoint',
      passingScore: 60,
      questions: [
        { prompt: 'What does `typeof null` return?', options: ['"null"', '"object"', '"undefined"', '"boolean"'], correct: 1 },
        { prompt: 'Which runs first?', options: ['setTimeout callback', 'Promise .then callback', 'They always tie', 'Depends on the browser'], correct: 1 },
        { prompt: 'What does `await` do inside an async function?', options: ['Blocks the whole thread', 'Pauses that function until the promise settles', 'Converts a promise to a callback', 'Nothing at runtime'], correct: 1 },
        { prompt: 'Which creates a new array rather than mutating?', options: ['push', 'splice', 'map', 'sort'], correct: 2 },
        { prompt: 'What is a closure?', options: ['A function that closes a file', 'A function retaining access to its defining scope', 'A way to end a loop', 'A private class field'], correct: 1 },
      ],
    },
  },
  {
    owner: 'instructor.b@lms.test',
    title: 'Designing REST APIs',
    level: 'intermediate',
    description: 'Resources, status codes, versioning and the authorisation mistakes that keep recurring.',
    coverImageUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
    lessons: [
      lesson('Thinking in resources', 1),
      lesson('Status codes that mean something', 2),
      lesson('Authentication vs authorisation', 3),
      lesson('Pagination and filtering', 4),
    ],
    quiz: {
      title: 'API Design Check',
      passingScore: 60,
      questions: [
        { prompt: 'Which status code fits "authenticated but not allowed"?', options: ['401', '403', '404', '400'], correct: 1 },
        { prompt: 'Which method should be idempotent?', options: ['POST', 'PUT', 'PATCH only', 'None of them'], correct: 1 },
        { prompt: 'Where should authorisation be enforced?', options: ['In the UI', 'On the server', 'In the database only', 'In the client router'], correct: 1 },
        { prompt: 'What does 201 signal?', options: ['Accepted for later', 'Created', 'No content', 'Moved'], correct: 1 },
      ],
    },
  },
  {
    owner: 'instructor.b@lms.test',
    title: 'Databases for Application Developers',
    level: 'advanced',
    description: 'Schema design, indexes, transactions and how to read a query plan.',
    coverImageUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
    lessons: [
      lesson('Modelling relationships', 1),
      lesson('Indexes and when they help', 2),
      lesson('Transactions and isolation', 3),
      lesson('Reading a query plan', 4),
      lesson('Migrations without downtime', 5),
    ],
    quiz: {
      title: 'Database Checkpoint',
      passingScore: 70,
      questions: [
        { prompt: 'What does an index primarily trade away?', options: ['Read speed', 'Write speed and storage', 'Correctness', 'Nothing'], correct: 1 },
        { prompt: 'What does ACID’s "D" stand for?', options: ['Distributed', 'Deferred', 'Durability', 'Determinism'], correct: 2 },
        { prompt: 'A foreign key enforces what?', options: ['Uniqueness', 'Referential integrity', 'Sort order', 'Encryption'], correct: 1 },
        { prompt: 'Which is usually the cheapest fix for a slow query?', options: ['Add a suitable index', 'Buy a bigger server', 'Denormalise everything', 'Cache in the client'], correct: 0 },
      ],
    },
  },
];

const POSTS = [
  {
    title: 'How we think about course design',
    excerpt: 'Short lessons, one idea each, and a quiz that actually checks understanding.',
    published: true,
    body:
      'Good courses are not long courses. Each lesson here covers one idea, takes under ten minutes, ' +
      'and ends with something you can do.\n\nProgress is tracked per lesson, so you always know where ' +
      'you stopped — and the quiz at the end is graded on the server, not in your browser.',
  },
  {
    title: 'Why progress tracking matters more than video quality',
    excerpt: 'Learners drop off when they lose their place, not when the production values dip.',
    published: true,
    body:
      'The single biggest predictor of course completion is whether a learner can find their way back ' +
      'to where they stopped.\n\nThat is why every course here shows a percentage, every lesson has an ' +
      'explicit complete action, and that state is stored per student rather than in the browser.',
  },
  {
    title: 'Upcoming: instructor analytics',
    excerpt: 'A draft post, used to demonstrate that drafts are never visible to the public.',
    published: false,
    body:
      'This post is intentionally left in draft state. It should never appear on the public blog, ' +
      'and requesting it by slug while logged out should return a 404.',
  },
];

export async function seedDemoData(strapi: Core.Strapi): Promise<void> {
  let createdSomething = false;

  // ---- users ----------------------------------------------------------
  const userService = strapi.plugin('users-permissions').service('user');
  const byEmail = new Map<string, { id: number }>();

  for (const u of USERS) {
    const found = await strapi
      .query('plugin::users-permissions.user')
      .findOne({ where: { email: u.email } });

    const role = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: u.role } });

    if (found) {
      // Demo mode promises deterministic walkthrough credentials. Reconcile
      // existing rows too, so databases created by an older seed can log in
      // without requiring a reset from the admin panel.
      const updated = await userService.edit(found.id, {
        username: u.username,
        email: u.email,
        password: PASSWORD,
        confirmed: true,
        blocked: false,
        provider: 'local',
        role: role?.id,
      });
      byEmail.set(u.email, updated);
      continue;
    }

    const created = await userService.add({
      username: u.username,
      email: u.email,
      password: PASSWORD,          // hashed by the service
      confirmed: true,
      blocked: false,
      provider: 'local',
      role: role?.id,
    });
    byEmail.set(u.email, created);
    createdSomething = true;
    strapi.log.info(`[seed] created user ${u.email} (${u.role})`);
  }

  // ---- courses, lessons, quizzes ---------------------------------------
  const courseIds: Array<{ documentId: string; lessons: string[] }> = [];

  for (const c of COURSES) {
    const slug = slugify(c.title);
    const [found] = await strapi.documents('api::course.course').findMany({
      filters: { slug }, fields: ['documentId'], limit: 1,
    });
    if (found) {
      // Seed data is reconciled, not merely detected. This repairs databases
      // created by older schemas where publication flags or owners drifted.
      const instructor = byEmail.get(c.owner);
      await strapi.documents('api::course.course').update({
        documentId: found.documentId,
        data: {
          title: c.title,
          description: c.description,
          coverImageUrl: c.coverImageUrl,
          level: c.level as 'beginner' | 'intermediate' | 'advanced',
          price: 0,
          discountPercent: 0,
          isPublished: true,
          instructor: instructor?.id,
        },
      });
      const existingLessons = await strapi.documents('api::lesson.lesson').findMany({
        filters: { course: { documentId: found.documentId } },
        fields: ['documentId'], sort: 'order:asc', limit: -1,
      });
      courseIds.push({ documentId: found.documentId, lessons: existingLessons.map((l) => l.documentId) });
      continue;
    }

    createdSomething = true;
    const instructor = byEmail.get(c.owner);
    const course = await strapi.documents('api::course.course').create({
      data: {
        title: c.title,
        slug,
        description: c.description,
        coverImageUrl: c.coverImageUrl,
        level: c.level as 'beginner' | 'intermediate' | 'advanced',
        price: 0,
        discountPercent: 0,
        isPublished: true,
        instructor: instructor?.id,
      },
    });

    const lessonIds: string[] = [];
    for (const l of c.lessons) {
      const created = await strapi.documents('api::lesson.lesson').create({
        data: { ...l, course: course.documentId },
      });
      lessonIds.push(created.documentId);
    }
    courseIds.push({ documentId: course.documentId, lessons: lessonIds });

    const quiz = await strapi.documents('api::quiz.quiz').create({
      data: {
        title: c.quiz.title,
        description: `Check your understanding of ${c.title}.`,
        passingScore: c.quiz.passingScore,
        course: course.documentId,
      },
    });

    for (const [i, q] of c.quiz.questions.entries()) {
      const options = q.options.map((text, idx) => ({ id: `opt-${idx + 1}`, text }));
      await strapi.documents('api::question.question').create({
        data: {
          prompt: q.prompt,
          options,
          correctOptionId: options[q.correct].id,
          order: i + 1,
          quiz: quiz.documentId,
        },
      });
    }
  }
  strapi.log.info('[seed] courses, lessons and quizzes reconciled');

  // ---- enrollments and partial progress --------------------------------
  // Sara is part-way through two courses, so progress bars are not all at 0%.
  const sara = byEmail.get('student1@lms.test');
  const sam = byEmail.get('student2@lms.test');

  const enrol = async (studentId: number, course: { documentId: string; lessons: string[] }, completed: number) => {
    const [already] = await strapi.documents('api::enrollment.enrollment').findMany({
      filters: { student: { id: studentId }, course: { documentId: course.documentId } },
      fields: ['documentId'], limit: 1,
    });
    if (already) return;

    await strapi.documents('api::enrollment.enrollment').create({
      data: { student: studentId, course: course.documentId, enrolledAt: new Date(), status: 'active' },
    });
    for (const lessonId of course.lessons.slice(0, completed)) {
      await strapi.documents('api::lesson-progress.lesson-progress').create({
        data: {
          student: studentId,
          lesson: lessonId,
          course: course.documentId,
          completedAt: new Date(),
        },
      });
    }
  };

  if (sara) {
    await enrol(sara.id, courseIds[0], 3);  // 3 of 4  = 75%
    await enrol(sara.id, courseIds[1], 1);  // 1 of 5  = 20%
  }
  if (sam) {
    await enrol(sam.id, courseIds[0], 4);   // 4 of 4  = 100%
    await enrol(sam.id, courseIds[2], 0);   // 0 of 4  = 0%
  }


  // ---- blog ------------------------------------------------------------
  const author = byEmail.get('cm@lms.test');
  for (const p of POSTS) {
    const slug = slugify(p.title);
    const [found] = await strapi.documents('api::post.post').findMany({
      filters: { slug }, status: 'draft', fields: ['documentId'], limit: 1,
    });
    if (found) continue;

    createdSomething = true;
    await strapi.documents('api::post.post').create({
      data: {
        title: p.title,
        slug,
        excerpt: p.excerpt,
        body: p.body,
        author: author?.id,
      },
      status: p.published ? 'published' : 'draft',
    });
  }
  strapi.log.info(
    createdSomething
      ? `[seed] demo data reconciled (login password: ${PASSWORD})`
      : '[seed] demo data already present — nothing to do'
  );
}
