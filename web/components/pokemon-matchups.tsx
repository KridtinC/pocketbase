import { TypeBadge } from "@/components/type-badge";

export interface MatchupRow {
  multiplier: number;
  label: string;
  types: string[];
}

interface Props {
  matchups: MatchupRow[];
}

const MULT_STYLE: Record<string, { bg: string; text: string }> = {
  "4":    { bg: "bg-green-100 dark:bg-green-900/40",  text: "text-green-800 dark:text-green-300" },
  "2":    { bg: "bg-green-50 dark:bg-green-900/20",   text: "text-green-700 dark:text-green-400" },
  "1":    { bg: "",                                    text: "text-zinc-400 dark:text-zinc-500"   },
  "0.5":  { bg: "bg-red-50 dark:bg-red-900/20",       text: "text-red-700 dark:text-red-400"     },
  "0.25": { bg: "bg-red-100 dark:bg-red-900/40",      text: "text-red-800 dark:text-red-300"     },
  "0":    { bg: "bg-zinc-100 dark:bg-zinc-800",       text: "text-zinc-500 dark:text-zinc-400"   },
};

export function PokemonMatchups({ matchups }: Props) {
  return (
    <div className="rounded-2xl border border-white/30 dark:border-white/10 overflow-hidden" style={{ background: "var(--glass-bg)" }}>
      <div className="divide-y divide-white/20 dark:divide-white/10">
        {matchups.map(({ multiplier, label, types }) => {
          if (types.length === 0) return null;
          const key = String(multiplier);
          const style = MULT_STYLE[key] ?? MULT_STYLE["1"];
          return (
            <div key={multiplier} className={`px-4 py-3 ${style.bg}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${style.text}`}>{label}</p>
              <div className="flex flex-wrap gap-1.5">
                {types.map((name) => (
                  <TypeBadge key={name} type={name} showIcon className="text-[11px] px-1.5 py-0.5" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
