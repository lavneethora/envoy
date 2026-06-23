import type { PersonalityCard } from "./personality";
import type { CandidateProfile, OutreachStrategy } from "./strategy";
import type {
  CandidateState,
  ReplyClassification,
  NextAction,
} from "./state-machine";

export type ConvoMessage = {
  from: "agent" | "candidate";
  body: string;
};

// ============ ANALYZE ============

export const ANALYZE_SYSTEM_PROMPT = `You are a recruiting-conversation analyst.

You receive a candidate's most recent reply, the previous conversation, and the company context. Classify the reply.

Output ONLY this JSON:

{
  "sentiment": "positive" | "neutral" | "objection" | "negative" | "deferring",
  "signal": string,         // ONE sentence: what is the candidate actually saying / asking / refusing?
  "objectionType": string | null,  // null unless sentiment="objection"; otherwise e.g. "compensation", "stage_of_company", "wrong_timing", "happy_in_role", "skeptical_of_recruiter"
  "buyingSignals": string[], // explicit signals of interest, e.g. ["asked about engineering team size", "mentioned own technical interest in X"]
  "redFlags": string[]       // things that should kill or pause outreach, e.g. ["recently joined", "explicit not-interested"]
}

Rules:
- Be precise. "I'll think about it" is "deferring", not "positive".
- A question is "neutral" with the question itself in "signal".
- "Sorry, not interested" is "negative", not "objection".
- An objection is when they want to engage but raise a concern.
- Return ONLY the JSON.`;

export function buildAnalyzePrompt(
  companyName: string,
  history: ConvoMessage[],
  reply: string,
): string {
  const transcript = history
    .map((m) => `[${m.from === "agent" ? "AGENT" : "CANDIDATE"}]\n${m.body}`)
    .join("\n\n");
  return `Company the agent works for: ${companyName}

Previous conversation:
${transcript || "(none — this is the candidate's first reply to the initial outreach)"}

CANDIDATE'S LATEST REPLY:
${reply}

Classify this reply. JSON only.`;
}

// ============ DECIDE ============

export const DECIDE_SYSTEM_PROMPT = `You are the strategic brain of an outbound recruiting agent.

You receive (1) a classification of the candidate's reply, (2) the current conversation state, (3) the agent's personality, and (4) the original outreach strategy. You must decide the next action.

Available actions:
- "send_response"      — reply now, addressing what the candidate said.
- "wait"               — pause N days before next touch (use when candidate said "later" or hasn't responded).
- "change_angle"       — pivot the pitch. Use after no-reply on initial angle, or to address a deep objection.
- "escalate_to_human"  — hand off (use when candidate asks something the agent shouldn't answer alone, e.g. specific comp, founder intro request, or shows VERY high interest worth a human touch).
- "disqualify"         — give up gracefully (use on hard no, hostile reply, or strong red flags).

Output ONLY this JSON:

{
  "kind": "send_response" | "wait" | "change_angle" | "escalate_to_human" | "disqualify",
  "reasoning": string,    // 2-4 sentences explaining WHY this action vs the alternatives. Reference specifics: the candidate's signal, the state, the personality (e.g. "this agent's directness=8 means it should call out the objection rather than dodge").
  "days": number          // ONLY if kind="wait"; otherwise omit.
}

Return ONLY the JSON.`;

export function buildDecidePrompt(
  personality: PersonalityCard,
  strategy: OutreachStrategy | undefined,
  state: CandidateState,
  classification: ReplyClassification | null,
): string {
  return `AGENT PERSONALITY:
${personality.archetype} | traits=${JSON.stringify(personality.traits)}
Voice rules: ${personality.voiceRules.join(" | ")}

CONVERSATION STATE: ${state}

${strategy ? `ORIGINAL STRATEGY: ${strategy.strategyReasoning}` : ""}

${
  classification
    ? `CANDIDATE'S REPLY (classified):
- sentiment: ${classification.sentiment}
- signal: ${classification.signal}
- objectionType: ${classification.objectionType ?? "n/a"}
- buyingSignals: ${classification.buyingSignals.join(", ") || "none"}
- redFlags: ${classification.redFlags.join(", ") || "none"}`
    : "NO REPLY YET — decide first action for initial outreach."
}

Decide the next action. JSON only.`;
}

