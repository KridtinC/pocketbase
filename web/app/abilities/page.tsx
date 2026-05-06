"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/skeleton";
import { fetchAbilityList } from "@/lib/api";
import { capitalize } from "@/lib/utils";
import type { Ability } from "@/lib/types";

const LIMIT = 30;

export default function AbilitiesPage() {
  const [search, setSearch]   = useState("");
  const [debounced, setDeb]   = useState("");
  const [items, setItems]     = useState<Ability[]>([]);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinelRef           = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDeb(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setItems([]); setPage(1); setHasMore(true);
  }, [debounced]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAbilityList({ search: debounced || undefined, page, limit: LIMIT })
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
  }, [page, debounced]);

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
      <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">Ability List</h1>

      <div className="sticky top-[calc(3.5rem+10px)] z-30 mb-6">
        <div className="rounded-3xl border border-white/40 dark:border-white/10 shadow-md backdrop-blur-xl px-4 py-3 bg-white/40 dark:bg-zinc-900/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <Input className="pl-9" placeholder="Search abilities…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {total > 0 && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">{items.length} / {total} abilities</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((a) => (
          <Link
            key={a.name}
            href={`/abilities/${a.name}`}
            className="rounded-2xl p-4 border border-white/40 dark:border-white/10 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all backdrop-blur-sm"
            style={{ background: "var(--glass-bg)" }}
          >
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{a.names.en ?? capitalize(a.name)}</p>
            {a.names.ja && <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">{a.names.ja}</p>}
            {a.short_effect ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{a.short_effect}</p>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-600 italic">No description available.</p>
            )}
          </Link>
        ))}
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>

      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </div>
  );
}
