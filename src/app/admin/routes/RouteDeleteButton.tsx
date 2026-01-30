"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

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
      className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 disabled:pointer-events-none dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" className="text-red-600 dark:text-red-400" />
          삭제 중...
        </>
      ) : (
        "삭제"
      )}
    </button>
  );
}
