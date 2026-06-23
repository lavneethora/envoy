"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { CompanyContext, PersonalityCard } from "@/lib/agent/personality";

const PSVIEW_DEMO: CompanyContext = {
  name: "PSVIEW",
  oneLiner: "Autonomous AI agents that engage candidates on behalf of companies.",
  description:
    "We build agents — not prompt wrappers — that reason and act on their own to source, engage and qualify candidates. Founder-led, small team, technical roots. Customers are scaling startups who hate the recruiting status quo.",
  culture:
    "Builder energy. Bias to ship. We don't write decks, we ship demos. Direct feedback, no corporate softening, very dry humor. We respect people who think hard and call things by their real names.",
  targetProfile:
    "Founding-engineer profile: strong full-stack, has shipped real product end-to-end, comfortable with LLMs and agentic systems, prefers ambiguous high-leverage work over well-defined tickets. Bonus: has built something a bit weird.",
  tonePreference:
    "Sharp, irreverent, no marketing voice. Should sound like a founder messaging a friend who happens to be an engineer — not like Greenhouse.",
};

const BAR_DEMO: CompanyContext = {
  name: "Hangar Acht",
  oneLiner:
    "Berlin techno bar known for 14-hour weekend sets and a very particular crowd.",
  description:
    "Independent, owner-operated, no investor money. 8 years in Friedrichshain. We're hiring head bartender — the person who runs the bar from 11pm to 8am on weekends.",
  culture:
    "Family vibes behind the bar. We don't care about hospitality CVs from chain hotels. We care that you remember regulars by their drinks and don't lose your shit at 4am when a stag party walks in.",
  targetProfile:
    "Someone who's worked at least 2 years in late-night nightlife (not restaurants), can spin a vinyl set in a pinch, speaks German conversationally. We've poached our last three head bartenders from other small Berlin venues.",
  tonePreference:
    "Casual, German-direct, slightly conspiratorial. Like you're tipping off a friend about an opening. Absolutely no 'we'd love to invite you to explore an opportunity'.",
};

const QUANT_DEMO: CompanyContext = {
  name: "Helvetica Capital",
  oneLiner: "Zurich-based systematic equities fund, ~$4B AUM.",
  description:
    "Founded 2011 by two ex-Renaissance researchers. We trade global equities with mean-reversion and structural-factor signals. Research team is 11 people, all PhDs in mathematics, physics or statistics. Compensation is the most competitive in EMEA quant.",
  culture:
    "Cerebral, precise, calm. No open-plan, no slack channels for memes. We read papers in book club every Wednesday. We hire people who reason from first principles and dislike consensus thinking.",
  targetProfile:
    "PhD in maths/physics/CS, published at least one paper, ideally has touched real markets even briefly (KDB+, real PnL exposure). We don't care about prior finance experience — we care about depth of statistical thinking.",
  tonePreference:
    "Restrained, intellectually serious. Show that we've read their paper. No buzzwords, no urgency theatre, no 'amazing opportunity'.",
};

export default function ConfigurePage() {
  const router = useRouter();
  const setPersonality = useStore((s) => s.setPersonality);
  const [form, setForm] = useState<CompanyContext>(PSVIEW_DEMO);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof CompanyContext>(key: K, value: CompanyContext[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Synthesis failed (${res.status})`);
      }
      const { personality } = (await res.json()) as { personality: PersonalityCard };
      setPersonality(personality);
      router.push("/agent");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="text-xs font-mono text-emerald-400 mb-2">STEP 1 / 3</div>
        <h1 className="text-3xl font-semibold tracking-tight">Configure your agent</h1>
        <p className="mt-2 text-zinc-400 text-sm leading-relaxed">
          The agent will synthesise its own personality from this context — a name, a
          voice, signature moves, taboo phrases. Be specific. Generic input → generic agent.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <span className="text-xs text-zinc-500 mr-1 self-center">Quick-fill:</span>
        {[
          { label: "PSVIEW (meta)", v: PSVIEW_DEMO },
          { label: "Berlin techno bar", v: BAR_DEMO },
          { label: "Zurich quant fund", v: QUANT_DEMO },
        ].map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setForm(p.v)}
            className="text-xs px-2.5 py-1 rounded border border-zinc-800 hover:border-emerald-700 hover:text-emerald-300 text-zinc-400 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Company name" required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
            placeholder="e.g. PSVIEW"
          />
        </Field>
        <Field label="One-liner — what they do">
          <input
            type="text"
            value={form.oneLiner}
            onChange={(e) => update("oneLiner", e.target.value)}
            className={inputClass}
            placeholder="The 1-sentence pitch"
          />
        </Field>
        <Field label="Full description" hint="2-4 sentences. Stage, what they sell, customers.">
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className={textareaClass}
            rows={3}
            required
          />
        </Field>
        <Field label="Culture" hint="How the team behaves day-to-day. Be specific.">
          <textarea
            value={form.culture}
            onChange={(e) => update("culture", e.target.value)}
            className={textareaClass}
            rows={3}
          />
        </Field>
        <Field label="Profiles they hire" hint="Concrete attributes, not 'A players'.">
          <textarea
            value={form.targetProfile}
            onChange={(e) => update("targetProfile", e.target.value)}
            className={textareaClass}
            rows={3}
          />
        </Field>
        <Field
          label="Tone preference"
          hint="How the founder wants the agent to come across in writing."
        >
          <textarea
            value={form.tonePreference}
            onChange={(e) => update("tonePreference", e.target.value)}
            className={textareaClass}
            rows={2}
          />
        </Field>

        {error && (
          <div className="text-sm text-rose-400 bg-rose-950/30 border border-rose-900/40 rounded p-3">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-3">
          <button
            type="submit"
            disabled={loading || !form.name || !form.description}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-emerald-500 text-zinc-950 text-sm font-medium hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-zinc-900/30 border-t-zinc-900 animate-spin" />
                Synthesising personality…
              </>
            ) : (
              <>Synthesise agent →</>
            )}
          </button>
          <p className="text-xs text-zinc-500">~5–8s · structured JSON · {`{personality}`}</p>
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
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-zinc-200">
          {label}
          {required && <span className="text-rose-400 ml-1">*</span>}
        </span>
        {hint && <span className="text-[11px] text-zinc-500">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
