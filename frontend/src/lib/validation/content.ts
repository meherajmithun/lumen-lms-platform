import { z } from 'zod';

const urlish = z
  .string()
  .trim()
  .url('Enter a full URL, starting with http:// or https://');

export const courseSchema = z.object({
  title: z.string().trim().min(3, 'Use at least 3 characters').max(120),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  coverImageUrl: urlish.optional().or(z.literal('')),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.coerce.number().min(0, 'Price cannot be negative').max(10_000_000, 'Price is too large'),
  isPublished: z.boolean(),
  instructorId: z.string().trim().optional(),
});

/**
 * A lesson is either reading or a video, and the required field follows from
 * that choice. Strapi validates the same pairing in a lifecycle hook, so a direct
 * API call cannot save a video lesson with no video.
 */
export const lessonSchema = z
  .object({
    title: z.string().trim().min(2, 'Use at least 2 characters').max(160),
    contentType: z.enum(['text', 'video']),
    body: z.string().optional().or(z.literal('')),
    videoUrl: z.string().trim().optional().or(z.literal('')),
    order: z.coerce.number().int().min(0),
    durationMinutes: z.coerce.number().int().min(0).max(600).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.contentType === 'text' && !value.body?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['body'], message: 'Reading lessons need some content' });
    }
    if (value.contentType === 'video') {
      const result = urlish.safeParse(value.videoUrl ?? '');
      if (!result.success) {
        ctx.addIssue({ code: 'custom', path: ['videoUrl'], message: 'Video lessons need a valid URL' });
      }
    }
  });

export const questionSchema = z.object({
  prompt: z.string().trim().min(3, 'Write the question'),
  options: z.array(z.string().trim().min(1, 'Options cannot be blank')).min(2, 'Add at least two options'),
  correctIndex: z.coerce.number().int().min(0),
  order: z.coerce.number().int().min(0),
});

export const quizSchema = z.object({
  title: z.string().trim().min(2, 'Give the quiz a title').max(160),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  passingScore: z.coerce.number().int().min(0).max(100),
});

export const postSchema = z.object({
  title: z.string().trim().min(3, 'Use at least 3 characters').max(160),
  excerpt: z.string().trim().max(300).optional().or(z.literal('')),
  body: z.string().trim().min(1, 'Write the post'),
  coverImageUrl: urlish.optional().or(z.literal('')),
});

export type CourseInput = z.infer<typeof courseSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type PostInput = z.infer<typeof postSchema>;
