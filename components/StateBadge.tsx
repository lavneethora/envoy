"use client";

import { STATE_COLORS, STATE_LABELS, type CandidateState } from "@/lib/agent/state-machine";
import { cn } from "@/lib/utils";

export function StateBadge({
  state,
  size = "sm",
  pulsing = false,
}: {
  state: CandidateState;
  size?: "sm" | "md";
  pulsing?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        STATE_COLORS[state],
        size === "sm" ? "text-[11px] px-2.5 py-1" : "text-xs px-3 py-1.5",
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full bg-current opacity-70",
          pulsing && "animate-pulse",
        )}
      />
      {STATE_LABELS[state]}
    </span>
  );
}

export function StateHistory({
  history,
}: {
  history: { state: CandidateState; at: number }[];
}) {
  if (!history.length) return null;
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {history.map((h, i) => (
        <div key={i} className="flex items-center gap-1.5 shrink-0">
          <StateBadge state={h.state} />
          {i < history.length - 1 && (
            <span className="text-zinc-600 text-xs">→</span>
          )}
        </div>
      ))}
    </div>
  );
}
