import { NextResponse } from "next/server";
import { anthropic, extractJSON, MODEL } from "@/lib/anthropic";
import {
  ANALYZE_SYSTEM_PROMPT,
  buildAnalyzePrompt,
  type ConvoMessage,
} from "@/lib/agent/reasoning";
import type { ReplyClassification } from "@/lib/agent/state-machine";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  companyName: string;
  history: ConvoMessage[];
  reply: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.reply || !body?.companyName) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0.3,
      system: ANALYZE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildAnalyzePrompt(body.companyName, body.history, body.reply),
        },
      ],
    });

    const classification = extractJSON<ReplyClassification>(message);
    return NextResponse.json({ classification });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
