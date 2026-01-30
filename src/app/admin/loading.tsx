import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[30vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="md" />
        <span className="text-sm text-[var(--chalk-muted)]">로딩 중...</span>
      </div>
    </div>
  );
}
