"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/skeleton";
import { fetchItemList, fetchItemCategories } from "@/lib/api";
import { getPageCache, setPageCache } from "@/lib/page-cache";
import { capitalize } from "@/lib/utils";
import type { Item } from "@/lib/types";

interface ItemCache {
  search: string; category: string; items: Item[]; page: number; total: number; scrollY: number;
}

const CACHE_KEY = "items";
const LIMIT = 30;

export default function ItemsPage() {
  const cached = useRef(getPageCache<ItemCache>(CACHE_KEY));

  const [search, setSearch]         = useState(cached.current?.search ?? "");
  const [debounced, setDeb]         = useState(cached.current?.search ?? "");
  const [category, setCategory]     = useState(cached.current?.category ?? "");
  const [categories, setCategories] = useState<string[]>([]);
  const [items, setItems]           = useState<Item[]>(cached.current?.items ?? []);
  const [page, setPage]             = useState(cached.current?.page ?? 1);
  const [total, setTotal]           = useState(cached.current?.total ?? 0);
  const [hasMore, setHasMore]       = useState(true);
  const [loading, setLoading]       = useState(false);
  const sentinelRef                 = useRef<HTMLDivElement | null>(null);
  const scrollRef                   = useRef(0);
  const didRestore                  = useRef(false);

  useEffect(() => { fetchItemCategories().then(setCategories).catch(console.error); }, []);

  useEffect(() => {
    const t = setTimeout(() => setDeb(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filtersKey = `${debounced}|${category}`;
  const prevKey = useRef(filtersKey);
  useEffect(() => {
    if (prevKey.current !== filtersKey) {
      prevKey.current = filtersKey;
      setItems([]); setPage(1); setHasMore(true);
    }
  }, [filtersKey]);

  useEffect(() => {
    if (cached.current && page === cached.current.page && filtersKey === `${cached.current.search}|${cached.current.category}`) return;
    let cancelled = false;
    setLoading(true);
    fetchItemList({ search: debounced || undefined, category: category || undefined, page, limit: LIMIT })
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

  // Track scroll
  useEffect(() => {
    const onScroll = () => { scrollRef.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Restore scroll
  useEffect(() => {
    if (cached.current?.scrollY && !didRestore.current && items.length > 0) {
      didRestore.current = true;
      requestAnimationFrame(() => window.scrollTo(0, cached.current!.scrollY));
    }
  }, [items]);

  // Save on unmount
  useEffect(() => () => {
    setPageCache<ItemCache>(CACHE_KEY, { search, category, items, page, total, scrollY: scrollRef.current });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, items, page, total]);

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
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">Item Dex</h1>

      <div className="sticky top-[calc(3.5rem+10px)] z-30 mb-6">
        <div className="rounded-3xl border border-white/40 dark:border-white/10 shadow-md backdrop-blur-xl px-4 py-3 bg-white/40 dark:bg-zinc-900/50">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <Input className="pl-9" placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={category || "_all"} onValueChange={(v) => setCategory(v === "_all" ? "" : v)}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                <SelectGroup>
                  <SelectItem value="_all">All Categories</SelectItem>
                  {categories.map((c) => <SelectItem key={c} value={c}>{capitalize(c.replace(/-/g, " "))}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {total > 0 && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">{items.length} / {total} items</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 animate-stagger">
        {items.map((item) => (
          <Link
            key={item.name}
            href={`/items/${item.name}`}
            className="flex items-center gap-3 rounded-2xl p-3 border border-white/40 dark:border-white/10 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all backdrop-blur-sm"
            style={{ background: "var(--glass-bg)" }}
          >
            {item.image_url ? (
              <Image src={item.image_url} alt={item.names.en ?? item.name} width={40} height={40} className="object-contain shrink-0" unoptimized />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                <Package size={18} className="text-zinc-400 dark:text-zinc-500" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{item.names.en ?? capitalize(item.name)}</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{capitalize(item.category.replace(/-/g, " "))} · {item.cost > 0 ? `₽${item.cost.toLocaleString()}` : "—"}</p>
              {item.short_effect ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">{item.short_effect}</p>
              ) : (
                <p className="text-xs text-zinc-400 dark:text-zinc-600 italic mt-0.5">No description</p>
              )}
            </div>
          </Link>
        ))}
        {loading && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>

      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </div>
  );
}
