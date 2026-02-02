"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type DeleteMemberResult = { ok: true } | { ok: false; error: string };

/**
 * 관리자만 호출. 대상 회원(profile.id = auth user id)을 auth에서 삭제하면
 * profiles는 ON DELETE CASCADE로 함께 삭제됨.
 */
export async function deleteMember(profileId: string): Promise<DeleteMemberResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "로그인이 필요합니다." };
  }
  if (profileId === user.id) {
    return { ok: false, error: "본인 계정은 삭제할 수 없습니다." };
  }
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") {
    return { ok: false, error: "관리자만 회원을 삭제할 수 있습니다." };
  }
  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(profileId);
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "회원 삭제 중 오류가 발생했습니다.";
    return { ok: false, error: message };
  }
}
