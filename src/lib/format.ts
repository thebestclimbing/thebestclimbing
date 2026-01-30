/**
 * 전화번호를 하이픈 포맷으로 변환 (예: 01012345678 → 010-1234-5678)
 */
export function formatPhone(phone: string | null | undefined): string {
  if (phone == null || phone === "") return "-";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("010")) {
    return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  }
  if (digits.length === 10 && digits.startsWith("02")) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }
  if (digits.length >= 10) {
    return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  }
  return phone;
}
