export const runtime = "edge";

import type { Metadata } from "next";
import { fetchNatureList } from "@/lib/api";
import { capitalize } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nature Dex" };

const STAT_LABEL: Record<string, string> = {
  attack: "Atk", defense: "Def", "special-attack": "S.Atk",
  "special-defense": "S.Def", speed: "Spd",
};

function statLabel(s?: string) {
  if (!s) return null;
  return STAT_LABEL[s] ?? capitalize(s);
}

export default async function NaturesPage() {
  const natures = await fetchNatureList();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">Nature Dex</h1>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 sm:hidden">
        {natures.map((n) => {
          const neutral = !n.increased_stat && !n.decreased_stat;
          const inc = statLabel(n.increased_stat);
          const dec = statLabel(n.decreased_stat);
          return (
            <div
              key={n.name}
              className="rounded-2xl border border-white/30 dark:border-white/10 px-4 py-3"
              style={{ background: "var(--glass-bg)" }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {n.names.en ?? capitalize(n.name)}
                  </span>
                  {n.names.ja && (
                    <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">{n.names.ja}</span>
                  )}
                </div>
                {neutral && (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">Neutral</span>
                )}
              </div>
              {!neutral && (
                <div className="flex gap-4 text-sm mt-1">
                  <span className="font-semibold text-green-600 dark:text-green-400">↑ {inc}</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">↓ {dec}</span>
                  {n.likes_flavor && (
                    <span className="text-zinc-500 dark:text-zinc-400 capitalize ml-auto text-xs">
                      ♥ {n.likes_flavor} / ✕ {n.hates_flavor}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-2xl border border-white/40 dark:border-white/10 overflow-hidden backdrop-blur-md" style={{ background: "var(--glass-bg)" }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide border-b border-white/40 dark:border-white/10" style={{ background: "var(--glass-strong)" }}>
              <th className="px-4 py-2 text-left">Nature</th>
              <th className="px-4 py-2 text-left">Japanese</th>
              <th className="px-4 py-2 text-center text-green-700 dark:text-green-400">+10% Stat</th>
              <th className="px-4 py-2 text-center text-red-700 dark:text-red-400">−10% Stat</th>
              <th className="px-4 py-2 text-center">Likes Flavor</th>
              <th className="px-4 py-2 text-center">Hates Flavor</th>
            </tr>
          </thead>
          <tbody>
            {natures.map((n) => {
              const neutral = !n.increased_stat && !n.decreased_stat;
              return (
                <tr key={n.name} className="border-b border-white/20 dark:border-white/10 last:border-0 hover:bg-white/20 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-2.5 font-semibold text-zinc-900 dark:text-zinc-100">
                    {n.names.en ?? capitalize(n.name)}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400 dark:text-zinc-500 text-xs">{n.names.ja ?? "—"}</td>
                  <td className="px-4 py-2.5 text-center">
                    {neutral ? <span className="text-zinc-400 dark:text-zinc-600">—</span>
                      : <span className="font-semibold text-green-700 dark:text-green-400">{statLabel(n.increased_stat) ?? "—"}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {neutral ? <span className="text-zinc-400 dark:text-zinc-600">—</span>
                      : <span className="font-semibold text-red-700 dark:text-red-400">{statLabel(n.decreased_stat) ?? "—"}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center text-zinc-600 dark:text-zinc-300 capitalize">{n.likes_flavor ?? "—"}</td>
                  <td className="px-4 py-2.5 text-center text-zinc-600 dark:text-zinc-300 capitalize">{n.hates_flavor ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
