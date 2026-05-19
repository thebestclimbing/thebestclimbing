"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <div className="card max-w-sm rounded-2xl p-8 text-center">
        <p className="mb-2 text-4xl">⚠️</p>
        <h1 className="mb-2 text-lg font-semibold text-[var(--chalk)]">
          일시적인 오류가 발생했습니다
        </h1>
        <p className="mb-6 text-sm text-[var(--chalk-muted)]">
          인앱 브라우저에서는 일부 기능이 제한될 수 있습니다. 아래 버튼으로 다시 시도하거나, 브라우저에서 직접 열어보세요.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="btn-primary w-full"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="mt-3 block text-sm text-[var(--chalk-muted)] underline"
        >
          메인으로
        </Link>
      </div>
    </div>
  );
}
