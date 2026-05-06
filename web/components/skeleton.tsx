import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700/60", className)} />
  );
}

export function PokemonCardSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden shadow-sm border border-white/20 dark:border-white/10" style={{ background: "var(--glass-bg)" }}>
      <Skeleton className="h-40 rounded-none" />
      <div className="px-4 py-3 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}
