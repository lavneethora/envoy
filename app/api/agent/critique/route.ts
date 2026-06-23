import { NextResponse } from "next/server";
import { anthropic, extractJSON, MODEL } from "@/lib/anthropic";
import { CRITIQUE_SYSTEM_PROMPT, buildCritiquePrompt } from "@/lib/agent/reasoning";
import type { PersonalityCard } from "@/lib/agent/personality";
import type { CandidateProfile } from "@/lib/agent/strategy";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  personality: PersonalityCard;
  candidate: CandidateProfile;
  draftBody: string;
};

type CritiqueOut = {
  issues: { rule: string; severity: "low" | "medium" | "high"; evidence: string }[];
  shouldRevise: boolean;
  revisedBody: string | null;
  summary: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.personality || !body?.draftBody) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1536,
      temperature: 0.3,
      system: CRITIQUE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildCritiquePrompt(body.personality, body.candidate, body.draftBody),
        },
      ],
    });

    const critique = extractJSON<CritiqueOut>(message);
    return NextResponse.json({ critique });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
