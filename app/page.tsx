export default function HomePage() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-6 py-16 text-center">
      <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
        Backstop engine · scaffolding
      </span>
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
        Waive
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        The engine that stops people from losing by silence. An official notice +
        a short deadline + a hidden remedy &rarr; we find the escape hatch before
        the clock runs out.
      </p>
      <p className="text-sm text-muted-foreground">
        Phase&nbsp;0 scaffold is live. The transformation-reveal flow lands in
        Phase&nbsp;4.
      </p>
      <p className="max-w-md text-xs text-muted-foreground/80">
        Information and document preparation, not legal advice.
      </p>
    </main>
  );
}
