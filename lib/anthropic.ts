import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("ANTHROPIC_API_KEY is not set — API routes will fail until it is.");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model IDs per Anthropic's current catalog.
// MODEL = primary reasoning/quality model. FAST_MODEL = cheap iteration model.
export const MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5";
export const FAST_MODEL = process.env.CLAUDE_FAST_MODEL ?? "claude-haiku-4-5";
// Note: override via env if these names rotate. Sonnet 4.5 ID per Anthropic SDK is
// "claude-sonnet-4-5"; Haiku 4.5 is "claude-haiku-4-5".

export function extractText(message: Anthropic.Messages.Message): string {
  return message.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export function extractJSON<T>(message: Anthropic.Messages.Message): T {
  const raw = extractText(message).trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf("{");
  const lastObj = candidate.lastIndexOf("}");
  const startArr = candidate.indexOf("[");
  const lastArr = candidate.lastIndexOf("]");
  const useArr = startArr !== -1 && (start === -1 || startArr < start);
  const sliced = useArr
    ? candidate.slice(startArr, lastArr + 1)
    : candidate.slice(start, lastObj + 1);
  return JSON.parse(sliced) as T;
}
