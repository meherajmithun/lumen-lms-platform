export type DailyLearning = { date: string; activeSeconds: number };

export function utcDate(value = new Date()): string {
  return value.toISOString().slice(0, 10);
}

export function heartbeatIncrement(lastHeartbeatAt: Date, now: Date): number {
  const elapsed = Math.floor((now.getTime() - lastHeartbeatAt.getTime()) / 1000);
  return Math.min(20, Math.max(0, elapsed));
}

export function lessonDurationSeconds(durationMinutes: unknown): number {
  const minutes = Number(durationMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  return Math.round(minutes * 60);
}

export function buildLearningHistory(
  rows: DailyLearning[],
  days: number,
  today = new Date()
) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.date, (totals.get(row.date) ?? 0) + Math.max(0, row.activeSeconds));
  }

  const data: DailyLearning[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(
      today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset
    ));
    const key = utcDate(date);
    data.push({ date: key, activeSeconds: totals.get(key) ?? 0 });
  }

  let current = 0;
  for (let index = data.length - 1; index >= 0 && data[index].activeSeconds > 0; index -= 1) {
    current += 1;
  }
  let longest = 0;
  let run = 0;
  for (const day of data) {
    run = day.activeSeconds > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  return {
    data,
    summary: {
      totalSeconds: data.reduce((sum, day) => sum + day.activeSeconds, 0),
      activeDays: data.filter((day) => day.activeSeconds > 0).length,
      currentStreak: current,
      longestStreak: longest,
    },
  };
}
