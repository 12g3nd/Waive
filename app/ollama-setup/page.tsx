import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Download, TerminalSquare, Wifi, CheckCircle2 } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { SiteFooter } from "@/components/landing/site-footer";

export const metadata: Metadata = {
  title: "Set up Ollama (Local): run Waive's AI on your own computer",
  description:
    "A short guide to installing Ollama and pulling a model so Waive's 'Ollama (Local)' option works, so your notice never leaves your machine.",
};

const STEPS = [
  {
    icon: Download,
    title: "1. Install Ollama",
    body: (
      <>
        Download the installer for macOS, Windows, or Linux from{" "}
        <a
          href="https://ollama.com/download"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary hover:underline"
        >
          ollama.com/download
        </a>{" "}
        and run it. Once installed, Ollama runs quietly in the background at{" "}
        <code className="rounded bg-secondary/50 px-1 py-0.5 font-mono text-[0.85em]">
          http://localhost:11434
        </code>
        .
      </>
    ),
  },
  {
    icon: TerminalSquare,
    title: "2. Pull a model",
    body: (
      <>
        Open a terminal and download a vision model (to read the letter) and a text model (to
        explain it). These run on your own hardware:
        <span className="mt-3 block space-y-1.5">
          <code className="block rounded-lg border border-border bg-secondary/40 px-3 py-2 font-mono text-[0.8rem] text-foreground/80">
            ollama pull llama3.2-vision
          </code>
          <code className="block rounded-lg border border-border bg-secondary/40 px-3 py-2 font-mono text-[0.8rem] text-foreground/80">
            ollama pull llama3.2
          </code>
        </span>
      </>
    ),
  },
  {
    icon: CheckCircle2,
    title: "3. Pick “Ollama (Local)”",
    body: (
      <>
        Come back to{" "}
        <Link href="/app" className="font-semibold text-primary hover:underline">
          the tool
        </Link>
        , and the <strong>Ollama (Local)</strong> option will switch from dimmed to selectable.
        Waive auto-detects the running server. Choose it and drop your notice in.
      </>
    ),
  },
];

export default function OllamaSetupPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div aria-hidden className="h-0.5 bg-highlight" />
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3 sm:px-8">
          <Link href="/" className="group inline-flex items-center gap-1.5" aria-label="Waive home">
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
        <p className="eyebrow mb-5 text-primary">Set-up guide</p>
        <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
          Run Waive's AI on your own computer
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          The <strong>Ollama (Local)</strong> option is for the privacy-conscious and technical: the
          model runs entirely on your machine, so your notice never leaves it, not even to Waive.
          It takes about five minutes to set up, and it's free.
        </p>

        <section className="mt-10 space-y-5">
          {STEPS.map((step) => (
            <article
              key={step.title}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-2.5">
            <Wifi className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm leading-relaxed text-foreground/80">
              <strong>No local model handy?</strong> The default{" "}
              <Link href="/privacy" className="font-semibold text-primary hover:underline">
                Ollama (Waive API)
              </Link>{" "}
              option needs zero set-up and still stores nothing about your notice. Local just removes
              the network step entirely. Either way, your deadline is computed by tested code, not the
              model.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
