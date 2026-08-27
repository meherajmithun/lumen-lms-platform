'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { createCourseAction, updateCourseAction } from '@/app/actions/content';
import type { Course, InstructorOption, Role } from '@/types/lms';

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export function CourseForm({
  course,
  role,
  instructors,
}: {
  course?: Course;
  role: Role;
  instructors: InstructorOption[];
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    start(async () => {
      const result = course
        ? await updateCourseAction(course.documentId, form)
        : await createCourseAction(form);
      if (result && !result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(course ? 'Changes saved' : 'Course created');
      router.refresh();
    });
  }

  return (
    <form
      key={course
        ? `${course.documentId}:${course.title}:${course.level}:${course.isPublished}`
        : 'new-course'}
      onSubmit={onSubmit}
      className="max-w-xl space-y-5"
    >
      <div className="space-y-2">
        <Label htmlFor="instructorId">Instructor</Label>
        {role === 'instructor' ? (
          <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
            This course belongs to your instructor account.
          </p>
        ) : (
          <select
            id="instructorId"
            name="instructorId"
            required
            defaultValue={course?.instructor?.id ? String(course.instructor.id) : ''}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <option value="" disabled>Choose an instructor</option>
            {instructors.map((instructor) => (
              <option key={instructor.id} value={String(instructor.id)}>
                {instructor.username} — {instructor.email}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={course?.title} required minLength={3} maxLength={120} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          defaultValue={course?.description ?? ''}
          placeholder="What will someone be able to do after this course?"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="coverImageUrl">Cover image URL</Label>
        <Input
          id="coverImageUrl"
          name="coverImageUrl"
          type="url"
          defaultValue={course?.coverImageUrl ?? ''}
          placeholder="https://…"
        />
        <p className="text-xs text-muted-foreground">Optional. Paste a link to an image.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="level">Level</Label>
        <select
          id="level"
          name="level"
          defaultValue={course?.level ?? 'beginner'}
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border p-3">
        <Switch id="isPublished" name="isPublished" defaultChecked={course?.isPublished ?? false} />
        <Label htmlFor="isPublished" className="cursor-pointer text-sm font-normal">
          <span className="block font-medium">Published</span>
          <span className="text-muted-foreground">
            Students can find and enroll in this course. Unpublished courses stay private to you.
          </span>
        </Label>
      </div>

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {course ? 'Save changes' : 'Create course'}
      </Button>
    </form>
  );
}
