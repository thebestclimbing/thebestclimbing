"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const TAB_ITEMS = [
  { href: "/", label: "메인", icon: "🏠" },
  { href: "/exercise", label: "운동일지", icon: "📋" },
  { href: "/attendance", label: "출석", icon: "✓" },
  { href: "/board", label: "게시판", icon: "💬" },
  { href: "/member", label: "마이", icon: "👤" },
] as const;

const ADMIN_LINKS = [
  { href: "/admin/members", label: "회원관리" },
  { href: "/admin/routes", label: "암벽문제" },
  { href: "/admin/attendance", label: "출석관리" },
  { href: "/admin/reservations", label: "예약관리" },
  { href: "/admin/completions", label: "완등관리" },
  { href: "/admin/notices", label: "공지관리" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const isAuthPage = pathname === "/login" || pathname === "/member/register";
  const hideTabBar =
    pathname.startsWith("/admin") ||
    isAuthPage ||
    pathname.startsWith("/board/") ||
    pathname.startsWith("/notice/") ||
    pathname.startsWith("/gallery/") ||
    pathname.startsWith("/exercise/");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ?? null);
      if (u) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", u.id)
          .single()
          .then(({ data }) => setRole(data?.role ?? null));
      } else {
        setRole(null);
      }
    });
  }, [pathname]);

  const isAdmin = role === "admin";

  const navLinks = (
    <>
      <Link
        href="/"
        className={`text-sm transition hover:text-[var(--primary)] ${pathname === "/" ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
      >
        메인
      </Link>
      <Link
        href="/exercise"
        className={`text-sm transition hover:text-[var(--primary)] ${pathname.startsWith("/exercise") ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
      >
        운동일지
      </Link>
      <Link
        href="/attendance"
        className={`text-sm transition hover:text-[var(--primary)] ${pathname === "/attendance" ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
      >
        출석
      </Link>
      <Link
        href="/board"
        className={`text-sm transition hover:text-[var(--primary)] ${pathname.startsWith("/board") ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
      >
        게시판
      </Link>
      <Link
        href="/notice"
        className={`text-sm transition hover:text-[var(--primary)] ${pathname.startsWith("/notice") ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
      >
        공지
      </Link>
      <Link
        href="/gallery"
        className={`text-sm transition hover:text-[var(--primary)] ${pathname.startsWith("/gallery") ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
      >
        사진첩
      </Link>
      <Link
        href="/statistics"
        className={`text-sm transition hover:text-[var(--primary)] ${pathname === "/statistics" ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
      >
        통계
      </Link>
    </>
  );

  return (
    <>
      {/* 상단 메뉴바 - 데스크톱 */}
      <header className="sticky top-0 z-50 hidden border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur md:block">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold text-[var(--chalk)]">
            베스트클라이밍
          </Link>
          <nav className="flex items-center gap-5">
            {navLinks}
            {isAdmin && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAdminOpen((o) => !o)}
                  className={`text-sm transition hover:text-[var(--primary)] ${pathname.startsWith("/admin") ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
                >
                  관리자 ▾
                </button>
                <AnimatePresence>
                  {adminOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        aria-hidden
                        onClick={() => setAdminOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2 shadow-lg"
                      >
                        {ADMIN_LINKS.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setAdminOpen(false)}
                            className="block px-4 py-2 text-sm text-[var(--chalk)] hover:bg-[var(--surface-muted)]"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
            {user ? (
              <Link
                href="/member"
                className={`text-sm transition hover:text-[var(--primary)] ${pathname === "/member" ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
              >
                마이
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm text-[var(--chalk-muted)] transition hover:text-[var(--primary)]"
              >
                로그인
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* 상단 메뉴바 - 모바일: 햄버거 + 로고 */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 pt-[var(--safe-area-top)] md:hidden">
        <Link href="/" className="text-base font-bold text-[var(--chalk)]">
          베스트클라이밍
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href="/member"
              className="rounded-full bg-[var(--surface-muted)] px-4 py-2 text-sm font-medium text-[var(--chalk)]"
            >
              마이
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[var(--surface-muted)] px-4 py-2 text-sm font-medium text-[var(--chalk)]"
            >
              로그인
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-full p-2 text-[var(--chalk-muted)] hover:bg-[var(--surface-muted)]"
            aria-label="메뉴 열기"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* 모바일 전체 메뉴 드로어 */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/50 md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween" }}
              className="fixed right-0 top-0 z-[70] flex h-full w-72 max-w-[85vw] flex-col border-l border-[var(--border)] bg-[var(--surface)] pt-[var(--safe-area-top)] md:hidden"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <span className="font-semibold text-[var(--chalk)]">메뉴</span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full p-2 text-[var(--chalk-muted)] hover:bg-[var(--surface-muted)]"
                  aria-label="닫기"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex flex-col gap-1 overflow-y-auto p-4">
                <Link href="/" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-[var(--chalk)] hover:bg-[var(--surface-muted)]">
                  메인
                </Link>
                <Link href="/exercise" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-[var(--chalk)] hover:bg-[var(--surface-muted)]">
                  운동일지
                </Link>
                <Link href="/attendance" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-[var(--chalk)] hover:bg-[var(--surface-muted)]">
                  출석
                </Link>
                <Link href="/board" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-[var(--chalk)] hover:bg-[var(--surface-muted)]">
                  게시판
                </Link>
                <Link href="/notice" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-[var(--chalk)] hover:bg-[var(--surface-muted)]">
                  공지
                </Link>
                <Link href="/gallery" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-[var(--chalk)] hover:bg-[var(--surface-muted)]">
                  사진첩
                </Link>
                <Link href="/statistics" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-[var(--chalk)] hover:bg-[var(--surface-muted)]">
                  통계
                </Link>
                {isAdmin && (
                  <>
                    <div className="my-2 border-t border-[var(--border)]" />
                    <span className="px-4 py-2 text-xs font-medium text-[var(--chalk-muted)]">관리자</span>
                    {ADMIN_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="rounded-xl px-4 py-2.5 pl-6 text-sm text-[var(--chalk)] hover:bg-[var(--surface-muted)]"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </>
                )}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-4xl px-4 pb-8 md:pb-0">
        {children}
      </main>

      {/* 모바일 하단 탭 바 */}
      {!hideTabBar && (
        <motion.nav
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface)] md:hidden tab-bar-height"
          style={{ paddingBottom: "var(--safe-area-bottom)" }}
        >
          <div className="flex h-16 items-center justify-around">
            {TAB_ITEMS.map((item) => {
              const active =
                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition ${active ? "text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className={`text-xs ${active ? "font-semibold" : ""}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
    </>
  );
}
