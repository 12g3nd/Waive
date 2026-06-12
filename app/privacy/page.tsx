import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Database, Eye, Server, ShieldCheck } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { SiteFooter } from "@/components/landing/site-footer";

export const metadata: Metadata = {
  title: "Privacy notice — Ollama (Waive API)",
  description:
    "How the Waive Ollama API handles your notice: nothing is stored, logged, or collected. Processed in memory, then discarded.",
};

const PROMISES = [
  {
    icon: Database,
    title: "Nothing is stored",
    body: "Your notice and the text read from it are held in memory only for the seconds it takes to answer. They are never written to a database, a disk, or a log.",
  },
  {
    icon: Eye,
    title: "Nothing is collected",
    body: "We don't build a profile, attach your upload to an account, or keep the questions you ask. There is no analytics pixel tied to the contents of your letter.",
  },
  {
    icon: Server,
    title: "Waive's own server",
    body: "The Waive Ollama API runs on infrastructure Waive controls — not a third-party AI vendor. Your notice is not sent to Anthropic, OpenAI, or anyone else on this option.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div aria-hidden className="h-0.5 bg-highlight" />
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3 sm:px-8">
          <Link href="/" className="group inline-flex items-center gap-1.5" aria-label="Waive — home">
            <ArrowLeft className="size-3.5 text-muted-foreground" />
            <Wordmark className="text-lg" />
          </Link>
          <Link
            href="/app"
            className="group inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110"
          >
            Open the tool
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 sm:px-8">
        <p className="eyebrow mb-5 text-primary">Privacy</p>
        <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
          The Waive Ollama API keeps your notice to itself
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          When you pick <strong>Ollama (Waive API)</strong>, your notice is read by an Ollama model
          running on Waive's own server. It's the private default: slower than a commercial API, but
          nothing you send is stored, logged, or collected.
        </p>

        <section className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {PROMISES.map((p) => (
            <article key={p.title} className="rounded-2xl border border-border bg-card p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <p.icon className="size-5" aria-hidden />
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold text-foreground">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-2xl border-2 border-primary/25 bg-primary/[0.06] p-7">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                Want zero network entirely?
              </h2>
              <p className="mt-2 leading-relaxed text-foreground/80">
                Choose <strong>Ollama (Local)</strong> instead and the model runs on your own
                computer — your notice never leaves your machine, not even to Waive. See the{" "}
                <Link href="/ollama-setup" className="font-semibold text-primary hover:underline">
                  set-up guide
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
          Both Ollama options are free to use — Waive provides the server. This page describes data
          handling only; Waive is information and document preparation, not legal advice.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
