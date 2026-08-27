export type ProgressResult = {
  completed: number;
  total: number;
  percent: number;
  completedLessonIds: string[];
};

/** Counts only unique completion rows for lessons that still belong to the course. */
export function calculateProgress(
  courseLessonIds: string[],
  completedLessonIdsInput: Array<string | null | undefined>
): ProgressResult {
  const validLessons = new Set(courseLessonIds);
  const completedLessonIds = [...new Set(completedLessonIdsInput.filter(
    (id): id is string => typeof id === 'string' && validLessons.has(id)
  ))];
  const total = validLessons.size;
  const completed = completedLessonIds.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { completed, total, percent, completedLessonIds };
}
