import { createClient } from "@supabase/supabase-js";

/**
 * 서버 전용. auth.admin.deleteUser 등 서비스 롤이 필요한 작업에만 사용.
 * SUPABASE_SERVICE_ROLE_KEY는 브라우저에 노출하면 안 됨.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY가 없습니다. 회원 삭제를 사용하려면 .env.local에 설정하세요."
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
