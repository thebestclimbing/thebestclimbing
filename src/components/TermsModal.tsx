"use client";

import { useState } from "react";
import { AccountCopyBlock } from "@/components/AccountCopyBlock";

const TERMS_CONTENT = (
  <>
    <h3 className="mb-2 font-semibold text-[var(--chalk)]">* 베스트클라이밍 센터 이용시간</h3>
    <p className="mb-4 whitespace-pre-wrap text-sm text-[var(--chalk-muted)] leading-relaxed">
      {`주중(월~금) : 오전 11시 ~ 오후 10시
토요일 : 오전 11시 ~ 오후 6시
일요일 및 법정공휴일 : 휴무(체험 사전예약시 별도 예약 필수)
주말 및 공휴일 인공 및 자연암장 별도 공지`}
    </p>
    <h3 className="mb-2 font-semibold text-[var(--chalk)]">* 이용요금 안내</h3>
    <p className="mb-4 whitespace-pre-wrap text-sm text-[var(--chalk-muted)] leading-relaxed">
      {`월 정기회원 : 10만원(카드 및 현금영수증 11만원)
일일체험이용 : 2만원(암벽화 지참시 1만5천원)
암벽화대여료 : 2만원/월 (단, 1개월만 대여가능)`}
    </p>
    <h3 className="mb-2 font-semibold text-[var(--chalk)]">* 기타사항</h3>
    <p className="mb-4 whitespace-pre-wrap text-sm text-[var(--chalk-muted)] leading-relaxed">
      {`가족(직계 2인 이상) : 상기 이용료에서 1만원 할인 적용(단, 3개월 등록시)
개인 암벽화 및 장비는 별도 구매하셔야 하며, 센터에서 구매 또는 대여할 수 있습니다.`}
    </p>
    <h3 className="mb-2 font-semibold text-[var(--chalk)]">* 입금계좌</h3>
    <div className="mb-4 text-sm">
      <AccountCopyBlock />
    </div>
  </>
);

function formatAmount(val: string): string {
  if (!val || val === "-") return val;
  const n = Number(val.replace(/,/g, ""));
  return Number.isNaN(n) ? val : n.toLocaleString();
}

const TABLE_ROWS = [
  { 구분1: "", 구분2: "정상가", "1개월": "110000", "3개월": "330000", 공통적용: "", 비고: "" },
  { 구분1: "", 구분2: "할인가", "1개월": "-", "3개월": "300000", 공통적용: "", 비고: "" },
  { 구분1: "", 구분2: "현금가", "1개월": "100000", "3개월": "270000", 공통적용: "", 비고: "" },
  { 구분1: "", 구분2: "정상가", "1개월": "88000", "3개월": "264000", 공통적용: "", 비고: "" },
  { 구분1: "", 구분2: "할인가", "1개월": "-", "3개월": "250000", 공통적용: "", 비고: "" },
  { 구분1: "", 구분2: "현금가", "1개월": "80000", "3개월": "240000", 공통적용: "", 비고: "" },
];

export function TermsModalButton({
  className,
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-medium text-[var(--chalk)] shadow-sm transition hover:border-[var(--primary)] hover:bg-[var(--primary-muted)] hover:text-[var(--primary)] active:scale-[0.98]"
        }
      >
        <svg className="h-4 w-4 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        이용약관
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-bold text-[var(--chalk)]">이용약관</h2>
            {TERMS_CONTENT}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] border-collapse border border-[var(--border)] text-left text-sm">
                <thead>
                  <tr className="bg-[var(--surface-muted)]">
                    <th colSpan={2} className="border border-[var(--border)] p-2 font-medium text-[var(--chalk)]">구분</th>
                    <th className="border border-[var(--border)] p-2 font-medium text-[var(--chalk)]">1개월</th>
                    <th className="border border-[var(--border)] p-2 font-medium text-[var(--chalk)]">3개월</th>
                    <th className="border border-[var(--border)] p-2 font-medium text-[var(--chalk)]">공통적용</th>
                    <th className="border border-[var(--border)] p-2 font-medium text-[var(--chalk)]">비고</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowSpan={3} className="border border-[var(--border)] p-2 align-middle text-[var(--chalk-muted)]">
                      일반
                      <br />
                      (고등포함)
                    </td>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{TABLE_ROWS[0].구분2 || "-"}</td>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{formatAmount(TABLE_ROWS[0]["1개월"]) || "-"}</td>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{formatAmount(TABLE_ROWS[0]["3개월"]) || "-"}</td>
                    <td rowSpan={6} className="border border-[var(--border)] p-2 align-middle text-[var(--chalk-muted)]">
                      신규회원 강습비 50,000원 별도
                      <br />
                      * 최초등록시만 적용
                      <br />
                      1개월이후
                      <br />
                      월 이용료만 적용
                    </td>
                    <td rowSpan={6} className="border border-[var(--border)] p-2 align-middle text-[var(--chalk-muted)]">
                      할인가 적용은
                      <br />
                      카드및 현금영수증 발급시
                      <br />
                      적용됩니다.
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{TABLE_ROWS[1].구분2 || "-"}</td>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{formatAmount(TABLE_ROWS[1]["1개월"]) || "-"}</td>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{formatAmount(TABLE_ROWS[1]["3개월"]) || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{TABLE_ROWS[2].구분2 || "-"}</td>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{formatAmount(TABLE_ROWS[2]["1개월"]) || "-"}</td>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{formatAmount(TABLE_ROWS[2]["3개월"]) || "-"}</td>
                  </tr>
                  <tr>
                    <td rowSpan={3} className="border border-[var(--border)] p-2 align-middle text-[var(--chalk-muted)]">
                      학생(초,중)
                    </td>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{TABLE_ROWS[3].구분2 || "-"}</td>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{formatAmount(TABLE_ROWS[3]["1개월"]) || "-"}</td>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{formatAmount(TABLE_ROWS[3]["3개월"]) || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{TABLE_ROWS[4].구분2 || "-"}</td>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{formatAmount(TABLE_ROWS[4]["1개월"]) || "-"}</td>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{formatAmount(TABLE_ROWS[4]["3개월"]) || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{TABLE_ROWS[5].구분2 || "-"}</td>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{formatAmount(TABLE_ROWS[5]["1개월"]) || "-"}</td>
                    <td className="border border-[var(--border)] p-2 text-[var(--chalk-muted)]">{formatAmount(TABLE_ROWS[5]["3개월"]) || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)]"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
