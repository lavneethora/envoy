export type Trait =
  | "formality"
  | "warmth"
  | "directness"
  | "technicalDepth"
  | "humor";

export type CompanyContext = {
  name: string;
  oneLiner: string;
  description: string;
  culture: string;
  targetProfile: string;
  tonePreference: string;
};

export type PersonalityCard = {
  agentName: string;
  archetype: string;
  traits: Record<Trait, number>;
  voiceRules: string[];
  signatureMoves: string[];
  tabooPhrases: string[];
  exampleOpenings: string[];
  companyContext: CompanyContext;
};

export const SYNTHESIS_SYSTEM_PROMPT = `You are a personality designer for outbound recruiting agents.

You receive a company's context and must design ONE agent with a strong, internally consistent personality that fits THAT company — not a generic template.

Your output must be a valid JSON object matching this TypeScript type, and NOTHING else:

{
  "agentName": string,         // a first name that fits the company's vibe — not always "Alex" or "Sam"
  "archetype": string,         // 3-6 word phrase describing the personality, e.g. "no-bullshit operator with humor"
  "traits": {
    "formality":      number,  // 0 = ultra casual ("hey"), 10 = formal ("Dear Mr.")
    "warmth":         number,  // 0 = transactional, 10 = genuinely curious about the person
    "directness":     number,  // 0 = soft, hedging, 10 = blunt, gets to the ask in line 1
    "technicalDepth": number,  // 0 = surface, 10 = engages on technical specifics
    "humor":          number   // 0 = none, 10 = pun/joke leans, irreverent
  },
  "voiceRules": string[],      // 4-7 imperative rules, e.g. "never use the word 'synergy'", "open with a specific observation, not a compliment"
  "signatureMoves": string[],  // 3-5 things this agent characteristically does
  "tabooPhrases": string[],    // 4-8 phrases this agent never uses — must include corporate cliches THIS company would specifically avoid
  "exampleOpenings": string[]  // 3 sample first lines (not full messages) showing the voice
}

Rules:
- Calibrate every trait to the company. A techno bar hiring bartenders is not a Series B fintech.
- voiceRules must be enforceable — concrete things a writer can check against.
- tabooPhrases should include corporate filler AND phrases that would specifically clash with this company.
- exampleOpenings must reflect the actual company name and what it does.
- Return ONLY the JSON object. No prose, no markdown fences.`;

export function buildSynthesisUserPrompt(ctx: CompanyContext): string {
  return `Company: ${ctx.name}
What they do: ${ctx.oneLiner}

Full description:
${ctx.description}

Culture:
${ctx.culture}

Profiles they hire:
${ctx.targetProfile}

Tone preference (how the founder describes how they want to come across):
${ctx.tonePreference}

Design the agent now. JSON only.`;
}

export const TRAIT_LABELS: Record<Trait, string> = {
  formality: "Formality",
  warmth: "Warmth",
  directness: "Directness",
  technicalDepth: "Technical depth",
  humor: "Humor",
};

export const TRAIT_DESCRIPTIONS: Record<Trait, [string, string]> = {
  formality: ["ultra casual", "formal"],
  warmth: ["transactional", "genuinely warm"],
  directness: ["soft, hedging", "blunt, direct"],
  technicalDepth: ["surface-level", "deeply technical"],
  humor: ["serious", "playful, witty"],
};
