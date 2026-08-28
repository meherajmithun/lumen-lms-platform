import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-5 py-10 sm:px-8">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mx-auto mb-8 flex w-fit flex-col items-center text-center"
          aria-label="Lumen home"
        >
          <span className="flex size-12 items-center justify-center rounded-2xl bg-pine text-primary-foreground shadow-[var(--shadow-raised)]">
            <GraduationCap className="size-6" aria-hidden />
          </span>
          <span className="mt-3 font-heading text-xl font-bold tracking-[-0.035em]">Lumen</span>
          <span className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            A Learning Line Academy
          </span>
        </Link>

        <div className="w-full rounded-3xl border border-border/80 bg-card p-6 shadow-[var(--shadow-float)] sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
