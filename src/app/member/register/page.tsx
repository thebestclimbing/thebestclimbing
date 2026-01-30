"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function getPhoneTail4(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, "");
    return digits.slice(-4);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const tail4 = getPhoneTail4(phone);
    if (tail4.length !== 4) {
      setError("전화번호 뒤 4자리를 입력해 주세요.");
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const signUpEmail = email.trim() || `${phone.replace(/\D/g, "")}@guest.local`;
    // Supabase는 비밀번호 최소 6자 요구 → 앞에 '00' 붙여 6자로 설정. 로그인 시에도 동일 규칙 사용.
    const password = "00" + tail4;
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: signUpEmail,
      password,
      options: { data: { name, phone, phone_tail4: tail4 } },
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    if (!authData.user) {
      setError("가입 처리 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }
    // profiles 행은 DB 트리거(004_profiles_trigger_on_signup.sql)가 자동 생성
    setLoading(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">
        회원가입
      </h1>
      <p className="mb-4 text-sm text-[var(--chalk-muted)]">
        이름, 전화번호(필수), 이메일(선택)으로 가입합니다. 로그인은 이름 + 전화번호 뒤 4자리로 합니다.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm text-[var(--chalk-muted)]">
            이름 *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-[var(--chalk)] focus:border-[var(--rope)] focus:outline-none focus:ring-1 focus:ring-[var(--rope)]"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-[var(--chalk-muted)]">
            이메일 (선택)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-[var(--chalk)] focus:border-[var(--rope)] focus:outline-none focus:ring-1 focus:ring-[var(--rope)]"
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm text-[var(--chalk-muted)]">
            전화번호 *
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012345678"
            required
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-[var(--chalk)] focus:border-[var(--rope)] focus:outline-none focus:ring-1 focus:ring-[var(--rope)]"
          />
          <p className="mt-1 text-xs text-[var(--chalk-muted)]">로그인·출석체크 시 전화번호 뒤 4자리가 사용됩니다.</p>
        </div>
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[var(--rope)] px-4 py-3 font-medium text-white transition hover:bg-[var(--rope-light)] disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? "가입 중..." : "가입하기"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-[var(--chalk-muted)]">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-[var(--rope-light)] underline">
          로그인
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
