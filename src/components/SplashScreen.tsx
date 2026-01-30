"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

const SPLASH_DURATION_MS = 2200;

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const t = setTimeout(onComplete, SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--rock)]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {/* 로고 / 타이틀 */}
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {/* 클라이밍 아이콘: 간단한 홀드/산 실루엣 */}
        <motion.div
          className="relative h-20 w-20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <svg
            viewBox="0 0 64 64"
            fill="none"
            className="h-full w-full text-[var(--rope)]"
          >
            <path
              d="M32 8 L44 24 L40 28 L32 20 L24 28 L20 24 Z"
              fill="currentColor"
              opacity={0.9}
            />
            <circle cx="32" cy="16" r="4" fill="currentColor" />
            <path
              d="M16 56 L24 40 L28 44 L20 56 Z M48 56 L40 40 L36 44 L44 56 Z"
              fill="currentColor"
              opacity={0.6}
            />
          </svg>
        </motion.div>
        <motion.h1
          className="text-center text-2xl font-bold tracking-tight text-[var(--chalk)] sm:text-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          베스트클라이밍
        </motion.h1>
        <motion.p
          className="text-sm text-[var(--chalk-muted)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          오늘도 한 걸음 더
        </motion.p>
      </motion.div>

      {/* 로딩 인디케이터 */}
      <motion.div
        className="absolute bottom-24 left-1/2 h-1 w-24 -translate-x-1/2 overflow-hidden rounded-full bg-[var(--wall)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.div
          className="h-full bg-[var(--rope)]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
