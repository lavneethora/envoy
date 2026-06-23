import { NextResponse } from "next/server";
import { anthropic, extractJSON, MODEL } from "@/lib/anthropic";
import {
  STRATEGY_SYSTEM_PROMPT,
  buildStrategyUserPrompt,
  type CandidateProfile,
  type OutreachIntent,
  type OutreachStrategy,
} from "@/lib/agent/strategy";
import type { PersonalityCard } from "@/lib/agent/personality";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  personality: PersonalityCard;
  candidate: CandidateProfile;
  intent: OutreachIntent;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.personality || !body?.candidate || !body?.intent) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      temperature: 0.65,
      system: STRATEGY_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildStrategyUserPrompt(body.personality, body.candidate, body.intent),
        },
      ],
    });

    const strategy = extractJSON<OutreachStrategy>(message);
    return NextResponse.json({ strategy });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
