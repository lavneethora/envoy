import { NextResponse } from "next/server";
import { anthropic, extractJSON, MODEL } from "@/lib/anthropic";
import { DECIDE_SYSTEM_PROMPT, buildDecidePrompt } from "@/lib/agent/reasoning";
import type { PersonalityCard } from "@/lib/agent/personality";
import type { OutreachStrategy } from "@/lib/agent/strategy";
import type {
  CandidateState,
  NextAction,
  ReplyClassification,
} from "@/lib/agent/state-machine";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  personality: PersonalityCard;
  strategy?: OutreachStrategy;
  state: CandidateState;
  classification: ReplyClassification | null;
};

type DecideRaw = { kind: NextAction["kind"]; reasoning: string; days?: number };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.personality || !body?.state) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 768,
      temperature: 0.4,
      system: DECIDE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildDecidePrompt(
            body.personality,
            body.strategy,
            body.state,
            body.classification,
          ),
        },
      ],
    });

    const raw = extractJSON<DecideRaw>(message);
    const action: NextAction =
      raw.kind === "wait"
        ? { kind: "wait", days: raw.days ?? 3, reasoning: raw.reasoning }
        : { kind: raw.kind, reasoning: raw.reasoning } as NextAction;

    return NextResponse.json({ action });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
