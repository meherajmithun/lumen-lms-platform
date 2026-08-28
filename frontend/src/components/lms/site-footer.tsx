export function SiteFooter() {
  return (
    <footer className="border-t border-border/80 bg-muted/25">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:py-12">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="h-px w-8 bg-pine" aria-hidden />
          <p className="leading-6">Lumen — a learning platform built around sequence and progress.</p>
        </div>
      </div>
    </footer>
  );
}
