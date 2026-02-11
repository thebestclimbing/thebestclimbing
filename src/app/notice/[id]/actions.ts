"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CreateNoticeCommentResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * 로그인한 회원이 공지에 댓글 작성.
 */
export async function createNoticeComment(
  noticeId: string,
  body: string
): Promise<CreateNoticeCommentResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "로그인한 회원만 댓글을 남길 수 있습니다." };
  }

  const trimmed = body?.trim() ?? "";
  if (!trimmed) {
    return { ok: false, error: "댓글 내용을 입력해 주세요." };
  }

  const { error } = await supabase.from("notice_comments").insert({
    notice_id: noticeId,
    author_id: user.id,
    body: trimmed,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/notice/${noticeId}`);
  return { ok: true };
}
