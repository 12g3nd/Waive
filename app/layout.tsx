import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waive — stop losing by silence",
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
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
