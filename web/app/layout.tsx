import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { CursorGlow } from "@/components/cursor-glow";
import { ScrollToTop } from "@/components/scroll-to-top";

export const metadata: Metadata = {
  title: { default: "Pocketbase", template: "%s | Pocketbase" },
  description: "Complete Pokémon database — all 1025 Pokémon with stats, moves, abilities, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(t==='dark'||(t!=='light'&&d))document.documentElement.classList.add('dark')})()` }} />
      </head>
      <body>
        <CursorGlow />
        <ScrollToTop />
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
