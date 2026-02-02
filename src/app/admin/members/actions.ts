"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type DeleteMemberResult = { ok: true } | { ok: false; error: string };

export type AddMemberResult = { ok: true } | { ok: false; error: string };

/**
 * 관리자만 호출. auth.admin.createUser로 회원 생성(클라이언트 세션 변경 없음).
 * 트리거로 profiles 생성 후 membership_start/end 업데이트.
 */
export async function addMember(params: {
  name: string;
  email: string;
  phone: string;
  phone_tail4: string;
  membership_start: string;
  membership_end: string;
}): Promise<AddMemberResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "로그인이 필요합니다." };
  }
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") {
    return { ok: false, error: "관리자만 회원을 추가할 수 있습니다." };
  }
  const tail4 = params.phone_tail4.trim();
  if (tail4.length !== 4) {
    return { ok: false, error: "전화번호 뒤 4자리를 입력해 주세요." };
  }
  const signUpEmail = params.email.trim() || `${params.phone.replace(/\D/g, "")}@guest.local`;
  const password = "00" + tail4;
  try {
    const admin = createAdminClient();
    const { data: authData, error: createError } = await admin.auth.admin.createUser({
      email: signUpEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: params.name.trim(),
        phone: params.phone.trim(),
        phone_tail4: tail4,
      },
    });
    if (createError) {
      return { ok: false, error: createError.message };
    }
    if (!authData.user) {
      return { ok: false, error: "회원 생성 중 오류가 발생했습니다." };
    }
    const updates: { membership_start?: string; membership_end?: string } = {};
    if (params.membership_start.trim()) updates.membership_start = params.membership_start.trim();
    if (params.membership_end.trim()) updates.membership_end = params.membership_end.trim();
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await admin
        .from("profiles")
        .update(updates)
        .eq("id", authData.user.id);
      if (updateError) {
        return { ok: false, error: `회원은 생성되었으나 회원권 기간 저장 실패: ${updateError.message}` };
      }
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "회원 추가 중 오류가 발생했습니다.";
    return { ok: false, error: message };
  }
}

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
