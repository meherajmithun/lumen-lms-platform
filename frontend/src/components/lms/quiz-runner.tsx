'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { submitQuizAction } from '@/app/actions/quiz';
import { cn } from '@/lib/utils';
import type { Quiz, QuizResult } from '@/types/lms';

export function QuizRunner({ quiz, slug }: { quiz: Quiz; slug: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const questions = quiz.questions ?? [];
  const answered = Object.keys(answers).length;
  const unanswered = questions.length - answered;

  function send() {
    start(async () => {
      const payload = questions.map((q) => ({
        questionId: q.documentId,
        selectedOptionId: answers[q.documentId] ?? null,
      }));
      const response = await submitQuizAction(quiz.documentId, payload);
      if (!response.ok) {
        toast.error(response.error);
        return;
      }
      setResult(response.result);
      router.refresh();
    });
  }

  if (result) {
    const byQuestion = new Map(result.answers.map((a) => [a.questionId, a]));

    return (
      <div className="mx-auto max-w-2xl">
        <div
          className={cn(
            'rounded-xl border p-6 text-center',
            result.passed ? 'border-pine/40 bg-pine-wash' : 'border-clay/40 bg-clay-wash'
          )}
        >
          <p className="font-heading text-5xl font-semibold tracking-tight tabular">
            {result.score}%
          </p>
          <p className="mt-2 text-sm font-medium">
            {result.passed ? 'Passed' : 'Not passed yet'} · {result.correctCount} of{' '}
            {result.totalQuestions} correct
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pass mark is {quiz.passingScore}%. Your result is saved to My results.
          </p>
        </div>

        <ol className="mt-7 space-y-4">
          {questions.map((question, index) => {
            const graded = byQuestion.get(question.documentId);
            const chosen = graded?.selectedOptionId ?? null;
            return (
              <li key={question.documentId} className="rounded-xl border border-border p-4">
                <div className="flex items-start gap-2.5">
                  {graded?.correct ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-pine" aria-label="Correct" />
                  ) : (
                    <X className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="Incorrect" />
                  )}
                  <p className="min-w-0 flex-1 text-sm font-medium">
                    <span className="text-muted-foreground tabular">{index + 1}. </span>
                    {question.prompt}
                  </p>
                </div>
                <ul className="mt-3 space-y-1.5 pl-7 text-sm">
                  {question.options.map((option) => {
                    const isCorrect = option.id === graded?.correctOptionId;
                    const isChosen = option.id === chosen;
                    return (
                      <li
                        key={option.id}
                        className={cn(
                          'rounded-md px-2.5 py-1.5',
                          isCorrect && 'bg-pine-wash font-medium text-pine',
                          isChosen && !isCorrect && 'bg-destructive/10 text-destructive line-through'
                        )}
                      >
                        {option.text}
                        {isChosen && <span className="ml-2 text-xs opacity-70">your answer</span>}
                        {isCorrect && !isChosen && (
                          <span className="ml-2 text-xs opacity-70">correct answer</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {chosen === null && (
                  <p className="mt-2 pl-7 text-xs text-muted-foreground">
                    You left this one blank, so it counted as incorrect.
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-7 flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setResult(null);
              setAnswers({});
            }}
          >
            Retake the quiz
          </Button>
          <Link href={`/learn/${slug}`} className={buttonVariants({ variant: 'outline' })}>
            Back to the course
          </Link>
          <Link href="/results" className={buttonVariants({ variant: 'ghost' })}>
            All my results
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">{quiz.title}</h1>
      {quiz.description && <p className="mt-1.5 text-sm text-muted-foreground">{quiz.description}</p>}
      <p className="mt-1 text-xs text-muted-foreground tabular">
        {questions.length} questions · pass mark {quiz.passingScore}%
      </p>

      <ol className="mt-8 space-y-5">
        {questions.map((question, index) => (
          <li key={question.documentId}>
            <fieldset className="rounded-xl border border-border p-4">
              <legend className="px-1 text-sm font-medium">
                <span className="text-muted-foreground tabular">{index + 1}. </span>
                {question.prompt}
              </legend>
              <div className="mt-3 space-y-1.5">
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                      answers[question.documentId] === option.id
                        ? 'border-pine bg-pine-wash'
                        : 'border-border hover:bg-muted/60'
                    )}
                  >
                    <input
                      type="radio"
                      name={question.documentId}
                      value={option.id}
                      checked={answers[question.documentId] === option.id}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [question.documentId]: option.id }))
                      }
                      className="size-4 accent-[var(--pine)]"
                    />
                    <span>{option.text}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-5 py-3">
          <p className="text-sm text-muted-foreground tabular">
            <span className="font-medium text-foreground">{answered}</span> of {questions.length}{' '}
            answered
          </p>
          <Button
            disabled={pending || questions.length === 0}
            onClick={() => (unanswered > 0 ? setConfirmOpen(true) : send())}
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Submit answers
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Submit with {unanswered} {unanswered === 1 ? 'question' : 'questions'} unanswered?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anything left blank counts as incorrect. You can retake the quiz afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep answering</AlertDialogCancel>
            <AlertDialogAction onClick={send}>Submit anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
