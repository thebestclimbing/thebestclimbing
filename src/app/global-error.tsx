"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, background: "#f8fafc", color: "#0f172a", fontFamily: "system-ui, sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 360, textAlign: "center" }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>⚠️</p>
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>일시적인 오류가 발생했습니다</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>
            인앱 브라우저에서는 일부 기능이 제한될 수 있습니다. 다시 시도하거나 브라우저에서 직접 열어보세요.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              width: "100%",
              padding: "14px 20px",
              borderRadius: 12,
              background: "#22c55e",
              color: "#fff",
              border: "none",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" style={{ display: "block", marginTop: 12, fontSize: 14, color: "#64748b" }}>
            메인으로
          </a>
        </div>
      </body>
    </html>
  );
}
