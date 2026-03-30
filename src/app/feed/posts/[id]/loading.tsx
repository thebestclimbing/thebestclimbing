export default function FeedPostLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 animate-pulse">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[var(--surface-muted)]" />
        <div className="space-y-1.5">
          <div className="h-4 w-24 rounded bg-[var(--surface-muted)]" />
          <div className="h-3 w-16 rounded bg-[var(--surface-muted)]" />
        </div>
      </div>
      <div className="aspect-square rounded-xl bg-[var(--surface-muted)]" />
      <div className="mt-4 h-4 w-2/3 rounded bg-[var(--surface-muted)]" />
      <div className="mt-4 h-9 w-24 rounded-full bg-[var(--surface-muted)]" />
      <div className="mt-6 border-t border-[var(--border)] pt-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-2">
            <div className="h-8 w-8 flex-none rounded-full bg-[var(--surface-muted)]" />
            <div className="h-8 flex-1 rounded bg-[var(--surface-muted)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
