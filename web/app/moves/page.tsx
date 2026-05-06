"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TypeBadge } from "@/components/type-badge";
import { DamageClassIcon } from "@/components/damage-class-icon";
import { Skeleton } from "@/components/skeleton";
import { fetchMoveList } from "@/lib/api";
import { capitalize } from "@/lib/utils";
import type { Move } from "@/lib/types";

const TYPES = [
  "normal","fire","water","electric","grass","ice","fighting","poison",
  "ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy",
];
const CLASSES = ["physical", "special", "status"];
const LIMIT = 30;

export default function MovesPage() {
  const [search, setSearch]     = useState("");
  const [type, setType]         = useState("");
  const [dmgClass, setDmgClass] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems]       = useState<Move[]>([]);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [hasMore, setHasMore]   = useState(true);
  const [loading, setLoading]   = useState(false);
  const sentinelRef             = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filtersKey = `${debounced}|${type}|${dmgClass}`;
  const prevKey    = useRef(filtersKey);

  useEffect(() => {
    if (prevKey.current !== filtersKey) {
      prevKey.current = filtersKey;
      setItems([]);
      setPage(1);
      setHasMore(true);
    }
  }, [filtersKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMoveList({ search: debounced || undefined, type: type || undefined, damage_class: dmgClass || undefined, page, limit: LIMIT })
      .then((res) => {
        if (cancelled) return;
        setTotal(res.total);
        setItems((prev) => (page === 1 ? res.items : [...prev, ...res.items]));
        setHasMore(page * LIMIT < res.total);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filtersKey]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) setPage((p) => p + 1);
  }, [loading, hasMore]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore(); }, { rootMargin: "300px" });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">Move List</h1>

      <div className="sticky top-[calc(3.5rem+10px)] z-30 mb-6">
        <div className="rounded-3xl border border-white/40 dark:border-white/10 shadow-md backdrop-blur-xl px-4 py-3 bg-white/40 dark:bg-zinc-900/50">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <Input className="pl-9" placeholder="Search moves…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={type || "_all"} onValueChange={(v) => setType(v === "_all" ? "" : v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="_all">All Types</SelectItem>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{capitalize(t)}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={dmgClass || "_all"} onValueChange={(v) => setDmgClass(v === "_all" ? "" : v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="_all">All Classes</SelectItem>
                  {CLASSES.map((c) => <SelectItem key={c} value={c}>{capitalize(c)}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {total > 0 && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">{items.length} / {total} moves</p>}
        </div>
      </div>

      <div className="rounded-xl border border-white/40 dark:border-white/10 overflow-hidden backdrop-blur-md" style={{ background: "var(--glass-bg)" }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide border-b border-white/40 dark:border-white/10" style={{ background: "var(--glass-strong)" }}>
              <th className="px-4 py-2 text-left">Move</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Class</th>
              <th className="px-4 py-2 text-right w-14">POW</th>
              <th className="px-4 py-2 text-right w-14">ACC</th>
              <th className="px-4 py-2 text-right w-12">PP</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr
                key={m.name}
                className="border-b border-white/30 dark:border-white/10 last:border-0 hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link href={`/moves/${m.name}`} className="block">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{m.names.en ?? capitalize(m.name)}</span>
                    {m.short_effect && (
                      <span className="block text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-xs">{m.short_effect}</span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3"><TypeBadge type={m.type} showIcon /></td>
                <td className="px-4 py-3"><DamageClassIcon dmgClass={m.damage_class} /></td>
                <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">{m.power ?? "—"}</td>
                <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">{m.accuracy ?? "—"}</td>
                <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">{m.pp ?? "—"}</td>
              </tr>
            ))}
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-white/20 dark:border-white/10">
                <td colSpan={6} className="px-4 py-3">
                  <Skeleton className="h-4 w-40" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </div>
  );
}
