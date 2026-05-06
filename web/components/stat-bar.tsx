import { STAT_MAX, capitalize } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  max?: number;
}

const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Atk",
  defense: "Def",
  special_attack: "S.Atk",
  special_defense: "S.Def",
  speed: "Spd",
};

function barColor(value: number, max: number) {
  const ratio = value / max;
  if (ratio < 0.35) return "bg-red-400";
  if (ratio < 0.6)  return "bg-yellow-400";
  return "bg-blue-500";
}

export function StatBar({ label, value, max }: Props) {
  const effectiveMax = max ?? STAT_MAX[label] ?? 255;
  const pct = Math.min(100, Math.round((value / effectiveMax) * 100));
  const short = STAT_LABELS[label] ?? capitalize(label);

  return (
    <div className="flex items-center gap-3">
      <span className="w-14 text-xs font-medium text-zinc-600 dark:text-zinc-300 shrink-0">{short}</span>
      <span className="w-8 text-xs font-bold text-zinc-900 dark:text-zinc-100 text-right shrink-0">{value}</span>
      <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700/60">
        <div
          className={`h-2 rounded-full transition-all ${barColor(value, effectiveMax)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
