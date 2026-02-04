"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// iPhone / SF Symbols 스타일: outline(비선택) / filled(선택)
const TabIcons = {
  home: {
    outline: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    filled: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 2.5L3 9v12h6v-7h6v7h6V9L12 2.5z" />
      </svg>
    ),
  },
  list: {
    outline: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    filled: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M4 5h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm0 6h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1zm0 6h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z" />
      </svg>
    ),
  },
  check: {
    outline: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    filled: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
  },
  bubble: {
    outline: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    filled: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
      </svg>
    ),
  },
  person: {
    outline: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    filled: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    ),
  },
};

const TAB_ITEMS = [
  { href: "/", label: "메인", icon: "home" as keyof typeof TabIcons },
  { href: "/exercise", label: "운동일지", icon: "list" as keyof typeof TabIcons },
  { href: "/attendance", label: "출석", icon: "check" as keyof typeof TabIcons },
  { href: "/board", label: "게시판", icon: "bubble" as keyof typeof TabIcons },
  { href: "/member", label: "마이", icon: "person" as keyof typeof TabIcons },
] as const;

const ADMIN_LINKS = [
  { href: "/admin/members", label: "회원관리" },
  { href: "/admin/routes", label: "암벽문제" },
  { href: "/admin/attendance", label: "출석관리" },
  { href: "/admin/reservations", label: "예약관리" },
  { href: "/admin/completions", label: "완등관리" },
  { href: "/admin/notices", label: "공지관리" },
  { href: "/admin/board", label: "게시판관리" },
] as const;

const STATS_LINKS = [
  { href: "/statistics", label: "통계 목록" },
  { href: "/statistics/member-routes", label: "회원별 등록 루트" },
  { href: "/statistics/member-completions", label: "회원별 루트 완등" },
  { href: "/statistics/route-holds", label: "루트별 평균 홀드수" },
  { href: "/statistics/route-completions", label: "루트별 완등" },
  { href: "/statistics/month-logs", label: "기간별 등록 (월별)" },
  { href: "/statistics/month-completions", label: "기간별 완등 (월별)" },
] as const;

/** 이름에서 아바타용 이니셜 추출 (최대 2자) */
function getInitials(name: string | null | undefined): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return trimmed.length >= 2 ? trimmed.slice(0, 2) : trimmed;
}

