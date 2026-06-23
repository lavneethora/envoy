"use client";

import { TRAIT_DESCRIPTIONS, TRAIT_LABELS, type Trait } from "@/lib/agent/personality";

export function TraitMeter({
  trait,
  value,
}: {
  trait: Trait;
  value: number;
}) {
  const pct = Math.max(0, Math.min(10, value)) * 10;
  const [low, high] = TRAIT_DESCRIPTIONS[trait];
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-zinc-200">{TRAIT_LABELS[trait]}</span>
        <span className="font-mono text-xs text-emerald-400">{value.toFixed(1)}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-zinc-500">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
