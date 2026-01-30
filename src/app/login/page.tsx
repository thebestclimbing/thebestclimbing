"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProfileRow = { id: string; email: string | null; name: string; phone: string };

function LoginForm() {
  const [name, setName] = useState("");
  const [tail4, setTail4] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectModal, setSelectModal] = useState<ProfileRow[] | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  async function doSignIn(profile: ProfileRow) {
    const supabase = createClient();
    const loginEmail = profile.email || `${(profile.phone || "").replace(/\D/g, "")}@guest.local`;
    const digits = tail4.replace(/\D/g, "").slice(-4);
    // 가입 시 비밀번호가 '00' + 뒷4자리(6자)로 저장되므로 동일하게 사용
    const password = "00" + digits;
    const { error: err } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    if (err) {
      setError(err.message);
      setSelectModal(null);
      setLoading(false);
      return;
    }
    setSelectModal(null);
    router.push(next);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const digits = tail4.replace(/\D/g, "").slice(-4);
    if (digits.length !== 4) {
      setError("전화번호 뒤 4자리를 입력해 주세요.");
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, name, phone")
      .eq("name", name.trim())
      .eq("phone_tail4", digits);

    setLoading(false);

    if (!profiles?.length) {
      setError("일치하는 회원이 없습니다. 이름과 전화번호 뒤 4자리를 확인해 주세요.");
      return;
    }
    if (profiles.length === 1) {
      setLoading(true);
      await doSignIn(profiles[0] as ProfileRow);
      setLoading(false);
      return;
    }
    setSelectModal(profiles as ProfileRow[]);
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">
        로그인
      </h1>
      <p className="mb-4 text-sm text-[var(--chalk-muted)]">
        이름과 전화번호 뒤 4자리로 로그인합니다.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm text-[var(--chalk-muted)]">
            이름
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="홍길동"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-[var(--chalk)] placeholder:text-[var(--chalk-muted)] focus:border-[var(--rope)] focus:outline-none focus:ring-1 focus:ring-[var(--rope)]"
          />
        </div>
        <div>
          <label htmlFor="tail4" className="mb-1 block text-sm text-[var(--chalk-muted)]">
            전화번호 뒤 4자리
          </label>
          <input
            id="tail4"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={tail4}
            onChange={(e) => setTail4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            required
            placeholder="1234"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-[var(--chalk)] placeholder:text-[var(--chalk-muted)] focus:border-[var(--rope)] focus:outline-none focus:ring-1 focus:ring-[var(--rope)]"
          />
        </div>
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[var(--rope)] px-4 py-3 font-medium text-white transition hover:bg-[var(--rope-light)] disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      {/* 회원 선택 모달 (이름+뒷4자리 동일한 회원이 2명 이상일 때) */}
      {selectModal && selectModal.length > 1 && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setSelectModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl bg-[var(--surface-elevated)] p-6 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold text-[var(--chalk)]">
              회원 선택
            </h3>
            <p className="mb-4 text-sm text-[var(--chalk-muted)]">
              동일한 이름·뒷 4자리 회원이 여러 명입니다. 본인을 선택하세요.
            </p>
            <ul className="flex flex-col gap-2">
              {selectModal.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => doSignIn(p)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left text-[var(--chalk)] transition hover:bg-[var(--rope)]/20 active:scale-[0.98]"
                  >
                    <span className="font-medium">{p.name}</span>
                    {p.phone && (
                      <span className="ml-2 text-sm text-[var(--chalk-muted)]">
                        {p.phone}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setSelectModal(null)}
              className="mt-4 w-full rounded-xl border border-[var(--border)] py-2.5 text-sm text-[var(--chalk-muted)]"
            >
              취소
            </button>
          </div>
        </div>
      )}

      <p className="mt-4 text-center text-sm text-[var(--chalk-muted)]">
        계정이 없으신가요?{" "}
        <Link href="/member/register" className="text-[var(--rope-light)] underline">
          회원가입
        </Link>
      </p>
      <p className="mt-2 text-center">
        <Link href="/" className="text-sm text-[var(--chalk-muted)] hover:underline">
          메인으로
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-sm px-4 py-8 text-center text-[var(--chalk-muted)]">로딩 중...</div>}>
      <LoginForm />
    </Suspense>
  );
}
