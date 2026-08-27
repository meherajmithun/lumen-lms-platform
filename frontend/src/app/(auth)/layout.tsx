import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2 self-start text-sm font-medium">
          <GraduationCap className="size-5 text-pine" aria-hidden />
          <span>Lumen</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
