"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ExerciseLogForm from "./ExerciseLogForm";

interface RouteRow {
  id: string;
  wall_type: string;
  grade_value: string;
  grade_detail: string;
  name: string;
  hold_count: number;
}

export default function ExerciseLogAddSection({
  profileId,
  routes,
}: {
  profileId: string;
  routes: RouteRow[];
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="mb-6 md:mb-8 lg:mb-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 md:mb-8 lg:mb-10">
        <motion.h1
          className="text-2xl font-bold text-[var(--chalk)] md:text-3xl lg:text-4xl"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          나의 운동일지
        </motion.h1>
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.button
              key="cancel"
              type="button"
              onClick={() => setShowForm(false)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--chalk-muted)] shadow-sm hover:bg-[var(--surface-muted)] hover:text-[var(--chalk)] md:px-5 md:py-3 md:text-base lg:px-6 lg:py-3.5"
            >
              취소
            </motion.button>
          ) : (
            <motion.button
              key="add"
              type="button"
              onClick={() => setShowForm(true)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 md:px-5 md:py-3 md:text-base lg:px-6 lg:py-3.5"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-lg leading-none md:h-7 md:w-7 lg:h-8 lg:w-8">
                +
              </span>
              추가
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <ExerciseLogForm
              profileId={profileId}
              routes={routes}
              onSuccess={() => setShowForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
