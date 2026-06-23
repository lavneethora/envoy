import type { PersonalityCard } from "./personality";

export type CandidateProfile = {
  name: string;
  role: string;
  background: string;
  signals: string;
};

export type OutreachIntent =
  | "schedule_intro_call"
  | "gauge_interest"
  | "invite_to_event"
  | "referral_ask";

export type OutreachTouch = {
  index: number;
  channel: "email" | "linkedin_dm" | "linkedin_inmail";
  dayOffset: number;
  angle: string;
  hook: string;
  intent: string;
};

export type OutreachStrategy = {
  intent: OutreachIntent;
  strategyReasoning: string;
  touches: OutreachTouch[];
};

export const STRATEGY_SYSTEM_PROMPT = `You are an outbound recruiting strategist.

You are given (1) an agent personality card describing how this agent communicates, and (2) a candidate profile. You must design a 3-5 touch outreach sequence aimed at the stated intent.

Output ONLY a JSON object of this shape:

{
  "intent": "<the intent>",
  "strategyReasoning": string,   // 2-4 sentences explaining WHY this sequence beats a generic 4-step nudge for THIS candidate at THIS company. Reference specifics from both the personality and the candidate's signals.
  "touches": [
    {
      "index": 1,
      "channel": "email" | "linkedin_dm" | "linkedin_inmail",
      "dayOffset": 0,
      "angle": string,    // the strategic angle — e.g. "lead with the technical problem, not the company"
      "hook": string,     // the concrete hook to open with — must be specific to candidate, not template
      "intent": string    // what this touch is trying to achieve
    },
    ...
  ]
}

Rules:
- Sequence must escalate or pivot based on no-response. Don't just repeat with "bumping this up".
- The agent's personality MUST be reflected: a high-directness agent opens with the ask; a high-warmth agent opens with curiosity.
- Vary channels if it makes sense (mix email and LinkedIn).
- Day offsets should be realistic (0, 3, 8, 14, ...).
- Return ONLY the JSON.`;

export function buildStrategyUserPrompt(
  personality: PersonalityCard,
  candidate: CandidateProfile,
  intent: OutreachIntent,
): string {
  return `AGENT PERSONALITY:
Name: ${personality.agentName}
Archetype: ${personality.archetype}
Traits: ${JSON.stringify(personality.traits)}
Voice rules: ${personality.voiceRules.join(" | ")}
Signature moves: ${personality.signatureMoves.join(" | ")}

COMPANY (the agent works for):
${personality.companyContext.name} — ${personality.companyContext.oneLiner}

CANDIDATE:
Name: ${candidate.name}
Current role: ${candidate.role}
Background: ${candidate.background}
Signals (why they might be a fit / what we noticed): ${candidate.signals}

INTENT: ${intent}

Design the sequence. JSON only.`;
}

export const INTENT_LABELS: Record<OutreachIntent, string> = {
  schedule_intro_call: "Schedule a 15-min intro call",
  gauge_interest: "Gauge interest (no specific ask)",
  invite_to_event: "Invite to event / dinner",
  referral_ask: "Ask for a referral",
};
