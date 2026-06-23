import Link from "next/link";
import { IntroSplash } from "@/components/IntroSplash";
import { SplineScene } from "@/components/ui/splite";

const FEATURES = [
  {
    n: "01",
    title: "Personality, synthesised",
    body:
      "Structured traits — formality, warmth, directness, technical depth, humor — derived from company context and injected into every decision.",
  },
  {
    n: "02",
    title: "A real state machine",
    body:
      "AWAITING → REPLIED:objection → DECIDE: change_angle. The agent operates on states, not vibes.",
  },
  {
    n: "03",
    title: "Visible reasoning",
    body:
      "Every reply triggers ANALYZE → DECIDE → DRAFT → CRITIQUE. You see the agent think — and revise itself when it slips.",
  },
];

export default function Home() {
  return (
    <>
      <IntroSplash />
      <div id="landing-main">
        {/* Hero — text on the left, interactive 3D robot on the right */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-2 px-6 pt-28 pb-16 lg:min-h-[620px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
            {/* Left — text */}
            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-2 text-xs text-emerald-400 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono tracking-wide">Envoy · All Systems Operational</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
                An outbound agent
                <br />
                that{" "}
                <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                  reasons
                </span>
                , not just generates.
              </h1>

              <p className="mt-6 text-lg text-zinc-400 max-w-xl leading-relaxed">
                Feed it a company. It synthesises a personality. It plans a sequence. It
                reads candidate replies, classifies them, decides a next action, drafts a
                response, critiques itself — all in front of you.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/configure"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-500 px-5 text-sm font-medium text-zinc-950 hover:bg-emerald-400 transition-colors"
                >
                  Configure an agent →
                </Link>
                <Link
                  href="/agent"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-800 px-5 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors"
                >
                  See current agent
                </Link>
              </div>
            </div>

            {/* Right — interactive 3D robot, beside the text */}
            <div className="relative h-[320px] w-full lg:h-[560px]">
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="h-full w-full"
              />
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <div className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((card) => (
            <div
              key={card.n}
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5"
            >
              <div className="font-mono text-xs text-emerald-400 mb-2">{card.n}</div>
              <h3 className="font-medium text-zinc-100">{card.title}</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
