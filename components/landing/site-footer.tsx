import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-foreground px-6 py-8 sm:px-10">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between gap-6">
        <div>
          <Link href="/" className="font-display text-lg font-bold text-primary-foreground">
            W<span className="text-highlight">ai</span>ve
          </Link>
          <p className="mt-0.5 text-sm text-white/40">Know your rights. Use them.</p>
        </div>
        <p className="max-w-md text-right text-xs leading-relaxed text-white/30">
          Information and document preparation only, not legal advice. No attorney-client
          relationship is formed. Always consult a qualified attorney for your specific situation.
        </p>
      </div>
    </footer>
  );
}
