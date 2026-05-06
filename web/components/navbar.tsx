import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Pokédex" },
  { href: "/moves", label: "Moves" },
  { href: "/abilities", label: "Abilities" },
  { href: "/types", label: "Types" },
  { href: "/items", label: "Items" },
  { href: "/natures", label: "Natures" },
  { href: "/team", label: "Team" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/20 dark:border-white/10 bg-white/40 dark:bg-zinc-950/50 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
          <span className="text-xl">⊙</span>
          <span>Pocketbase</span>
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white transition-colors"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
