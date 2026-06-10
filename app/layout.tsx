import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waive, stop losing by silence",
  description:
    "Waive reads an intimidating official notice and routes you to the escape hatch that already exists, before your deadline runs out. Information and document preparation, not legal advice.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set the theme class before first paint so there's no light-mode flash.
            Honors a saved choice, then falls back to the OS preference. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`,
          }}
        />
        {/* Fonts load at runtime with strong fallbacks, so the UI still works offline.
            Public Sans is the U.S. government's official typeface — fitting for a benefits tool. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
