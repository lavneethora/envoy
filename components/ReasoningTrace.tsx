"use client";

import { useState } from "react";
import type { ReasoningStep, ReasoningTrace as RT } from "@/lib/store";
import { cn } from "@/lib/utils";

const STEP_META: Record<
  ReasoningStep["kind"],
  { label: string; icon: string; color: string }
> = {
  analyze: { label: "Analyze", icon: "🔎", color: "text-sky-400" },
  decide: { label: "Decide", icon: "🎯", color: "text-amber-400" },
  draft: { label: "Draft", icon: "✍️", color: "text-emerald-400" },
  critique: { label: "Critique", icon: "🔬", color: "text-purple-400" },
};

export function ReasoningTrace({
  trace,
  inProgress,
  currentStep,
}: {
  trace: RT | null;
  inProgress?: boolean;
  currentStep?: ReasoningStep["kind"] | null;
}) {
  if (!trace) return null;
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-300">🧠 Reasoning trace</span>
          {inProgress && (
            <span className="text-[10px] text-emerald-400 font-mono animate-pulse">
              thinking…
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-zinc-500">{trace.id.slice(-6)}</span>
      </div>
      <div className="p-4">
        {trace.triggeredBy && (
          <div className="text-[11px] text-zinc-500 mb-3 italic">
            Triggered by: {trace.triggeredBy}
          </div>
        )}
        <div className="space-y-3">
          {trace.steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} />
          ))}
          {inProgress && currentStep && !trace.steps.some((s) => s.kind === currentStep) && (
            <PendingStep kind={currentStep} />
          )}
        </div>
      </div>
    </div>
  );
}

function StepCard({ step, index }: { step: ReasoningStep; index: number }) {
  const meta = STEP_META[step.kind];
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="fade-in">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center pt-0.5">
          <div
            className={cn(
              "w-7 h-7 rounded-full border border-zinc-700 bg-zinc-900 grid place-items-center text-xs",
              meta.color,
            )}
          >
            {meta.icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="w-full text-left group"
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-mono text-zinc-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide",
                    meta.color,
                  )}
                >
                  {meta.label}
                </span>
                <span className="text-xs text-zinc-300">{step.title}</span>
              </div>
              <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400">
                {expanded ? "−" : "+"}
              </span>
            </div>
          </button>
          {expanded && (
            <div className="mt-1.5">
              <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {step.body}
              </div>
              {step.data != null && (
                <pre className="mt-2 text-[10px] font-mono text-zinc-500 bg-zinc-900/60 rounded p-2 border border-zinc-800/60 overflow-x-auto">
                  {JSON.stringify(step.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PendingStep({ kind }: { kind: ReasoningStep["kind"] }) {
  const meta = STEP_META[kind];
  return (
    <div className="flex items-center gap-3 fade-in">
      <div className="w-7 h-7 rounded-full border border-zinc-700 bg-zinc-900 grid place-items-center text-xs pulse-ring">
        {meta.icon}
      </div>
      <span
        className={cn(
          "text-xs font-semibold uppercase tracking-wide animate-pulse",
          meta.color,
        )}
      >
        {meta.label}…
      </span>
    </div>
  );
}
