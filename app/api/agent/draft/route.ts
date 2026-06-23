import { NextResponse } from "next/server";
import { anthropic, extractJSON, MODEL } from "@/lib/anthropic";
import {
  DRAFT_SYSTEM_PROMPT,
  buildDraftPrompt,
  type ConvoMessage,
} from "@/lib/agent/reasoning";
import type { PersonalityCard } from "@/lib/agent/personality";
import type { CandidateProfile } from "@/lib/agent/strategy";
import type { NextAction, ReplyClassification } from "@/lib/agent/state-machine";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  personality: PersonalityCard;
  candidate: CandidateProfile;
  history: ConvoMessage[];
  action: NextAction;
  channel: "email" | "linkedin_dm" | "linkedin_inmail";
  classification: ReplyClassification | null;
};

type DraftOut = { subject: string | null; body: string; voiceCheck: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.personality || !body?.candidate || !body?.action) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1536,
      temperature: 0.8,
      system: DRAFT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildDraftPrompt(
            body.personality,
            body.candidate,
            body.history,
            body.action,
            body.channel,
            body.classification,
          ),
        },
      ],
    });

    const draft = extractJSON<DraftOut>(message);
    return NextResponse.json({ draft });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
