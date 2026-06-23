export type CandidateState =
  | "NOT_CONTACTED"
  | "INITIAL_SENT"
  | "AWAITING_REPLY"
  | "REPLIED_INTERESTED"
  | "REPLIED_OBJECTION"
  | "REPLIED_QUESTION"
  | "REPLIED_NEGATIVE"
  | "REPLIED_NEEDS_TIME"
  | "DISQUALIFIED"
  | "ESCALATED";

export type NextAction =
  | { kind: "send_response"; reasoning: string }
  | { kind: "wait"; days: number; reasoning: string }
  | { kind: "change_angle"; reasoning: string }
  | { kind: "escalate_to_human"; reasoning: string }
  | { kind: "disqualify"; reasoning: string };

export type ReplyClassification = {
  sentiment: "positive" | "neutral" | "objection" | "negative" | "deferring";
  signal: string; // 1 sentence: what is the candidate actually saying?
  objectionType: string | null; // null if not an objection
  buyingSignals: string[]; // explicit signals of interest if any
  redFlags: string[];
};

export const STATE_LABELS: Record<CandidateState, string> = {
  NOT_CONTACTED: "Not contacted",
  INITIAL_SENT: "Initial sent",
  AWAITING_REPLY: "Awaiting reply",
  REPLIED_INTERESTED: "Interested",
  REPLIED_OBJECTION: "Objection",
  REPLIED_QUESTION: "Question",
  REPLIED_NEGATIVE: "Negative",
  REPLIED_NEEDS_TIME: "Needs time",
  DISQUALIFIED: "Disqualified",
  ESCALATED: "Escalated to human",
};

export const STATE_COLORS: Record<CandidateState, string> = {
  NOT_CONTACTED: "bg-zinc-200 text-zinc-700",
  INITIAL_SENT: "bg-blue-100 text-blue-800",
  AWAITING_REPLY: "bg-amber-100 text-amber-800",
  REPLIED_INTERESTED: "bg-emerald-100 text-emerald-800",
  REPLIED_OBJECTION: "bg-orange-100 text-orange-800",
  REPLIED_QUESTION: "bg-sky-100 text-sky-800",
  REPLIED_NEGATIVE: "bg-rose-100 text-rose-800",
  REPLIED_NEEDS_TIME: "bg-purple-100 text-purple-800",
  DISQUALIFIED: "bg-zinc-200 text-zinc-500 line-through",
  ESCALATED: "bg-indigo-100 text-indigo-800",
};

export function classificationToState(c: ReplyClassification): CandidateState {
  if (c.sentiment === "negative") return "REPLIED_NEGATIVE";
  if (c.sentiment === "objection") return "REPLIED_OBJECTION";
  if (c.sentiment === "deferring") return "REPLIED_NEEDS_TIME";
  if (c.sentiment === "positive") return "REPLIED_INTERESTED";
  // neutral with a question
  return "REPLIED_QUESTION";
}

export function validActionsFor(state: CandidateState): NextAction["kind"][] {
  switch (state) {
    case "REPLIED_INTERESTED":
      return ["send_response", "escalate_to_human"];
    case "REPLIED_QUESTION":
      return ["send_response", "escalate_to_human"];
    case "REPLIED_OBJECTION":
      return ["send_response", "change_angle", "disqualify"];
    case "REPLIED_NEGATIVE":
      return ["disqualify", "send_response"];
    case "REPLIED_NEEDS_TIME":
      return ["wait", "send_response"];
    case "AWAITING_REPLY":
      return ["wait", "change_angle"];
    default:
      return ["send_response", "wait"];
  }
}