/** 마이 메뉴용 아바타: 이니셜 원형 또는 person 아이콘 */
function MyAvatar({
  name,
  size = "md",
  active,
}: {
  name: string | null | undefined;
  size?: "sm" | "md";
  active?: boolean;
}) {
  const initials = getInitials(name);
  const sizeClass = size === "sm" ? "h-7 w-7 text-xs" : "h-8 w-8 text-sm";
  const baseClass = `inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeClass} ${active ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-muted)] text-[var(--chalk)]"}`;

  if (initials) {
    return <span className={baseClass} aria-hidden>{initials}</span>;
  }
  return (
    <span className={baseClass} aria-hidden>
      {active ? TabIcons.person.filled : TabIcons.person.outline}
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

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
          .select("role, name")
          .eq("id", u.id)
          .single()
          .then(({ data }) => {
            setRole(data?.role ?? null);
            setProfileName(data?.name ?? null);
          });
      } else {
        setRole(null);
        setProfileName(null);
      }
    });
  }, [pathname]);

  const isAdmin = role === "admin";

  const navLinks = (
    <>
      <Link
        href="/"
        className={`text-sm transition hover:text-[var(--primary)] lg:text-base ${pathname === "/" ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
      >
        메인
      </Link>
      <Link
        href="/exercise"
        className={`text-sm transition hover:text-[var(--primary)] lg:text-base ${pathname.startsWith("/exercise") ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
      >
        운동일지
      </Link>
      <Link
        href="/attendance"
        className={`text-sm transition hover:text-[var(--primary)] lg:text-base ${pathname === "/attendance" ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
      >
        출석
      </Link>
      <Link
        href="/reservation"
        className={`text-sm transition hover:text-[var(--primary)] lg:text-base ${pathname === "/reservation" ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
      >
        예약
      </Link>
      <Link
        href="/board"
        className={`text-sm transition hover:text-[var(--primary)] lg:text-base ${pathname.startsWith("/board") ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
      >
        게시판
      </Link>
      <Link
        href="/notice"
        className={`text-sm transition hover:text-[var(--primary)] lg:text-base ${pathname.startsWith("/notice") ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
      >
        공지
      </Link>
      <div className="relative">
        <button
          type="button"
          onClick={() => setStatsOpen((o) => !o)}
          className={`text-sm transition hover:text-[var(--primary)] lg:text-base ${pathname.startsWith("/statistics") ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
        >
          통계 ▾
        </button>
        <AnimatePresence>
          {statsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                aria-hidden
                onClick={() => setStatsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2 shadow-lg"
              >
                {STATS_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setStatsOpen(false)}
                    className={`block px-4 py-2 text-sm ${pathname === item.href ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk)]"} hover:bg-[var(--surface-muted)]`}
                  >
                    {item.label}
                  </Link>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );

  return (
    <>
      {/* 상단 메뉴바 - 데스크톱 (출석체크 PC에서는 숨김) */}
      {pathname !== "/attendance" && (
      <header className="sticky top-0 z-50 hidden border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur md:block">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 lg:max-w-5xl lg:px-6 lg:py-4 xl:max-w-6xl xl:px-8">
          <Link href="/" className="text-lg font-bold text-[var(--chalk)] lg:text-xl xl:text-2xl">
            BestClimb
          </Link>
          <nav className="flex items-center gap-5 lg:gap-6">
            {navLinks}
            {isAdmin && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAdminOpen((o) => !o)}
                  className={`text-sm transition hover:text-[var(--primary)] lg:text-base ${pathname.startsWith("/admin") ? "font-semibold text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
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
                className={`inline-flex items-center transition hover:opacity-80 ${pathname === "/member" ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--surface)] rounded-full" : ""}`}
                aria-label="마이"
              >
                <MyAvatar name={profileName} size="sm" active={pathname === "/member"} />
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm text-[var(--chalk-muted)] transition hover:text-[var(--primary)] lg:text-base"
              >
                로그인
              </Link>
            )}
          </nav>
        </div>
      </header>
      )}

      {/* 상단 메뉴바 - 모바일: 햄버거 + 로고 */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 pt-[var(--safe-area-top)] md:hidden">
        <Link href="/" className="text-base font-bold text-[var(--chalk)]">
          BestClimb
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href="/member"
              className={`inline-flex rounded-full transition hover:opacity-80 ${pathname === "/member" ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--surface)]" : ""}`}
              aria-label="마이"
            >
              <MyAvatar name={profileName} size="sm" active={pathname === "/member"} />
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
                <Link href="/reservation" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-[var(--chalk)] hover:bg-[var(--surface-muted)]">
                  예약
                </Link>
                <Link href="/board" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-[var(--chalk)] hover:bg-[var(--surface-muted)]">
                  게시판
                </Link>
                <Link href="/notice" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-[var(--chalk)] hover:bg-[var(--surface-muted)]">
                  공지
                </Link>
                <div className="my-2 border-t border-[var(--border)]" />
                <span className="px-4 py-2 text-xs font-medium text-[var(--chalk-muted)]">통계</span>
                {STATS_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-2.5 pl-6 text-sm text-[var(--chalk)] hover:bg-[var(--surface-muted)]"
                  >
                    {item.label}
                  </Link>
                ))}
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
                {user && (
                  <>
                    <div className="my-2 border-t border-[var(--border)]" />
                    <button
                      type="button"
                      onClick={async () => {
                        setMenuOpen(false);
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        router.push("/");
                        router.refresh();
                      }}
                      className="w-full rounded-xl px-4 py-2.5 pl-6 text-left text-sm text-[var(--chalk-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--chalk)]"
                    >
                      로그아웃
                    </button>
                  </>
                )}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-4xl px-4 pb-8 md:pb-0 lg:max-w-5xl lg:px-6 lg:pb-10 xl:max-w-6xl xl:px-8 xl:pb-12">
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
              const isMyTab = item.href === "/member";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition ${active ? "text-[var(--primary)]" : "text-[var(--chalk-muted)]"}`}
                >
                  <span className="flex items-center justify-center">
                    {isMyTab ? (
                      <MyAvatar name={profileName} size="md" active={active} />
                    ) : (
                      active ? TabIcons[item.icon].filled : TabIcons[item.icon].outline
                    )}
                  </span>
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
