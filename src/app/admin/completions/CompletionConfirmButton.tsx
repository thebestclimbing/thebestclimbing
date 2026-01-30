"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export function CompletionConfirmButton({ logId }: { logId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("exercise_logs")
      .update({ is_completed: true, completion_requested: false })
      .eq("id", logId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleConfirm}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? (
        <LoadingSpinner size="sm" className="text-white" />
      ) : null}
      완등완료
    </button>
  );
}
