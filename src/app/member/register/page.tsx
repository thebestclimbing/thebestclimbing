"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
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
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        회원가입
      </h1>
      <p className="mb-4 text-sm text-zinc-500">
        이름, 전화번호(필수), 이메일(선택)으로 가입합니다.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            이름 *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            이메일 (선택)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            전화번호 *
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012345678"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <p className="mt-1 text-xs text-zinc-500">출석체크 시 전화번호 뒤 4자리가 사용됩니다.</p>
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            비밀번호 *
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "가입 중..." : "가입하기"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-500">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-zinc-900 underline dark:text-zinc-50">
          로그인
        </Link>
      </p>
      <p className="mt-2 text-center">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          메인으로
        </Link>
      </p>
    </div>
  );
}
