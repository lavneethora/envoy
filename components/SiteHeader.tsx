import Link from "next/link";

const REPO_URL = "https://github.com/lavneethora/envoy";

export function SiteHeader() {
  return (
    <header className="sticky top-0 left-0 right-0 z-20 bg-background/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-base font-medium uppercase tracking-[0.25em] text-zinc-100 hover:text-emerald-400 transition-colors"
        >
          Envoy
        </Link>
        <nav className="flex items-center gap-5 text-xs text-zinc-400">
          <Link href="/configure" className="hover:text-zinc-100 transition-colors">
            Configure
          </Link>
          <Link href="/agent" className="hover:text-zinc-100 transition-colors">
            Agent
          </Link>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-100 transition-colors"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
