/**
 * 한국 시간(Asia/Seoul) 기준 날짜/시간 유틸
 */

const TZ = "Asia/Seoul";

/** ISO 날짜 문자열(YYYY-MM-DD)을 한국 시간 기준 오늘과 비교해 오늘인지 */
export function isTodayKST(isoDate: string): boolean {
  const today = getTodayISOKST();
  return isoDate === today;
}

/** 한국 시간 기준 오늘 날짜 YYYY-MM-DD */
export function getTodayISOKST(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

/** 한국 시간 기준 이번 주 월요일~오늘 { start, end } (YYYY-MM-DD) */
export function getWeekStartEndKST(): { start: string; end: string } {
  const today = getTodayISOKST();
  const dayOfWeek = new Date(`${today}T12:00:00`).getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(`${today}T12:00:00`);
  monday.setDate(monday.getDate() + mondayOffset);
  const start = monday.toISOString().slice(0, 10);
  return { start, end: today };
}

/** 한국 시간 기준 이번 달 1일~오늘 { start, end } (YYYY-MM-DD) */
export function getMonthStartEndKST(): { start: string; end: string } {
  const today = getTodayISOKST();
  const [y, m] = today.split("-");
  const start = `${y}-${m}-01`;
  return { start, end: today };
}

/** ISO 타임스탬프/날짜 문자열을 한국 시간으로 포맷 (날짜+시간) */
export function formatDateTimeKST(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", { timeZone: TZ });
}

/** ISO 날짜/타임스탬프 문자열을 한국 시간으로 포맷 (날짜만) */
export function formatDateKST(iso: string): string {
  const date = iso.includes("T") ? new Date(iso) : new Date(iso + "T12:00:00");
  return date.toLocaleDateString("ko-KR", { timeZone: TZ });
}
