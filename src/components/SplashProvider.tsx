"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { SplashScreen } from "./SplashScreen";

const SPLASH_KEY = "bestclimbing-splash-v1";

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const seen = typeof window !== "undefined" && sessionStorage.getItem(SPLASH_KEY);
    if (!seen) {
      setShowSplash(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SPLASH_KEY, "1");
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--rock)]">
        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--rope)] opacity-60" />
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen key="splash" onComplete={handleSplashComplete} />
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
