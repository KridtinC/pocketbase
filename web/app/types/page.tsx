export const runtime = "edge";

import type { Metadata } from "next";
import { fetchTypeList } from "@/lib/api";
import { TypeBadge } from "@/components/type-badge";
import { TypeCalculator } from "@/components/type-calculator";
import type { PokemonType } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Type Chart" };

const EFFECTIVENESS: Record<number, string> = {
  2: "2×",
  0.5: "½×",
  0: "0×",
};

export default async function TypeChartPage() {
  const { items: types } = await fetchTypeList();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">Type Chart</h1>

      {/* Matchup matrix */}
      <div className="overflow-x-auto rounded-2xl border border-white/40 dark:border-white/10 backdrop-blur-md" style={{ background: "var(--glass-bg)" }}>
        <table className="text-xs border-collapse w-full min-w-max">
          <thead>
            <tr>
              <th className="p-2 text-left text-zinc-400 dark:text-zinc-500 font-medium border-b border-r border-white/40 dark:border-white/10" style={{ background: "var(--glass-strong)" }}>
                ATK ↓ / DEF →
              </th>
              {types.map((t) => (
                <th key={t.name} className="p-1 border-b border-white/40 dark:border-white/10" style={{ background: "var(--glass-strong)" }}>
                  <TypeBadge type={t.name} showIcon className="text-[10px] px-1.5 py-0.5 whitespace-nowrap" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {types.map((atk) => (
              <tr key={atk.name} className="border-b border-white/30 dark:border-white/10 last:border-0">
                <td className="p-1 border-r border-white/30 dark:border-white/10" style={{ background: "var(--glass-strong)" }}>
                  <TypeBadge type={atk.name} showIcon className="text-[10px] px-1.5 py-0.5" />
                </td>
                {types.map((def) => {
                  const mult = getMultiplier(atk.name, def.name, types);
                  return (
                    <td
                      key={def.name}
                      className={`text-center p-1 font-medium ${cellClass(mult)}`}
                    >
                      {mult !== 1 ? EFFECTIVENESS[mult] ?? `${mult}×` : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dual-type calculator */}
      <div className="mt-10">
        <TypeCalculator types={types} />
      </div>
    </div>
  );
}


function getMultiplier(atk: string, def: string, types: PokemonType[]): number {
  const atkType = types.find((t) => t.name === atk);
  if (!atkType) return 1;
  if (atkType.damage_relations.no_damage_to.includes(def)) return 0;
  if (atkType.damage_relations.double_damage_to.includes(def)) return 2;
  if (atkType.damage_relations.half_damage_to.includes(def)) return 0.5;
  return 1;
}

function cellClass(mult: number): string {
  if (mult === 0)   return "bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400";
  if (mult === 2)   return "bg-green-100 dark:bg-green-900/70 text-green-800 dark:text-green-300 font-bold";
  if (mult === 0.5) return "bg-red-100 dark:bg-red-900/70 text-red-800 dark:text-red-300";
  return "";
}
