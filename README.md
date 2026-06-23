# PSVIEW Agent

**Live demo:** https://psview-agent-test.vercel.app
**Repo:** https://github.com/lavneethora/psview-agent

An outbound recruiting agent that **reasons** — not a prompt wrapper. Built as the PSVIEW
founding-engineer technical test.

> Feed it a company. It synthesises a personality. It plans a sequence. It reads candidate
> replies, classifies them, decides a next action, drafts a response, critiques itself —
> all in front of you.

---

## What I built

A Next.js web app with three flows:

1. **Configure** (`/configure`) — A form for company context. On submit the agent calls
   Claude to **synthesise a personality card** — a structured object with traits
   (formality, warmth, directness, technical depth, humor), voice rules, signature moves,
   taboo phrases, and example openings — derived specifically from the company.
2. **Agent** (`/agent`) — Renders the personality card visually (trait meters, voice
   rules, dos and don'ts). This card is the agent's identity; it is injected into every
   downstream LLM call.
3. **Candidate** (`/candidate/new`, `/candidate/[id]`) — Add a candidate, watch the agent
   plan a multi-touch sequence (with explicit `strategy_reasoning`), generate the initial
   outreach, and then **simulate replies by hand** to watch the reactive reasoning loop
   fire.

The agent never sends anything. The test area shows the drafted messages and the
reasoning behind every one.

## What makes it intelligent and not just an LLM call

> **The agent operates as an explicit state machine with a four-step reasoning loop —
> `ANALYZE → DECIDE → DRAFT → CRITIQUE` — on every candidate reply, with structured
> personality traits injected at every step. The same candidate input produces visibly
> different actions depending on conversation state and personality, and every decision
> is shown in the UI, not hidden behind a single prompt.**

Concretely:

- **Structured personality, not free-form prompt.** The personality is a typed JSON
  object. Each downstream call (strategy, analyze, decide, draft, critique) consumes that
  object — not a paragraph the LLM has to re-interpret. This is what keeps the voice
  consistent across turns.
- **A real state machine.** Each candidate has a state: `NOT_CONTACTED →
  INITIAL_SENT → AWAITING_REPLY → REPLIED_{INTERESTED,OBJECTION,QUESTION,NEGATIVE,NEEDS_TIME}
  → DISQUALIFIED | ESCALATED`. Allowed actions per state are constrained in code
  (`lib/agent/state-machine.ts`). The LLM picks between the allowed actions; it doesn't
  invent them.
- **Self-critique with revision.** After drafting, a separate Claude call scores the
  draft against the personality card. If issues are medium/high severity, it rewrites.
  The UI shows both v1 and v2 — proof the agent is judging itself, not just generating.
- **Visible reasoning trace.** Every reasoning loop renders step-by-step in the UI with
  the underlying classification, decision, and critique JSON exposed. You can see why an
  objection led to `change_angle` and not `disqualify`.

## Stack & choices

- **Next.js 16 (App Router)** + TypeScript + Tailwind 4 — single deploy, server-side API
  routes keep the Anthropic key off the client.
- **Anthropic Claude** — Sonnet 4.5 for quality reasoning; configurable via env.
- **Zustand + localStorage** — no DB needed for a single-reviewer demo. Personality and
  candidate state survive refreshes. Trivial upgrade path to Vercel KV / Postgres.
- **No auth, no real channel integration.** The brief says "simulate by hand". I
  resisted scope creep — every hour spent on auth or LinkedIn integration is an hour not
  spent on what's actually being tested: the agent's intelligence.

Trade-offs I'd revisit with more time:
- Server-side streaming would make the reasoning trace feel even more alive. Currently
  the client orchestrates four sequential calls — already feels good (each step appears
  as it completes), but a single streaming endpoint would shave latency.
- The state machine and prompts have been tuned for English-language B2B outreach. Voice
  consistency across other languages would need additional voice-rule scaffolding.

## Run it locally

```bash
git clone https://github.com/lavneethora/psview-agent.git
cd psview-agent
npm install
cp .env.example .env.local
# edit .env.local — add your ANTHROPIC_API_KEY
npm run dev
# open http://localhost:3000
```

You'll need an Anthropic API key with billing enabled. The default models are
`claude-sonnet-4-5` (reasoning) and `claude-haiku-4-5` (cheap iteration). Override via
`CLAUDE_MODEL` / `CLAUDE_FAST_MODEL` in `.env.local` if names rotate.

## How to walk through the demo (under 3 minutes)

1. Hit `/configure`. Click "PSVIEW (meta)" for a pre-filled context, or paste your own.
   Submit — wait ~5–8s for personality synthesis.
2. You land on `/agent`. Look at the trait meters, voice rules, taboo phrases. This was
   derived from your context, not configured.
3. Click "Add a candidate". Pick "Founding-engineer candidate (Maya)" for quick-fill,
   pick intent "Schedule a 15-min intro call". Submit.
4. You land on `/candidate/<id>`. Read the **strategy reasoning** — it references the
   candidate's specific signals, not generic template logic.
5. Click "Generate initial outreach". Watch the 3-step trace (DECIDE → DRAFT → CRITIQUE)
   appear. If the critique flags issues, you'll see v1 and v2.
6. Simulate a reply: e.g. _"I'm flattered but I literally just joined Linear 4 months
   ago"_. Watch the full 4-step trace: ANALYZE classifies it (probably `objection`,
   objectionType=`wrong_timing`), DECIDE chooses an action (probably `wait` or
   `change_angle`), DRAFT writes the response or skips, CRITIQUE checks voice
   consistency.
7. Try a different reply to the same message: _"Sure — what's the comp band?"_. Watch
   the agent take a totally different path. **Same agent, different action depending on
   the candidate's actual signal.**
8. (Bonus) Go back to `/configure`, switch to "Berlin techno bar", and re-run the same
   candidate. The agent will write _visibly_ differently — different vocabulary,
   structure, hook, length.

## Project layout

```
app/
  page.tsx                    # landing
  configure/                  # company context form
  agent/                      # personality card view + candidate list
  candidate/[id]/             # the centerpiece — reasoning loop UI
  api/
    agent/synthesize/         # personality from context
    agent/analyze/            # classify a candidate reply
    agent/decide/             # pick next action from state + classification
    agent/draft/              # write a message in personality
    agent/critique/           # self-review + revise
    candidate/strategy/       # plan multi-touch sequence
components/
  PersonalityCard.tsx         # trait meters + voice rules
  ReasoningTrace.tsx          # step-by-step thinking display
  StateBadge.tsx              # state pill + history strip
  TraitMeter.tsx
lib/
  agent/
    personality.ts            # types, synthesis prompt
    strategy.ts               # outreach plan types, prompt
    state-machine.ts          # states, transitions, actions
    reasoning.ts              # analyze/decide/draft/critique prompts
  anthropic.ts                # SDK client + JSON extraction
  store.ts                    # zustand + localStorage persistence
  utils.ts
```

## Deployment

Deployed on Vercel from the `main` branch. `ANTHROPIC_API_KEY` configured as a Vercel
environment variable. Build is `npm run build` — TypeScript check + static optimization
for marketing pages, with all `/api/*` routes running on Node serverless functions.

---

Built in ~18 hours by Lavneet Hora for PSVIEW.
