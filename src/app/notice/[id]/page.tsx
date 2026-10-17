import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeKST } from "@/lib/date";
import { NoticeCommentSection } from "./NoticeCommentSection";
import { DispatchDisplay } from "./DispatchDisplay";

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: notice, error } = await supabase
    .from("notices")
    .select(
      `
      id,
      title,
      body,
      notice_type,
      created_at,
      author:profiles(id, name)
    `
    )
    .eq("id", id)
    .single();

  if (error || !notice) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: comments } = await supabase
    .from("notice_comments")
    .select(
      `
      id,
      body,
      created_at,
      author:profiles(id, name)
    `
    )
    .eq("notice_id", id)
    .order("created_at", { ascending: true });

  const row = notice as unknown as {
    id: string;
    title: string;
    body: string;
    notice_type: "센터공지" | "등반공지";
    created_at: string;
    author: { id: string; name: string } | { id: string; name: string }[] | null;
  };
  const author = Array.isArray(row.author) ? row.author[0] : row.author;

  type CommentRow = {
    id: string;
    body: string;
    created_at: string;
    author: { id: string; name: string } | { id: string; name: string }[] | null;
  };
  const commentList = (comments ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    author: (c as unknown as CommentRow).author,
  }));

  let dispatchDisplayList: { vehicleModel: string; ownerName: string; passengerNames: string[] }[] = [];
  if (row.notice_type === "등반공지") {
    const { data: dispatchRows } = await supabase
      .from("notice_dispatches")
      .select(
        `
        id,
        vehicle:member_vehicles(model, owner:profiles(name)),
        passengers:dispatch_passengers(profile:profiles(name))
      `
      )
      .eq("notice_id", id);

    type DispatchRow = {
      id: string;
      vehicle:
        | { model: string; owner: { name: string } | { name: string }[] | null }
        | { model: string; owner: { name: string } | { name: string }[] | null }[]
        | null;
      passengers: { profile: { name: string } | { name: string }[] | null }[] | null;
    };
    dispatchDisplayList = (dispatchRows ?? []).map((d) => {
      const r = d as unknown as DispatchRow;
      const vehicle = Array.isArray(r.vehicle) ? r.vehicle[0] : r.vehicle;
      const owner = vehicle ? (Array.isArray(vehicle.owner) ? vehicle.owner[0] : vehicle.owner) : null;
      const passengerNames = (r.passengers ?? [])
        .map((p) => {
          const profile = Array.isArray(p.profile) ? p.profile[0] : p.profile;
          return profile?.name ?? "";
        })
        .filter(Boolean);
      return {
        vehicleModel: vehicle?.model ?? "",
        ownerName: owner?.name ?? "",
        passengerNames,
      };
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <article className="card rounded-2xl p-6">
        <h1 className="mb-4 text-2xl font-bold text-[var(--chalk)]">
          {row.title}
        </h1>
        <div className="mb-4 flex gap-4 text-sm text-[var(--chalk-muted)]">
          <span>작성자: {author?.name ?? "-"}</span>
          <span>작성일자: {formatDateTimeKST(row.created_at)}</span>
        </div>
        <div className="whitespace-pre-wrap text-[var(--chalk)]">
          {row.body || "(내용 없음)"}
        </div>
      </article>

      {row.notice_type === "등반공지" && <DispatchDisplay dispatches={dispatchDisplayList} />}

      <NoticeCommentSection
        noticeId={id}
        initialComments={commentList}
        isLoggedIn={!!user}
      />

      <p className="mt-6">
        <Link
          href="/notice"
          className="text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"
        >
          목록으로
        </Link>
      </p>
    </div>
  );
}
