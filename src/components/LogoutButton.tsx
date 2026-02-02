"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type LogoutButtonProps = {
  className?: string;
  children?: React.ReactNode;
  variant?: "link" | "button";
};

export function LogoutButton({ className, children, variant = "link" }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const text = children ?? "로그아웃";

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className={className ?? "rounded-xl px-4 py-3 text-[var(--chalk)] hover:bg-[var(--surface-muted)]"}
      >
        {text}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className ?? "text-sm text-[var(--chalk-muted)] underline hover:text-[var(--chalk)]"}
    >
      {text}
    </button>
  );
}
