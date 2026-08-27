'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { createQuizAction, deleteQuestionAction, saveQuestionAction } from '@/app/actions/content';
import type { Question, Quiz } from '@/types/lms';

/** Creating the quiz itself, when a course has none. */
function QuizSetup({ courseId }: { courseId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <EmptyState
      title="No quiz on this course yet"
      description="Add one, then write the questions."
      action={
        <form
          className="w-full max-w-sm space-y-3 text-left"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            start(async () => {
              const result = await createQuizAction(courseId, form);
              if (!result.ok) toast.error(result.error);
              else {
                toast.success('Quiz created');
                router.refresh();
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="quiz-title">Quiz title</Label>
            <Input id="quiz-title" name="title" required defaultValue="End of course check" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quiz-pass">Pass mark (%)</Label>
            <Input id="quiz-pass" name="passingScore" type="number" min={0} max={100} defaultValue={60} />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Create quiz
          </Button>
        </form>
      }
    />
  );
}

export function QuizManager({
  courseId,
  quiz,
}: {
  courseId: string;
  quiz: Quiz | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<Question | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Question | null>(null);
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctIndex, setCorrectIndex] = useState(0);

  if (!quiz) return <QuizSetup courseId={courseId} />;

  const questions = (quiz.questions ?? []).slice().sort((a, b) => a.order - b.order);

  function openCreate() {
    setOptions(['', '', '', '']);
    setCorrectIndex(0);
    setEditing(null);
    setCreating(true);
  }

  function openEdit(question: Question) {
    setOptions(question.options.map((o) => o.text));
    setCorrectIndex(Math.max(0, question.options.findIndex((o) => o.id === question.correctOptionId)));
    setCreating(false);
    setEditing(question);
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const questionId = editing?.documentId ?? null;
    start(async () => {
      const result = await saveQuestionAction(courseId, quiz!.documentId, questionId, form);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(questionId ? 'Question updated' : 'Question added');
      setEditing(null);
      setCreating(false);
      router.refresh();
    });
  }

  const open = creating || editing !== null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{quiz.title}</p>
          <p className="text-xs text-muted-foreground tabular">
            {questions.length} {questions.length === 1 ? 'question' : 'questions'} · pass mark{' '}
            {quiz.passingScore}%
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" aria-hidden />
          Add question
        </Button>
      </div>

      <div className="rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground">
        Correct answers are stored on the server and are never sent to a student&apos;s browser.
        Grading happens server-side when they submit.
      </div>

      {questions.length === 0 ? (
        <EmptyState title="No questions yet" description="Add the first question to this quiz." />
      ) : (
        <ol className="space-y-3">
          {questions.map((question, index) => (
            <li key={question.documentId} className="rounded-xl border border-border p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xs text-muted-foreground tabular">{index + 1}</span>
                <p className="min-w-0 flex-1 text-sm font-medium">{question.prompt}</p>
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(question)} aria-label="Edit question">
                  <Pencil className="size-3.5" aria-hidden />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(question)} aria-label="Delete question">
                  <Trash2 className="size-3.5 text-destructive" aria-hidden />
                </Button>
              </div>
              <ul className="mt-2.5 space-y-1 pl-7 text-sm">
                {question.options.map((option) => {
                  const correct = option.id === question.correctOptionId;
                  return (
                    <li
                      key={option.id}
                      className={
                        correct
                          ? 'flex items-center gap-2 rounded-md bg-pine-wash px-2.5 py-1 font-medium text-pine'
                          : 'flex items-center gap-2 px-2.5 py-1 text-muted-foreground'
                      }
                    >
                      {correct && <Check className="size-3.5 shrink-0" aria-label="Correct answer" />}
                      {option.text}
                    </li>
                  );
                })}
              </ul>
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
            <DialogTitle>{editing ? 'Edit question' : 'Add a question'}</DialogTitle>
            <DialogDescription>Mark exactly one option as the correct answer.</DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="q-prompt">Question</Label>
              <Textarea id="q-prompt" name="prompt" rows={2} defaultValue={editing?.prompt} required />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Options</legend>
              <p className="text-xs text-muted-foreground">
                Select the radio button next to the correct answer.
              </p>
              <div className="space-y-2">
                {options.map((value, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctIndex"
                      value={index}
                      checked={correctIndex === index}
                      onChange={() => setCorrectIndex(index)}
                      className="size-4 shrink-0 accent-[var(--pine)]"
                      aria-label={`Mark option ${index + 1} correct`}
                    />
                    <Input
                      name="option"
                      value={value}
                      onChange={(event) =>
                        setOptions((prev) =>
                          prev.map((v, i) => (i === index ? event.target.value : v))
                        )
                      }
                      placeholder={`Option ${index + 1}`}
                      required={index < 2}
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setOptions((prev) => prev.filter((_, i) => i !== index));
                          setCorrectIndex((prev) => (prev >= index && prev > 0 ? prev - 1 : prev));
                        }}
                        aria-label={`Remove option ${index + 1}`}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOptions((prev) => [...prev, ''])}
                >
                  <Plus className="size-3.5" aria-hidden />
                  Add option
                </Button>
              )}
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="q-order">Position</Label>
              <Input
                id="q-order"
                name="order"
                type="number"
                min={0}
                defaultValue={editing?.order ?? questions.length + 1}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {editing ? 'Save question' : 'Add question'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(next) => !next && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>
              Past attempts keep their scores, but this question won&apos;t appear in future ones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const question = deleting;
                if (!question) return;
                start(async () => {
                  const result = await deleteQuestionAction(courseId, question.documentId);
                  if (!result.ok) toast.error(result.error);
                  else {
                    toast.success('Question deleted');
                    router.refresh();
                  }
                  setDeleting(null);
                });
              }}
            >
              Delete question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
