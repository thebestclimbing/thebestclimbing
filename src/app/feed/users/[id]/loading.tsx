export default function FeedUserLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 animate-pulse">
      <div className="mb-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-[var(--surface-muted)]" />
        <div className="space-y-2">
          <div className="h-5 w-24 rounded bg-[var(--surface-muted)]" />
          <div className="h-3 w-16 rounded bg-[var(--surface-muted)]" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-0.5">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="aspect-square bg-[var(--surface-muted)]" />
        ))}
      </div>
    </div>
  );
}
