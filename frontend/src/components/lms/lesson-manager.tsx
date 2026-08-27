'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from './empty-state';
import { deleteLessonAction, reorderLessonsAction, saveLessonAction } from '@/app/actions/content';
import type { Lesson } from '@/types/lms';

export function LessonManager({ courseId, lessons }: { courseId: string; lessons: Lesson[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Lesson | null>(null);
  const [contentType, setContentType] = useState<'text' | 'video'>('text');

  const ordered = lessons.slice().sort((a, b) => a.order - b.order);

  function openCreate() {
    setContentType('text');
    setEditing(null);
    setCreating(true);
  }

  function openEdit(lesson: Lesson) {
    setContentType(lesson.contentType);
    setCreating(false);
    setEditing(lesson);
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const lessonId = editing?.documentId ?? null;
    start(async () => {
      const result = await saveLessonAction(courseId, lessonId, form);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(lessonId ? 'Lesson updated' : 'Lesson added');
      setEditing(null);
      setCreating(false);
      router.refresh();
    });
  }

  /** Swaps this lesson's order with its neighbour's, writing both. */
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const a = ordered[index];
    const b = ordered[target];
    start(async () => {
      const result = await reorderLessonsAction(courseId, [
        { documentId: a.documentId, order: b.order },
        { documentId: b.documentId, order: a.order },
      ]);
      if (!result.ok) toast.error(result.error);
      else router.refresh();
    });
  }

  const open = creating || editing !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground tabular">
          {ordered.length} {ordered.length === 1 ? 'lesson' : 'lessons'} · students work through them in this order
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" aria-hidden />
          Add lesson
        </Button>
      </div>

      {ordered.length === 0 ? (
        <EmptyState
          title="No lessons yet"
          description="Add the first lesson — it can be written text or a video link."
          action={<Button onClick={openCreate}>Add the first lesson</Button>}
        />
      ) : (
        <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {ordered.map((lesson, index) => (
            <li key={lesson.documentId} className="flex items-center gap-3 px-3 py-3">
              <div className="flex shrink-0 flex-col">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === 0 || pending}
                  onClick={() => move(index, -1)}
                  aria-label={`Move ${lesson.title} earlier`}
                >
                  <ChevronUp className="size-3" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === ordered.length - 1 || pending}
                  onClick={() => move(index, 1)}
                  aria-label={`Move ${lesson.title} later`}
                >
                  <ChevronDown className="size-3" aria-hidden />
                </Button>
              </div>

              <span className="w-5 shrink-0 text-xs text-muted-foreground tabular">{index + 1}</span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{lesson.title}</span>
                <span className="text-xs text-muted-foreground">
                  {lesson.contentType === 'video' ? 'Video' : 'Reading'}
                  {lesson.durationMinutes ? ` · ${lesson.durationMinutes} min` : ''}
                </span>
              </span>

              <Button variant="ghost" size="icon-sm" onClick={() => openEdit(lesson)} aria-label={`Edit ${lesson.title}`}>
                <Pencil className="size-3.5" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeleting(lesson)}
                aria-label={`Delete ${lesson.title}`}
              >
                <Trash2 className="size-3.5 text-destructive" aria-hidden />
              </Button>
            </li>
          ))}
        </ol>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            setEditing(null);
            setCreating(false);
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit lesson' : 'Add a lesson'}</DialogTitle>
            <DialogDescription>
              A lesson is either something to read or a video to watch.
            </DialogDescription>
          </DialogHeader>

          <form
            key={editing?.documentId ?? 'new-lesson'}
            onSubmit={save}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Title</Label>
              <Input id="lesson-title" name="title" defaultValue={editing?.title} required maxLength={160} />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Content</legend>
              <div className="flex gap-2">
                {(['text', 'video'] as const).map((value) => (
                  <label
                    key={value}
                    className={
                      contentType === value
                        ? 'flex-1 cursor-pointer rounded-lg border border-pine bg-pine-wash px-3 py-2 text-center text-sm font-medium'
                        : 'flex-1 cursor-pointer rounded-lg border border-border px-3 py-2 text-center text-sm hover:bg-muted/60'
                    }
                  >
                    <input
                      type="radio"
                      name="contentType"
                      value={value}
                      checked={contentType === value}
                      onChange={() => setContentType(value)}
                      className="sr-only"
                    />
                    {value === 'text' ? 'Reading' : 'Video'}
                  </label>
                ))}
              </div>
            </fieldset>

            {contentType === 'text' ? (
              <div className="space-y-2">
                <Label htmlFor="lesson-body">Lesson text</Label>
                <Textarea
                  id="lesson-body"
                  name="body"
                  rows={8}
                  defaultValue={editing?.body ?? ''}
                  placeholder={'Write the lesson.\n\nBlank lines start a new paragraph, and "## " makes a heading.'}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="lesson-video">Video URL</Label>
                <Input
                  id="lesson-video"
                  name="videoUrl"
                  type="url"
                  defaultValue={editing?.videoUrl ?? ''}
                  placeholder="https://www.youtube.com/watch?v=…"
                />
                <p className="text-xs text-muted-foreground">
                  Paste a YouTube/Vimeo link or a direct MP4, WebM or Ogg URL from Strapi Media Library.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="lesson-order">Position</Label>
                <Input
                  id="lesson-order"
                  name="order"
                  type="number"
                  min={0}
                  defaultValue={editing?.order ?? ordered.length + 1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-duration">Minutes</Label>
                <Input
                  id="lesson-duration"
                  name="durationMinutes"
                  type="number"
                  min={0}
                  max={600}
                  defaultValue={editing?.durationMinutes ?? ''}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {editing ? 'Save lesson' : 'Add lesson'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(next) => !next && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the lesson and every student&apos;s progress record for it. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const lesson = deleting;
                if (!lesson) return;
                start(async () => {
                  const result = await deleteLessonAction(courseId, lesson.documentId);
                  if (!result.ok) toast.error(result.error);
                  else {
                    toast.success('Lesson deleted');
                    router.refresh();
                  }
                  setDeleting(null);
                });
              }}
            >
              Delete lesson
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
