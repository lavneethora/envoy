"use client";

import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useAnimationFrame,
  type MotionValue,
} from "framer-motion";

const GridPattern = ({
  offsetX,
  offsetY,
}: {
  offsetX: MotionValue<number>;
  offsetY: MotionValue<number>;
}) => {
  return (
    <svg className="w-full h-full">
      <defs>
        <motion.pattern
          id="grid-pattern"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-muted-foreground"
          />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>
  );
};

/**
 * Background-only version of the infinite grid: animated scrolling grid +
 * cursor-reveal mask + soft glows. Fills its (relative/absolute) parent.
 * Pass mouseX/mouseY (relative to the parent) for the reveal effect, or omit
 * to render just the ambient grid. Pointer-events are disabled so it never
 * blocks interactions above it.
 */
export const InfiniteGrid = ({
  mouseX,
  mouseY,
  className,
}: {
  mouseX?: MotionValue<number>;
  mouseY?: MotionValue<number>;
  className?: string;
}) => {
  const fallbackX = useMotionValue(-1000);
  const fallbackY = useMotionValue(-1000);
  const mx = mouseX ?? fallbackX;
  const my = mouseY ?? fallbackY;

  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  useAnimationFrame(() => {
    gridOffsetX.set((gridOffsetX.get() + 0.5) % 40);
    gridOffsetY.set((gridOffsetY.get() + 0.5) % 40);
  });

  const maskImage = useMotionTemplate`radial-gradient(300px circle at ${mx}px ${my}px, black, transparent)`;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div className="absolute inset-0 opacity-[0.06]">
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </div>
      <motion.div
        className="absolute inset-0 opacity-50"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </motion.div>

      <div className="absolute inset-0">
        <div className="absolute right-[-15%] top-[-20%] w-[45%] h-[45%] rounded-full bg-emerald-500/15 blur-[130px]" />
        <div className="absolute left-[-15%] bottom-[-25%] w-[45%] h-[45%] rounded-full bg-emerald-700/10 blur-[130px]" />
      </div>
    </div>
  );
};

export const Component = () => {
  const [count, setCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-background",
      )}
    >
      <InfiniteGrid mouseX={mouseX} mouseY={mouseY} />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-3xl mx-auto space-y-6 pointer-events-none">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
            The Infinite Grid
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Move your cursor to reveal the active grid layer. <br />
            The pattern scrolls infinitely in the background.
          </p>
        </div>

        <div className="flex gap-4 pointer-events-auto">
          <button
            onClick={() => setCount(count + 1)}
            className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-all shadow-md active:scale-95"
          >
            Interact ({count})
          </button>
          <button className="px-8 py-3 bg-secondary text-secondary-foreground font-semibold rounded-md hover:bg-secondary/80 transition-all active:scale-95">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};
