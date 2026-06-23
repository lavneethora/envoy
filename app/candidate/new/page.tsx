"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/utils";
import {
  INTENT_LABELS,
  type CandidateProfile,
  type OutreachIntent,
  type OutreachStrategy,
} from "@/lib/agent/strategy";
import type { Candidate } from "@/lib/store";

const DEMO_CANDIDATES: { label: string; profile: CandidateProfile }[] = [
  {
    label: "Founding-engineer candidate (Maya)",
    profile: {
      name: "Maya Hartmann",
      role: "Staff Engineer at Linear",
      background:
        "Joined Linear in 2021 as ~employee #20. Has shipped Linear Insights and most of the GraphQL gateway. Previously 4 years at Stripe on internal tooling. Strong TS + Rust.",
      signals:
        "Liked a tweet of yours about LLM agents being 'mostly state machines'. Has been quiet on LinkedIn for ~6 months — possible itch.",
    },
  },
  {
    label: "Late-night bartender (Tomás)",
    profile: {
      name: "Tomás Reiter",
      role: "Head Bartender at Klunkerkranich",
      background:
        "Five years on the Kreuzberg/Friedrichshain circuit. Started at ://about blank, moved to Klunkerkranich during covid. Known for cold-storage craft cocktails and not losing his cool.",
      signals:
        "Owner of Klunkerkranich just sold to a hotel chain. Tomás posted a story last week that just said 'so it goes'.",
    },
  },
  {
    label: "Quant researcher (Dr. Aron)",
    profile: {
      name: "Dr. Aron Veltri",
      role: "Senior Quant Researcher at WorldQuant",
      background:
        "PhD ETH Zurich, statistical physics. 3 years at WorldQuant on macro factor models. Co-authored a 2023 paper on regime-switching alpha decay. Originally from Lugano, fluent German.",
      signals:
        "Cited our founder's 2019 paper twice in his thesis. Recently posted on Twitter that he's reading Mandelbrot again — usually a signal someone's bored.",
    },
  },
];

const INTENTS: OutreachIntent[] = [
  "schedule_intro_call",
  "gauge_interest",
  "invite_to_event",
  "referral_ask",
];

export default function NewCandidatePage() {
  const router = useRouter();
  const personality = useStore((s) => s.personality);
  const upsertCandidate = useStore((s) => s.upsertCandidate);

  const [profile, setProfile] = useState<CandidateProfile>(DEMO_CANDIDATES[0].profile);
  const [intent, setIntent] = useState<OutreachIntent>("schedule_intro_call");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!personality) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="text-xl font-semibold mb-3">Configure an agent first</h1>
        <Link
          href="/configure"
          className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-medium text-zinc-950"
        >
          Configure →
        </Link>
      </div>
    );
  }

  function update<K extends keyof CandidateProfile>(key: K, value: CandidateProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/candidate/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personality, candidate: profile, intent }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Strategy generation failed (${res.status})`);
      }
      const { strategy } = (await res.json()) as { strategy: OutreachStrategy };
      const id = uid("cand");
      const candidate: Candidate = {
        id,
        profile,
        intent,
        strategy,
        state: "NOT_CONTACTED",
        stateHistory: [{ state: "NOT_CONTACTED", at: Date.now() }],
        messages: [],
        traces: [],
      };
      upsertCandidate(candidate);
      router.push(`/candidate/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="text-xs font-mono text-emerald-400 mb-2">STEP 3 / 3</div>
        <h1 className="text-3xl font-semibold tracking-tight">Add a candidate</h1>
        <p className="mt-2 text-zinc-400 text-sm leading-relaxed">
          The agent will analyse this profile against {personality.companyContext.name}&apos;s
          context and propose a multi-touch sequence with explicit strategic reasoning.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <span className="text-xs text-zinc-500 mr-1 self-center">Quick-fill:</span>
        {DEMO_CANDIDATES.map((d) => (
          <button
            key={d.label}
            type="button"
            onClick={() => setProfile(d.profile)}
            className="text-xs px-2.5 py-1 rounded border border-zinc-800 hover:border-emerald-700 hover:text-emerald-300 text-zinc-400 transition-colors"
          >
            {d.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Candidate name">
          <input
            type="text"
            value={profile.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Current role">
          <input
            type="text"
            value={profile.role}
            onChange={(e) => update("role", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Background" hint="Where they've worked, what they've shipped.">
          <textarea
            value={profile.background}
            onChange={(e) => update("background", e.target.value)}
            className={textareaClass}
            rows={3}
          />
        </Field>
        <Field
          label="Signals — why now, why them"
          hint="Anything specific. The agent will reference these."
        >
          <textarea
            value={profile.signals}
            onChange={(e) => update("signals", e.target.value)}
            className={textareaClass}
            rows={3}
          />
        </Field>

        <Field label="Outreach intent">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INTENTS.map((i) => (
              <label
                key={i}
                className={`flex items-start gap-2 p-3 rounded-md border text-sm cursor-pointer transition-colors ${
                  intent === i
                    ? "border-emerald-600 bg-emerald-950/30"
                    : "border-zinc-800 hover:border-zinc-600"
                }`}
              >
                <input
                  type="radio"
                  name="intent"
                  value={i}
                  checked={intent === i}
                  onChange={() => setIntent(i)}
                  className="mt-0.5 accent-emerald-500"
                />
                <span className="text-zinc-200">{INTENT_LABELS[i]}</span>
              </label>
            ))}
          </div>
        </Field>

        {error && (
          <div className="text-sm text-rose-400 bg-rose-950/30 border border-rose-900/40 rounded p-3">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-emerald-500 text-zinc-950 text-sm font-medium hover:bg-emerald-400 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-zinc-900/30 border-t-zinc-900 animate-spin" />
                Planning sequence…
              </>
            ) : (
              <>Plan outreach sequence →</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-emerald-600 placeholder:text-zinc-600";
const textareaClass = inputClass + " leading-relaxed resize-y";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-zinc-200">{label}</span>
        {hint && <span className="text-[11px] text-zinc-500">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
