"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useStore, type Candidate, type Message, type ReasoningStep, type ReasoningTrace as RT } from "@/lib/store";
import { uid } from "@/lib/utils";
import { StateBadge, StateHistory } from "@/components/StateBadge";
import { ReasoningTrace } from "@/components/ReasoningTrace";
import { classificationToState, type CandidateState, type NextAction, type ReplyClassification } from "@/lib/agent/state-machine";
import type { ConvoMessage } from "@/lib/agent/reasoning";
import { INTENT_LABELS } from "@/lib/agent/strategy";

export default function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const personality = useStore((s) => s.personality);
  const candidate = useStore((s) => s.candidates[id]);
  const patchCandidate = useStore((s) => s.patchCandidate);

  const [replyDraft, setReplyDraft] = useState("");
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<ReasoningStep["kind"] | null>(null);
  const [activeTrace, setActiveTrace] = useState<RT | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!personality) {
    return (
      <NotReady title="No agent configured" cta={{ href: "/configure", label: "Configure →" }} />
    );
  }
  if (!candidate) {
    return (
      <NotReady title="Candidate not found" cta={{ href: "/agent", label: "← Back to agent" }} />
    );
  }

  const history: ConvoMessage[] = candidate.messages.map((m) => ({
    from: m.from,
    body: m.body,
  }));

  async function runChain(opts: {
    triggerLabel: string;
    candidateReply: string | null;
  }) {
    if (!personality || !candidate) return;
    setRunning(true);
    setError(null);
    const trace: RT = {
      id: uid("trace"),
      triggeredBy: opts.triggerLabel,
      steps: [],
      createdAt: Date.now(),
    };
    setActiveTrace(trace);
    const appendStep = (step: ReasoningStep) => {
      trace.steps = [...trace.steps, step];
      setActiveTrace({ ...trace });
    };
    let classification: ReplyClassification | null = null;
    let newState: CandidateState = candidate.state;
    let action: NextAction | null = null;
    let draftBody: string | null = null;
    let draftV1: string | null = null;
    let critiqueNotes: string | null = null;
    let channel: "email" | "linkedin_dm" | "linkedin_inmail" = "email";

    try {
      // 1. ANALYZE (only if there's a reply)
      if (opts.candidateReply) {
        setCurrentStep("analyze");
        const t0 = Date.now();
        const res = await fetch("/api/agent/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: personality.companyContext.name,
            history,
            reply: opts.candidateReply,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(`analyze: ${data.error ?? res.status}`);
        }
        const data = (await res.json()) as { classification: ReplyClassification };
        classification = data.classification;
        newState = classificationToState(classification);
        appendStep({
          kind: "analyze",
          title: `Classified as ${classification.sentiment.toUpperCase()}`,
          body: classification.signal,
          data: classification,
          durationMs: Date.now() - t0,
        });
      }

      // 2. DECIDE
      setCurrentStep("decide");
      const t1 = Date.now();
      const decideRes = await fetch("/api/agent/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personality,
          strategy: candidate.strategy,
          state: classification ? newState : candidate.state,
          classification,
        }),
      });
      if (!decideRes.ok) {
        const data = await decideRes.json().catch(() => ({}));
        throw new Error(`decide: ${data.error ?? decideRes.status}`);
      }
      const { action: act } = (await decideRes.json()) as { action: NextAction };
      action = act;
      const actionStateTransition = action.kind === "disqualify"
        ? "DISQUALIFIED" as CandidateState
        : action.kind === "escalate_to_human"
          ? "ESCALATED" as CandidateState
          : newState;
      newState = actionStateTransition;
      appendStep({
        kind: "decide",
        title: `Action: ${action.kind.replace("_", " ")}`,
        body: action.reasoning,
        data: action,
        durationMs: Date.now() - t1,
      });

      // 3. DRAFT (only if action is send_response or change_angle, or no candidateReply (initial))
      const shouldDraft =
        action.kind === "send_response" ||
        action.kind === "change_angle" ||
        (!opts.candidateReply && action.kind !== "wait" && action.kind !== "disqualify" && action.kind !== "escalate_to_human");

      if (shouldDraft) {
        // Pick channel from strategy if available
        const nextTouch =
          candidate.strategy?.touches[candidate.messages.filter((m) => m.from === "agent").length];
        channel = (nextTouch?.channel ?? "email") as typeof channel;

        setCurrentStep("draft");
        const t2 = Date.now();
        const draftRes = await fetch("/api/agent/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personality,
            candidate: candidate.profile,
            history,
            action,
            channel,
            classification,
          }),
        });
        if (!draftRes.ok) {
          const data = await draftRes.json().catch(() => ({}));
          throw new Error(`draft: ${data.error ?? draftRes.status}`);
        }
        const draftData = (await draftRes.json()) as {
          draft: { subject: string | null; body: string; voiceCheck: string };
        };
        draftV1 = draftData.draft.body;
        draftBody = draftData.draft.body;
        appendStep({
          kind: "draft",
          title: draftData.draft.subject
            ? `Drafted (${channel}): "${draftData.draft.subject}"`
            : `Drafted (${channel})`,
          body: draftData.draft.body,
          data: { voiceCheck: draftData.draft.voiceCheck, channel, subject: draftData.draft.subject },
          durationMs: Date.now() - t2,
        });

        // 4. CRITIQUE
        setCurrentStep("critique");
        const t3 = Date.now();
        const critiqueRes = await fetch("/api/agent/critique", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personality,
            candidate: candidate.profile,
            draftBody: draftV1,
          }),
        });
        if (!critiqueRes.ok) {
          const data = await critiqueRes.json().catch(() => ({}));
          throw new Error(`critique: ${data.error ?? critiqueRes.status}`);
        }
        const critiqueData = (await critiqueRes.json()) as {
          critique: {
            issues: { rule: string; severity: string; evidence: string }[];
            shouldRevise: boolean;
            revisedBody: string | null;
            summary: string;
          };
        };
        critiqueNotes = critiqueData.critique.summary;
        if (critiqueData.critique.shouldRevise && critiqueData.critique.revisedBody) {
          draftBody = critiqueData.critique.revisedBody;
        }
        appendStep({
          kind: "critique",
          title: critiqueData.critique.shouldRevise
            ? `Revised — ${critiqueData.critique.summary}`
            : `Shipped as-is — ${critiqueData.critique.summary}`,
          body:
            critiqueData.critique.issues.length === 0
              ? "No issues found. Voice + specificity check passed."
              : critiqueData.critique.issues
                  .map(
                    (i) =>
                      `[${i.severity.toUpperCase()}] ${i.rule}\n   evidence: ${i.evidence}`,
                  )
                  .join("\n\n"),
          data: critiqueData.critique,
          durationMs: Date.now() - t3,
        });
      }

      // Commit results to store
      const newMessages: Message[] = [...candidate.messages];
      if (opts.candidateReply) {
        newMessages.push({
          id: uid("msg"),
          from: "candidate",
          channel: "sim",
          body: opts.candidateReply,
          createdAt: Date.now(),
        });
      }
      if (draftBody) {
        newMessages.push({
          id: uid("msg"),
          from: "agent",
          channel,
          body: draftBody,
          draftV1: draftV1 !== draftBody ? draftV1 ?? undefined : undefined,
          critiqueNotes: critiqueNotes ?? undefined,
          createdAt: Date.now(),
        });
        if (newState === "NOT_CONTACTED") newState = "INITIAL_SENT";
      }

      const stateChanged = newState !== candidate.state;
      patchCandidate(candidate.id, {
        messages: newMessages,
        state: newState,
        stateHistory: stateChanged
          ? [...candidate.stateHistory, { state: newState, at: Date.now() }]
          : candidate.stateHistory,
        traces: [...candidate.traces, trace],
        lastClassification: classification ?? candidate.lastClassification,
        lastAction: action ?? candidate.lastAction,
      });

      if (opts.candidateReply) setReplyDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCurrentStep(null);
      setRunning(false);
    }
  }

  const lastAgentMsg = [...candidate.messages].reverse().find((m) => m.from === "agent");

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-4 flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {candidate.profile.name}
            </h1>
            <StateBadge state={candidate.state} size="md" pulsing={running} />
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            {candidate.profile.role} · intent:{" "}
            <span className="text-zinc-300">{INTENT_LABELS[candidate.intent]}</span>
          </p>
        </div>
        <Link
          href="/agent"
          className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          ← All candidates
        </Link>
      </div>

      {candidate.stateHistory.length > 1 && (
        <div className="mb-6">
          <StateHistory history={candidate.stateHistory} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6">
        {/* LEFT — strategy + profile */}
        <div className="space-y-4">
          {candidate.strategy && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <h3 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
                Outreach strategy
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed mb-3">
                {candidate.strategy.strategyReasoning}
              </p>
              <ol className="space-y-2">
                {candidate.strategy.touches.map((t) => (
                  <li
                    key={t.index}
                    className="text-xs border-l-2 border-emerald-700/50 pl-3 py-1"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-emerald-400">T{t.index}</span>
                      <span className="text-zinc-500">
                        {t.channel} · day {t.dayOffset}
                      </span>
                    </div>
                    <div className="text-zinc-200 mt-0.5">{t.angle}</div>
                    <div className="text-zinc-500 italic mt-0.5">{t.hook}</div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h3 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
              Candidate signals
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {candidate.profile.signals || "—"}
            </p>
            <h3 className="text-xs uppercase tracking-wide text-zinc-500 mb-2 mt-4">
              Background
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {candidate.profile.background || "—"}
            </p>
          </div>
        </div>

        {/* RIGHT — conversation + reasoning */}
        <div className="space-y-4">
          {/* Messages */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">Conversation</span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {candidate.messages.length} message
                {candidate.messages.length === 1 ? "" : "s"} · drafted, never sent
              </span>
            </div>
            <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
              {candidate.messages.length === 0 ? (
                <div className="text-sm text-zinc-500 italic text-center py-6">
                  No messages yet. Generate the initial outreach to begin.
                </div>
              ) : (
                candidate.messages.map((m) => <MessageBubble key={m.id} m={m} />)
              )}
            </div>
          </div>

          {/* Action area */}
          {candidate.state === "DISQUALIFIED" ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 text-center text-sm text-zinc-500">
              Candidate disqualified. Agent stopped outreach.
            </div>
          ) : candidate.state === "ESCALATED" ? (
            <div className="rounded-xl border border-indigo-800/50 bg-indigo-950/20 p-5 text-center text-sm text-indigo-300">
              Agent escalated this conversation to a human. Would notify on real channel.
            </div>
          ) : candidate.messages.length === 0 ? (
            <button
              onClick={() =>
                runChain({ triggerLabel: "Initial outreach", candidateReply: null })
              }
              disabled={running}
              className="w-full h-11 rounded-md bg-emerald-500 text-zinc-950 text-sm font-medium hover:bg-emerald-400 disabled:opacity-50 transition-colors"
            >
              {running ? "Reasoning…" : `→ Generate initial outreach`}
            </button>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="text-xs font-medium text-zinc-300 mb-2">
                💭 Simulate a candidate reply
              </div>
              <textarea
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                placeholder={
                  lastAgentMsg
                    ? `Reply as if you're ${candidate.profile.name}…\n\nExamples:\n• "Thanks but I'm not looking right now"\n• "Sounds interesting — what's the comp band?"\n• "I'm flattered but I just joined my current role 3 months ago"`
                    : "Type a candidate reply…"
                }
                rows={3}
                className="w-full text-sm bg-zinc-950/60 border border-zinc-800 rounded-md p-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600 resize-y"
                disabled={running}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-zinc-500">
                  Agent will analyse → decide → maybe draft → critique
                </span>
                <button
                  onClick={() =>
                    runChain({
                      triggerLabel: `Reply: "${replyDraft.slice(0, 40)}${replyDraft.length > 40 ? "…" : ""}"`,
                      candidateReply: replyDraft.trim(),
                    })
                  }
                  disabled={running || !replyDraft.trim()}
                  className="h-8 px-3 rounded-md bg-emerald-500 text-zinc-950 text-xs font-medium hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                >
                  {running ? "Reasoning…" : "Send reply →"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-rose-400 bg-rose-950/30 border border-rose-900/40 rounded p-3">
              {error}
            </div>
          )}

          {/* Live trace */}
          {activeTrace && (
            <ReasoningTrace
              trace={activeTrace}
              inProgress={running}
              currentStep={currentStep}
            />
          )}

          {/* Past traces */}
          {candidate.traces.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wide text-zinc-500">
                Previous reasoning traces ({candidate.traces.length})
              </h3>
              {[...candidate.traces].reverse().map((t) => (
                <ReasoningTrace key={t.id} trace={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ m }: { m: Message }) {
  const isAgent = m.from === "agent";
  return (
    <div className={`flex ${isAgent ? "" : "justify-end"}`}>
      <div
        className={`max-w-[88%] rounded-lg px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
          isAgent
            ? "bg-emerald-950/40 border border-emerald-900/40 text-zinc-100"
            : "bg-zinc-800/80 border border-zinc-700 text-zinc-100"
        }`}
      >
        <div className="text-[10px] font-mono uppercase tracking-wide mb-1.5 opacity-60">
          {isAgent ? `Agent · ${m.channel}` : "Candidate (simulated)"}
        </div>
        <div className="leading-relaxed">{m.body}</div>
        {m.draftV1 && (
          <details className="mt-2 text-[11px]">
            <summary className="cursor-pointer opacity-60 hover:opacity-100">
              📝 See v1 (pre-critique)
            </summary>
            <div className="mt-1.5 pt-2 border-t border-emerald-900/40 opacity-70 italic">
              {m.draftV1}
            </div>
            {m.critiqueNotes && (
              <div className="mt-1 text-[10px] text-purple-300/80">
                Critique: {m.critiqueNotes}
              </div>
            )}
          </details>
        )}
      </div>
    </div>
  );
}

function NotReady({
  title,
  cta,
}: {
  title: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center">
      <h1 className="text-xl font-semibold mb-3">{title}</h1>
      <Link
        href={cta.href}
        className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-medium text-zinc-950"
      >
        {cta.label}
      </Link>
    </div>
  );
}
