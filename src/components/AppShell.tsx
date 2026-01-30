"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const TAB_ITEMS = [
  { href: "/", label: "메인", icon: "🏠" },
  { href: "/exercise", label: "운동일지", icon: "📋" },
  { href: "/attendance", label: "출석", icon: "✓" },
  { href: "/board", label: "게시판", icon: "💬" },
  { href: "/member", label: "마이", icon: "👤" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isAuth = pathname === "/login" || pathname === "/member/register";
  const hideTabBar = isAdmin || isAuth || pathname.startsWith("/board/") || pathname.startsWith("/notice/") || pathname.startsWith("/gallery/") || pathname.startsWith("/exercise/");

  return (
    <>
      {/* 데스크톱 헤더 */}
      <header className="sticky top-0 z-50 hidden border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur md:block">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold text-[var(--chalk)]">
            베스트클라이밍
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/board"
              className="text-[var(--chalk-muted)] transition hover:text-[var(--rope-light)]"
            >
              게시판
            </Link>
            <Link
              href="/notice"
              className="text-[var(--chalk-muted)] transition hover:text-[var(--rope-light)]"
            >
              공지
            </Link>
            <Link
              href="/attendance"
              className="text-[var(--chalk-muted)] transition hover:text-[var(--rope-light)]"
            >
              출석
            </Link>
            <Link
              href="/gallery"
              className="text-[var(--chalk-muted)] transition hover:text-[var(--rope-light)]"
            >
              사진첩
            </Link>
            <Link
              href="/statistics"
              className="text-[var(--chalk-muted)] transition hover:text-[var(--rope-light)]"
            >
              통계
            </Link>
            <Link
              href="/login"
              className="text-[var(--chalk-muted)] transition hover:text-[var(--rope-light)]"
            >
              로그인
            </Link>
          </nav>
        </div>
      </header>

      {/* 모바일 상단 바 */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 pt-[var(--safe-area-top)] md:hidden">
        <Link href="/" className="text-base font-bold text-[var(--chalk)]">
          베스트클라이밍
        </Link>
        <Link
          href="/login"
          className="rounded-full px-3 py-1.5 text-sm text-[var(--chalk-muted)]"
        >
          로그인
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-8 md:pb-0">
        {children}
      </main>

      {/* 모바일 하단 탭 바 (앱 느낌) */}
      {!hideTabBar && (
        <motion.nav
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur md:hidden tab-bar-height"
          style={{ paddingBottom: "var(--safe-area-bottom)" }}
        >
          <div className="flex h-16 items-center justify-around">
            {TAB_ITEMS.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span
                    className={`text-xs ${active ? "font-semibold text-[var(--rope-light)]" : "text-[var(--chalk-muted)]"}`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
    </>
  );
}
