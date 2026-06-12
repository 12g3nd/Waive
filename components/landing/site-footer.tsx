import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-ink px-6 py-10 sm:px-10">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-start justify-between gap-8">
        <div>
          <Link href="/" className="group" aria-label="Waive home">
            <Wordmark tone="light" className="text-lg" />
          </Link>
          <p className="mt-1 text-sm text-white/40">Know your rights. Use them.</p>
          <p className="mt-4 font-mono text-[11px] tracking-wide text-white/25">
            One engine · pluggable rule packs · every claim cited
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-sm" aria-label="Footer">
          <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wider text-white/30">
            Learn more
          </p>
          <Link href="/how-the-ai-works" className="text-white/55 transition-colors hover:text-white/90">
            How the AI works
          </Link>
          <Link href="/#coverage" className="text-white/55 transition-colors hover:text-white/90">
            Coverage
          </Link>
          <Link href="/app" className="text-white/55 transition-colors hover:text-white/90">
            Open the tool
          </Link>
        </nav>

        <p className="max-w-md border-l-2 border-white/10 pl-4 text-left text-xs leading-relaxed text-white/35">
          Information and document preparation only, not legal advice. No attorney-client
          relationship is formed. Always consult a qualified attorney for your specific situation.
        </p>
      </div>
    </footer>
  );
}
