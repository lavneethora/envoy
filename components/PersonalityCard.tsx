"use client";

import type { PersonalityCard as PC } from "@/lib/agent/personality";
import { TraitMeter } from "./TraitMeter";

export function PersonalityCard({ personality }: { personality: PC }) {
  const { agentName, archetype, traits, voiceRules, signatureMoves, tabooPhrases, exampleOpenings, companyContext } = personality;
  return (
    <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 overflow-hidden">
      <div className="p-5 border-b border-zinc-800">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-zinc-500 font-mono tracking-wide uppercase">
              Agent · {companyContext.name}
            </div>
            <h2 className="mt-1 text-xl font-semibold text-zinc-100">{agentName}</h2>
            <p className="text-sm text-zinc-400 italic">{archetype}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-700 grid place-items-center text-zinc-950 font-bold text-lg shrink-0">
            {agentName?.[0]?.toUpperCase() ?? "A"}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <section>
          <h3 className="text-xs uppercase tracking-wide text-zinc-500 mb-3">Traits</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(traits) as (keyof typeof traits)[]).map((t) => (
              <TraitMeter key={t} trait={t} value={traits[t]} />
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Voice rules</h3>
          <ul className="space-y-1.5">
            {voiceRules.map((r, i) => (
              <li
                key={i}
                className="text-xs text-zinc-300 pl-3 border-l-2 border-emerald-700/60 leading-relaxed"
              >
                {r}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Signature moves</h3>
          <div className="flex flex-wrap gap-1.5">
            {signatureMoves.map((m, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-1 rounded bg-emerald-900/30 text-emerald-300 border border-emerald-800/50"
              >
                {m}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Never says</h3>
          <div className="flex flex-wrap gap-1.5">
            {tabooPhrases.map((p, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-1 rounded bg-rose-950/30 text-rose-300 border border-rose-900/40 line-through decoration-rose-500/60"
              >
                {p}
              </span>
            ))}
          </div>
        </section>

        {exampleOpenings?.length > 0 && (
          <section>
            <h3 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
              Example openings
            </h3>
            <div className="space-y-1.5">
              {exampleOpenings.map((o, i) => (
                <div
                  key={i}
                  className="text-xs text-zinc-300 bg-zinc-900/80 rounded px-3 py-2 border border-zinc-800 font-mono"
                >
                  &quot;{o}&quot;
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
