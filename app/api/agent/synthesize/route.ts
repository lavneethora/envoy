import { NextResponse } from "next/server";
import { anthropic, extractJSON, MODEL } from "@/lib/anthropic";
import {
  SYNTHESIS_SYSTEM_PROMPT,
  buildSynthesisUserPrompt,
  type CompanyContext,
  type PersonalityCard,
} from "@/lib/agent/personality";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const ctx = (await req.json()) as CompanyContext;
    if (!ctx?.name || !ctx?.description) {
      return NextResponse.json(
        { error: "Missing company name or description." },
        { status: 400 },
      );
    }

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      temperature: 0.7,
      system: SYNTHESIS_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildSynthesisUserPrompt(ctx) }],
    });

    const raw = extractJSON<Omit<PersonalityCard, "companyContext">>(message);
    const personality: PersonalityCard = { ...raw, companyContext: ctx };
    return NextResponse.json({ personality });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
