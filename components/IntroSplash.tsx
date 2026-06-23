"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { TextScramble } from "@/components/ui/text-scramble";
import { InfiniteGrid } from "@/components/ui/the-infinite-grid";

type Phase = "idle" | "booting" | "done";

export function IntroSplash() {
  const [phase, setPhase] = useState<Phase>("idle");

  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  // Lock page scroll while the gate is up; restore once entered.
  useEffect(() => {
    if (phase === "done") return;
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [phase]);

  const enter = () => {
    if (phase !== "idle") return;
    setPhase("booting");
    window.setTimeout(() => setPhase("done"), 1150);
  };

  const booting = phase === "booting";

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.section
          key="intro"
          onMouseMove={handleMouseMove}
          onClick={enter}
          aria-label="Intro, click to enter"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          animate={booting ? { opacity: [1, 1, 0] } : { opacity: 1 }}
          transition={{ duration: booting ? 1.15 : 0.3, times: booting ? [0, 0.7, 1] : undefined }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 cursor-pointer overflow-hidden bg-background"
        >
          <InfiniteGrid mouseX={mouseX} mouseY={mouseY} />

          {/* Boot flash — grid floods emerald from center */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-[5]"
            style={{
              background:
                "radial-gradient(circle at center, rgba(16,185,129,0.18), transparent 60%)",
            }}
            initial={{ opacity: 0 }}
            animate={booting ? { opacity: [0, 1, 0] } : { opacity: 0 }}
            transition={{ duration: 0.9, times: [0, 0.4, 1] }}
          />

          {/* HUD rings — JARVIS pulse */}
          {booting &&
            [0, 0.12, 0.24].map((delay, i) => (
              <motion.span
                key={i}
                className="pointer-events-none absolute z-[6] rounded-full border border-emerald-400/70"
                style={{ width: 120, height: 120 }}
                initial={{ scale: 0, opacity: 0.9 }}
                animate={{ scale: 9, opacity: 0 }}
                transition={{ duration: 0.85, delay, ease: "easeOut" }}
              />
            ))}

          {/* Scanline sweep */}
          {booting && (
            <motion.span
              className="pointer-events-none absolute left-0 right-0 z-[7] h-px bg-emerald-400/80"
              style={{ boxShadow: "0 0 18px 2px rgba(16,185,129,0.8)" }}
              initial={{ top: "-2%", opacity: 0 }}
              animate={{ top: "102%", opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.7, ease: "easeIn" }}
            />
          )}

          {/* Name / CTA */}
          <motion.div
            className="relative z-10 flex flex-col items-center"
            animate={
              booting
                ? { scale: 1.08, opacity: 0, filter: "blur(6px)" }
                : { scale: 1, opacity: 1, filter: "blur(0px)" }
            }
            transition={{ duration: 0.5, ease: "easeIn" }}
          >
            <p className="text-[10px] uppercase tracking-[0.45em] text-zinc-600 font-mono mb-10">
              {booting ? "Initializing" : "Hover to decode"}
            </p>

            <TextScramble
              text="ENVOY"
              revealText="ENTER →"
              className="text-4xl sm:text-6xl md:text-7xl tracking-[0.18em]"
            />

            <p className="mt-12 text-[10px] uppercase tracking-[0.3em] text-zinc-700 font-mono">
              [ click to enter ]
            </p>
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
