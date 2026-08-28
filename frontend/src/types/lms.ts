export const ROLES = {
  ADMIN: 'admin',
  CONTENT_MANAGER: 'content_manager',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  content_manager: 'Content Manager',
  instructor: 'Instructor',
  student: 'Student',
};

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  role: Role;
};

export type UserProfile = SessionUser & {
  bio: string;
  avatarUrl: string;
};

export type StrapiUser = {
  id: number;
  username: string;
  email: string;
  createdAt?: string;
  blocked?: boolean;
  confirmed?: boolean;
  role?: { id: number; type: Role; name: string } | null;
};

export type InstructorOption = {
  id: number;
  documentId?: string;
  username: string;
  email: string;
};
export type InstructorRequest={id:number;username:string;email:string;createdAt?:string};

export type InstructorProfile = {
  id: number;
  username: string;
  bio: string;
  avatarUrl: string;
};

export type Level = 'beginner' | 'intermediate' | 'advanced';

export type Course = {
  documentId: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImageUrl?: string | null;
  level: Level;
  price: number;
  discountPercent: number;
  isPublished: boolean;
  instructor?: { id: number; username: string; avatarUrl?: string | null } | null;
  /** Safe aggregate returned even when lesson content is not readable. */
  lessonCount?: number;
  totalDurationMinutes?: number;
  enrollmentCount?: number;
  lessons?: Lesson[];
  quizzes?: Quiz[];
  enrollments?: Array<{ documentId: string }>;
  createdAt?: string;
};

export type Lesson = {
  documentId: string;
  title: string;
  contentType: 'text' | 'video';
  body?: string | null;
  videoUrl?: string | null;
  order: number;
  durationMinutes?: number | null;
  course?: Course | null;
};

export type SyllabusEntry = {
  documentId: string;
  title: string;
  order: number;
  contentType: 'text' | 'video';
  durationMinutes: number | null;
};

/** What the public course page gets: the outline, without any lesson content. */
export type CourseWithSyllabus = Omit<Course, 'lessons' | 'quizzes'> & {
  quizCount: number;
  syllabus: SyllabusEntry[];
};

export type CourseProgress = {
  completed: number;
  total: number;
  percent: number;
  completedLessonIds: string[];
};

export type DailyLearning = { date: string; activeSeconds: number };
export type LearningHistory = {
  data: DailyLearning[];
  summary: {
    totalSeconds: number;
    activeDays: number;
    currentStreak: number;
    longestStreak: number;
  };
};

export type Enrollment = {
  documentId: string;
  enrolledAt: string;
  status: 'active' | 'completed';
  course: Course | null;
  progress: CourseProgress;
};

export type EnrollmentApplication = {
  documentId: string; name: string; email: string; phone: string; discord?: string; institution?: string;
  paymentMethod: 'bkash' | 'rocket' | 'nagad'; transactionId?: string; paymentProofUrl?: string; totalAmount: number;
  comboDiscount?: number;
  loyaltyDiscount?: number;
  status: 'pending' | 'approved' | 'rejected'; courseSummary: Array<{ title: string; amount: number }>;
  createdAt?: string;
  reviewedAt?: string | null;
};
export type ComboTier = { courseCount: number; discountAmount: number };
export type ComboOffer = { title: string; description: string; tiers: ComboTier[]; loyaltyDiscount: number; isActive: boolean };
export type StudentStory={documentId:string;studentName:string;title:string;body:string;status?:'pending'|'approved'|'rejected';createdAt?:string};

export type QuestionOption = { id: string; text: string };

export type Question = {
  documentId: string;
  prompt: string;
  options: QuestionOption[];
  order: number;
  /** Present only on the owner-facing /quizzes/:id/manage endpoint. */
  correctOptionId?: string;
};

export type Quiz = {
  documentId: string;
  title: string;
  description?: string | null;
  passingScore: number;
  questions?: Question[];
  course?: Course | null;
};

export type GradedAnswer = {
  questionId: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  correct: boolean;
};

export type QuizResult = {
  attemptId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  answers: GradedAnswer[];
};

export type QuizAttempt = {
  documentId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  submittedAt: string;
  quiz?: (Quiz & { course?: Course | null }) | null;
};

export type Post = {
  documentId: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  body: string;
  coverImageUrl?: string | null;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  author?: { id: number; username: string } | null;
};

export type StudentProgressRow = {
  student: { id: number; username: string; email: string };
  enrolledAt: string;
  status: string;
  completed: number;
  total: number;
  percent: number;
};

export type PlatformStats = {
  usersByRole: Partial<Record<Role, number>>;
  totalUsers: number;
  totalCourses: number;
  totalLessons: number;
  totalEnrollments: number;
  totalQuizzes: number;
  totalQuizAttempts: number;
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
};

export type Paginated<T> = {
  data: T[];
  meta?: { pagination?: { page: number; pageSize: number; total: number; pageCount: number } };
};
