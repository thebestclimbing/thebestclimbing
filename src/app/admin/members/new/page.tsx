"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SubmitButton } from "@/components/SubmitButton";
import { getTodayISOKST } from "@/lib/date";
import { addMember } from "../actions";

function getEndDateFromStartPlusMonths(startIso: string, months: number): string {
  const d = new Date(startIso + "T12:00:00");
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getPhoneTail4(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  return digits.slice(-4);
}

export default function AdminMemberNewPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [membershipStart, setMembershipStart] = useState("");
  const [membershipEnd, setMembershipEnd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login?next=/admin/members/new");
        return;
      }
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.role !== "admin") {
            router.replace("/admin/members");
            return;
          }
          setAuthChecked(true);
        });
    });
  }, [router]);

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
    const result = await addMember({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      phone_tail4: tail4,
      membership_start: membershipStart.trim(),
      membership_end: membershipEnd.trim(),
    });
    setLoading(false);
    if (result.ok) {
      router.push("/admin/members");
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  if (!authChecked) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <p className="text-[var(--chalk-muted)]">확인 중...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--chalk)]">
        회원 추가
      </h1>
      <p className="mb-4 text-sm text-[var(--chalk-muted)]">
        이름·전화번호(필수), 이메일·회원권 기간(선택)을 입력하세요. 로그인은 이름 + 전화번호 뒤 4자리로 합니다.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-[var(--chalk-muted)]">
            이름 *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input-base w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--chalk)]"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-[var(--chalk-muted)]">
            이메일 (선택)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--chalk)]"
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-[var(--chalk-muted)]">
            전화번호 *
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012345678"
            required
            className="input-base w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--chalk)]"
          />
          <p className="mt-1 text-xs text-[var(--chalk-muted)]">
            로그인·출석체크 시 전화번호 뒤 4자리가 사용됩니다.
          </p>
        </div>
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--chalk-muted)]">회원권 기간 빠른 설정</span>
            <button
              type="button"
              onClick={() => {
                const start = getTodayISOKST();
                setMembershipStart(start);
                setMembershipEnd(getEndDateFromStartPlusMonths(start, 1));
              }}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--chalk)] hover:bg-[var(--surface-muted)]"
            >
              1개월
            </button>
            <button
              type="button"
              onClick={() => {
                const start = getTodayISOKST();
                setMembershipStart(start);
                setMembershipEnd(getEndDateFromStartPlusMonths(start, 3));
              }}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--chalk)] hover:bg-[var(--surface-muted)]"
            >
              3개월
            </button>
          </div>
          <label htmlFor="membershipStart" className="mb-1 block text-sm font-medium text-[var(--chalk-muted)]">
            회원권 시작일 (선택)
          </label>
          <input
            id="membershipStart"
            type="date"
            value={membershipStart}
            onChange={(e) => setMembershipStart(e.target.value)}
            className="input-base w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--chalk)]"
          />
        </div>
        <div>
          <label htmlFor="membershipEnd" className="mb-1 block text-sm font-medium text-[var(--chalk-muted)]">
            회원권 종료일 (선택)
          </label>
          <input
            id="membershipEnd"
            type="date"
            value={membershipEnd}
            onChange={(e) => setMembershipEnd(e.target.value)}
            className="input-base w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--chalk)]"
          />
        </div>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        <div className="flex gap-2">
          <Link
            href="/admin/members"
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] py-2.5 text-center text-sm font-medium text-[var(--chalk)] transition hover:bg-[var(--surface)]"
          >
            취소
          </Link>
          <SubmitButton loading={loading} loadingLabel="추가 중...">
            회원 추가
          </SubmitButton>
        </div>
      </form>
      <p className="mt-6">
        <Link
          href="/admin/members"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          회원관리 목록
        </Link>
      </p>
    </div>
  );
}
