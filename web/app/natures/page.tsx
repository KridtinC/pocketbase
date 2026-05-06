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
  if (!s) return "—";
  return STAT_LABEL[s] ?? capitalize(s);
}

export default async function NaturesPage() {
  const natures = await fetchNatureList();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">Nature Dex</h1>

      <div className="rounded-2xl border border-white/40 dark:border-white/10 overflow-hidden backdrop-blur-md" style={{ background: "var(--glass-bg)" }}>
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
                    {neutral ? (
                      <span className="text-zinc-400 dark:text-zinc-600">—</span>
                    ) : (
                      <span className="font-semibold text-green-700 dark:text-green-400">{statLabel(n.increased_stat)}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {neutral ? (
                      <span className="text-zinc-400 dark:text-zinc-600">—</span>
                    ) : (
                      <span className="font-semibold text-red-700 dark:text-red-400">{statLabel(n.decreased_stat)}</span>
                    )}
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
