"use client";

import { useState } from "react";
import { TypeBadge } from "@/components/type-badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PokemonType } from "@/lib/types";

interface Props {
  types: PokemonType[];
}

function getMultiplier(atk: string, def: string, types: PokemonType[]): number {
  const atkType = types.find((t) => t.name === atk);
  if (!atkType) return 1;
  if (atkType.damage_relations.no_damage_to.includes(def)) return 0;
  if (atkType.damage_relations.double_damage_to.includes(def)) return 2;
  if (atkType.damage_relations.half_damage_to.includes(def)) return 0.5;
  return 1;
}

const MULT_CONFIG: { value: number; label: string; bg: string; text: string }[] = [
  { value: 4,    label: "4×  Super effective",   bg: "bg-green-100 dark:bg-green-900/40",  text: "text-green-800 dark:text-green-300" },
  { value: 2,    label: "2×  Super effective",   bg: "bg-green-50  dark:bg-green-900/20",  text: "text-green-700 dark:text-green-400" },
  { value: 0.5,  label: "½×  Not very effective", bg: "bg-red-50    dark:bg-red-900/20",    text: "text-red-700   dark:text-red-400"   },
  { value: 0.25, label: "¼×  Not very effective", bg: "bg-red-100   dark:bg-red-900/40",    text: "text-red-800   dark:text-red-300"   },
  { value: 0,    label: "0×  Immune",             bg: "bg-zinc-100  dark:bg-zinc-800",      text: "text-zinc-500  dark:text-zinc-400"   },
];

export function TypeCalculator({ types }: Props) {
  const [type1, setType1] = useState(types[0]?.name ?? "");
  const [type2, setType2] = useState("none");

  const grouped = new Map<number, string[]>();
  for (const atk of types) {
    const m1 = getMultiplier(atk.name, type1, types);
    const m2 = type2 !== "none" ? getMultiplier(atk.name, type2, types) : 1;
    const combined = m1 * m2;
    if (!grouped.has(combined)) grouped.set(combined, []);
    grouped.get(combined)!.push(atk.name);
  }

  const defLabel = type2 !== "none"
    ? `${type1} / ${type2}`
    : type1;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        Defending Type Calculator
      </h2>

      {/* Type selectors */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Type 1</span>
          <Select value={type1} onValueChange={setType1}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              <SelectGroup>
                {types.map((t) => (
                  <SelectItem key={t.name} value={t.name}>
                    <TypeBadge type={t.name} showIcon className="text-[11px] px-1.5 py-0.5" />
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Type 2 (optional)</span>
          <Select value={type2} onValueChange={setType2}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              <SelectGroup>
                <SelectItem value="none">— None —</SelectItem>
                {types.filter((t) => t.name !== type1).map((t) => (
                  <SelectItem key={t.name} value={t.name}>
                    <TypeBadge type={t.name} showIcon className="text-[11px] px-1.5 py-0.5" />
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end pb-0.5">
          <div className="flex gap-2 items-center">
            <TypeBadge type={type1} showIcon />
            {type2 !== "none" && (
              <>
                <span className="text-zinc-400 dark:text-zinc-500 font-bold">+</span>
                <TypeBadge type={type2} showIcon />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div
        className="rounded-2xl border border-white/30 dark:border-white/10 overflow-hidden"
        style={{ background: "var(--glass-bg)" }}
      >
        <div className="px-4 py-3 border-b border-white/30 dark:border-white/10" style={{ background: "var(--glass-strong)" }}>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Damage taken as <span className="text-zinc-900 dark:text-zinc-100 normal-case font-bold">{defLabel}</span>
          </p>
        </div>

        <div className="divide-y divide-white/20 dark:divide-white/10">
          {MULT_CONFIG.map(({ value, label, bg, text }) => {
            const attackers = grouped.get(value);
            if (!attackers?.length) return null;
            return (
              <div key={value} className={`px-4 py-3 ${bg}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${text}`}>{label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {attackers.map((name) => (
                    <TypeBadge key={name} type={name} showIcon className="text-[11px] px-1.5 py-0.5" />
                  ))}
                </div>
              </div>
            );
          })}
          {/* Normal (1×) row */}
          {(() => {
            const normal = grouped.get(1);
            if (!normal?.length) return null;
            return (
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-zinc-400 dark:text-zinc-500">1×  Normal damage</p>
                <div className="flex flex-wrap gap-1.5">
                  {normal.map((name) => (
                    <TypeBadge key={name} type={name} showIcon className="text-[11px] px-1.5 py-0.5 opacity-60" />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
