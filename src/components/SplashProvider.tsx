"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { SplashScreen } from "./SplashScreen";

const SPLASH_KEY = "bestclimbing-splash-v1";

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    let seen = false;
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        seen = !!sessionStorage.getItem(SPLASH_KEY);
      }
    } catch {
      // 인앱 브라우저·시크릿 등에서 sessionStorage 접근 불가 시 무시
    }
    if (!seen) {
      setShowSplash(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem(SPLASH_KEY, "1");
      }
    } catch {
      // 저장 실패해도 스플래시만 닫기
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--primary)] opacity-60" />
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
