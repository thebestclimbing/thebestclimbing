"use client";

import { useState } from "react";

const ACCOUNT_TEXT = "카카오뱅크 3333-07-2364579 정호영";

export function AccountCopyBlock({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(ACCOUNT_TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[var(--chalk-muted)]">
          {ACCOUNT_TEXT}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          title={copied ? "복사됨" : "계좌번호 복사"}
          aria-label={copied ? "복사됨" : "계좌번호 복사"}
          className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--chalk)] transition hover:bg-[var(--surface-muted)] active:scale-[0.98]"
        >
          {copied ? (
            <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
