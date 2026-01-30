"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RouteDeleteButton({
  routeId,
  routeName,
}: {
  routeId: string;
  routeName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`"${routeName}" 루트를 삭제할까요?`)) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("routes").delete().eq("id", routeId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
    >
      {loading ? "삭제 중..." : "삭제"}
    </button>
  );
}