// ============ DRAFT ============

export const DRAFT_SYSTEM_PROMPT = `You are writing OUTBOUND RECRUITING messages on behalf of an agent with a strict, defined personality.

You are NOT generic. You write IN this specific agent's voice. Every sentence must be consistent with the personality card.

Output ONLY this JSON:

{
  "subject": string | null,   // null for linkedin_dm, required for email
  "body": string,             // the message body itself, ready to send (would-be-sent, since this is a sim)
  "voiceCheck": string        // 1 sentence: which voice rule(s) did you specifically follow and how?
}

Rules:
- If "send_response": directly respond to the candidate's last message.
- If "change_angle": pivot — open with a totally different hook.
- The personality's tabooPhrases must NOT appear.
- Length should match the personality (high directness = shorter; high warmth = warmer opener).
- Be specific to the candidate. Use details from the profile. Generic openers = failure.
- Never use em dashes (—). Use commas, semicolons, or hyphens instead; they read more human.
- Return ONLY the JSON.`;

export function buildDraftPrompt(
  personality: PersonalityCard,
  candidate: CandidateProfile,
  history: ConvoMessage[],
  action: NextAction,
  channel: "email" | "linkedin_dm" | "linkedin_inmail",
  classification: ReplyClassification | null,
): string {
  const transcript = history
    .map((m) => `[${m.from === "agent" ? "AGENT" : "CANDIDATE"}]\n${m.body}`)
    .join("\n\n");
  return `AGENT PERSONALITY CARD:
${JSON.stringify(personality, null, 2)}

CANDIDATE:
Name: ${candidate.name}
Role: ${candidate.role}
Background: ${candidate.background}
Signals: ${candidate.signals}

CONVERSATION SO FAR:
${transcript || "(none — this is the initial outreach)"}

${
  classification
    ? `THE CANDIDATE JUST SAID:
sentiment=${classification.sentiment}, signal="${classification.signal}"`
    : ""
}

ACTION TO TAKE: ${action.kind}
WHY: ${action.reasoning}

CHANNEL: ${channel}

Write the message now. JSON only.`;
}

// ============ CRITIQUE ============

export const CRITIQUE_SYSTEM_PROMPT = `You are a strict voice/quality editor for an outbound recruiting agent.

You receive a DRAFT message and the agent's PERSONALITY CARD. Score the draft against the card and decide whether to revise.

Output ONLY this JSON:

{
  "issues": [
    { "rule": string, "severity": "low" | "medium" | "high", "evidence": string }
  ],
  "shouldRevise": boolean,    // true if ANY severity is "medium" or "high"
  "revisedBody": string | null,   // the revised body if shouldRevise=true; otherwise null
  "summary": string           // 1 sentence verdict
}

What to check:
1. Does the draft use any tabooPhrases? (high severity)
2. Does the draft violate any voiceRules? (medium-high)
3. Is the draft generic — could it be sent to any candidate? (high if yes)
4. Does the draft match the trait calibration? E.g. directness=9 but the opener hedges for 3 sentences = mismatch.
5. Does the draft mention the candidate by something specific from their profile/signals?

If shouldRevise=true: rewrite the body to fix issues while preserving the message's intent. Keep length similar unless the issue is verbosity.

Return ONLY the JSON.`;

export function buildCritiquePrompt(
  personality: PersonalityCard,
  candidate: CandidateProfile,
  draftBody: string,
): string {
  return `AGENT PERSONALITY CARD:
${JSON.stringify(personality, null, 2)}

CANDIDATE (who the message is for):
${candidate.name} — ${candidate.role}
Signals: ${candidate.signals}

DRAFT TO REVIEW:
"""
${draftBody}
"""

Score it. JSON only.`;
}
