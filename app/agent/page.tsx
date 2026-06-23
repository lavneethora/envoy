"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { PersonalityCard } from "@/components/PersonalityCard";
import { StateBadge } from "@/components/StateBadge";

export default function AgentPage() {
  const personality = useStore((s) => s.personality);
  const candidates = useStore((s) => s.candidates);
  const resetAll = useStore((s) => s.resetAll);

  if (!personality) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold mb-3">No agent configured yet</h1>
        <p className="text-zinc-400 mb-6">Configure one to see its personality.</p>
        <Link
          href="/configure"
          className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
        >
          Configure →
        </Link>
      </div>
    );
  }

  const candidateList = Object.values(candidates).sort(
    (a, b) => b.messages[0]?.createdAt ?? 0 - (a.messages[0]?.createdAt ?? 0),
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-6 flex-wrap gap-2">
        <div>
          <div className="text-xs font-mono text-emerald-400 mb-1">STEP 2 / 3</div>
          <h1 className="text-2xl font-semibold tracking-tight">Your agent</h1>
          <p className="text-sm text-zinc-400 mt-1">
            This personality is injected into every decision the agent makes downstream.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/configure"
            className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            ← Reconfigure
          </Link>
          <button
            onClick={() => {
              if (confirm("Reset everything (personality + candidates)?")) {
                resetAll();
              }
            }}
            className="text-xs text-zinc-500 hover:text-rose-400 transition-colors"
          >
            Reset all
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
        <PersonalityCard personality={personality} />

        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h3 className="text-sm font-medium text-zinc-200 mb-1">
              Candidates engaged by {personality.agentName}
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Add a candidate to watch the agent plan a sequence, then simulate a reply
              to trigger the reasoning loop.
            </p>
            <Link
              href="/candidate/new"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-500 px-3.5 text-sm font-medium text-zinc-950 hover:bg-emerald-400 transition-colors"
            >
              + Add a candidate
            </Link>

            {candidateList.length > 0 && (
              <div className="mt-5 space-y-2">
                {candidateList.map((c) => (
                  <Link
                    key={c.id}
                    href={`/candidate/${c.id}`}
                    className="block rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 hover:border-zinc-600 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-zinc-100 truncate">
                          {c.profile.name}
                        </div>
                        <div className="text-xs text-zinc-500 truncate">
                          {c.profile.role}
                        </div>
                      </div>
                      <StateBadge state={c.state} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
