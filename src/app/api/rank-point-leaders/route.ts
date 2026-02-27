import { NextResponse } from "next/server";
import { getRankPointLeaders, getRankPointLeadersPaginated } from "@/lib/rank-point-leaders";

/**
 * GET /api/rank-point-leaders
 * - ?limit=N : 상위 N명 (메인 위젯용), 응답 { leaders }
 * - ?page=N&size=M : 페이지네이션, 응답 { leaders, total }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const sizeParam = searchParams.get("size");
  const limitParam = searchParams.get("limit");

  if (pageParam != null && sizeParam != null) {
    const page = Math.max(1, parseInt(pageParam, 10) || 1);
    const size = Math.min(100, Math.max(1, parseInt(sizeParam, 10) || 20));
    const q = searchParams.get("q")?.trim() || undefined;
    const { leaders, total } = await getRankPointLeadersPaginated(page, size, q);
    return NextResponse.json({ leaders, total });
  }

  const limit = Math.min(500, Math.max(1, parseInt(limitParam ?? "3", 10) || 3));
  const leaders = await getRankPointLeaders(limit);
  return NextResponse.json({ leaders });
}
