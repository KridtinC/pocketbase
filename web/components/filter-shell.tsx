"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";

interface FilterShellProps {
  /** e.g. "24 / 1025 Pokémon" — shown in the collapsed bar */
  countLabel?: string;
  /** How many filters are currently non-default (shows a dot on the button) */
  activeFilters?: number;
  children: React.ReactNode;
}

export function FilterShell({ countLabel, activeFilters = 0, children }: FilterShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-3xl border border-white/40 dark:border-white/10 shadow-md backdrop-blur-xl px-4 py-3 bg-white/40 dark:bg-zinc-900/50">
      {/* Always-visible header row */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 min-h-[1.25rem]">
          {countLabel ?? ""}
        </span>
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 bg-white/60 dark:bg-zinc-800/60 hover:bg-white/80 dark:hover:bg-zinc-700/60 active:scale-95 transition-all"
        >
          <SlidersHorizontal size={13} />
          Filters
          <ChevronDown
            size={13}
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
          {activeFilters > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
          )}
        </button>
      </div>

      {/* Collapsible filter body */}
      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? "mt-3 max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
