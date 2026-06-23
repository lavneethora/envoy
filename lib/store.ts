"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PersonalityCard } from "./agent/personality";
import type { CandidateProfile, OutreachStrategy, OutreachIntent } from "./agent/strategy";
import type { CandidateState, ReplyClassification, NextAction } from "./agent/state-machine";

export type Message = {
  id: string;
  from: "agent" | "candidate";
  channel: "email" | "linkedin_dm" | "linkedin_inmail" | "sim";
  body: string;
  draftV1?: string;
  critiqueNotes?: string;
  createdAt: number;
};

export type ReasoningStep = {
  kind: "analyze" | "decide" | "draft" | "critique";
  title: string;
  body: string;
  data?: unknown;
  durationMs?: number;
};

export type ReasoningTrace = {
  id: string;
  triggeredBy: string; // "initial" | "reply: <truncated>"
  steps: ReasoningStep[];
  createdAt: number;
};

export type Candidate = {
  id: string;
  profile: CandidateProfile;
  intent: OutreachIntent;
  strategy?: OutreachStrategy;
  state: CandidateState;
  stateHistory: { state: CandidateState; at: number }[];
  messages: Message[];
  traces: ReasoningTrace[];
  lastClassification?: ReplyClassification;
  lastAction?: NextAction;
};

type StoreState = {
  personality: PersonalityCard | null;
  candidates: Record<string, Candidate>;
  setPersonality: (p: PersonalityCard | null) => void;
  upsertCandidate: (c: Candidate) => void;
  patchCandidate: (id: string, patch: Partial<Candidate>) => void;
  resetAll: () => void;
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      personality: null,
      candidates: {},
      setPersonality: (p) => set({ personality: p, candidates: p ? {} : {} }),
      upsertCandidate: (c) =>
        set((s) => ({ candidates: { ...s.candidates, [c.id]: c } })),
      patchCandidate: (id, patch) =>
        set((s) => {
          const existing = s.candidates[id];
          if (!existing) return s;
          return { candidates: { ...s.candidates, [id]: { ...existing, ...patch } } };
        }),
      resetAll: () => set({ personality: null, candidates: {} }),
    }),
    { name: "psview-agent-store" },
  ),
);
