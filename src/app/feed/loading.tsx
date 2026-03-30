export default function FeedLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-8 w-16 rounded-lg bg-[var(--surface-muted)] animate-pulse" />
        <div className="h-9 w-24 rounded-lg bg-[var(--surface-muted)] animate-pulse" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card rounded-2xl overflow-hidden mb-4 animate-pulse">
          <div className="flex items-center gap-3 p-4">
            <div className="h-9 w-9 rounded-full bg-[var(--surface-muted)]" />
            <div className="space-y-1.5">
              <div className="h-3 w-20 rounded bg-[var(--surface-muted)]" />
              <div className="h-3 w-12 rounded bg-[var(--surface-muted)]" />
            </div>
          </div>
          <div className="aspect-square bg-[var(--surface-muted)]" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-3/4 rounded bg-[var(--surface-muted)]" />
            <div className="h-3 w-1/4 rounded bg-[var(--surface-muted)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
