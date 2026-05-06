"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PokemonCard } from "@/components/pokemon-card";
import { PokemonCardSkeleton } from "@/components/skeleton";
import { usePokemonList } from "@/hooks/use-pokemon-list";
import { getListCache, saveListCache } from "@/lib/list-cache";
import { fetchPokedexList } from "@/lib/api";
import { capitalize } from "@/lib/utils";

const LIMIT = 24;

const SORT_OPTIONS = [
  { value: "id",        label: "Number" },
  { value: "name",      label: "Name" },
  { value: "type",      label: "Type" },
  { value: "egg_group", label: "Egg Group" },
  { value: "ability",   label: "Ability" },
];

const TYPES = [
  "normal","fire","water","electric","grass","ice","fighting","poison",
  "ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy",
];

export default function PokedexPage() {
  // Read cache once at mount time.
  const [cached] = useState(() => getListCache());

  const [search, setSearch]     = useState(cached?.search ?? "");
  const [type, setType]         = useState(cached?.type ?? "");
  const [pokedex, setPokedex]   = useState(cached?.pokedex ?? "");
  const [pokedexes, setPokedexes] = useState<string[]>([]);
  const [sort, setSort]         = useState(cached?.sort ?? "id");
  const [order, setOrder]       = useState(cached?.order ?? "asc");
  const [debouncedSearch, setDebouncedSearch] = useState(cached?.search ?? "");

  useEffect(() => {
    fetchPokedexList().then(setPokedexes).catch(console.error);
  }, []);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollRef   = useRef(0);

  // Keep a ref to latest state for the unmount snapshot.
  const latestRef = useRef({ search, type, pokedex, sort, order });
  latestRef.current = { search, type, pokedex, sort, order };

  // Debounce search input.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { items, loading, hasMore, loadMore, total } = usePokemonList(
    { search: debouncedSearch || undefined, type: type || undefined, pokedex: pokedex || undefined, sort, order },
    cached
      ? { items: cached.items, page: cached.page, total: cached.total }
      : undefined,
  );

  // Keep a ref to latest items/total for the unmount snapshot.
  const listRef = useRef({ items, total });
  listRef.current = { items, total };

  // Track scroll position continuously.
  useEffect(() => {
    const onScroll = () => { scrollRef.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Restore scroll after cached items render.
  const didRestoreScroll = useRef(false);
  useEffect(() => {
    if (cached?.scrollY && !didRestoreScroll.current && items.length > 0) {
      didRestoreScroll.current = true;
      requestAnimationFrame(() => window.scrollTo(0, cached.scrollY));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  // Save cache on unmount.
  useEffect(() => {
    return () => {
      const { search, type, pokedex, sort, order } = latestRef.current;
      const { items, total } = listRef.current;
      saveListCache({
        search, type, pokedex, sort, order,
        items,
        page: Math.max(1, Math.ceil(items.length / LIMIT)),
        total,
        scrollY: scrollRef.current,
      });
    };
  }, []);

  // Intersection observer for infinite scroll.
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "300px" }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <div>
      {/* Sticky search + count bar */}
      <div className="sticky top-[calc(3.5rem+10px)] z-30 mb-6">
        <div className="rounded-3xl border border-white/40 dark:border-white/10 shadow-md backdrop-blur-xl px-4 py-3 bg-white/40 dark:bg-zinc-900/50">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <Input
                className="pl-9"
                placeholder="Search Pokémon…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={type || "_all"} onValueChange={(v) => setType(v === "_all" ? "" : v)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="_all">All Types</SelectItem>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{capitalize(t)}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {pokedexes.length > 0 && (
              <Select value={pokedex || "_all"} onValueChange={(v) => setPokedex(v === "_all" ? "" : v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Dexes" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  <SelectGroup>
                    <SelectItem value="_all">All Dexes</SelectItem>
                    {pokedexes.map((d) => (
                      <SelectItem key={d} value={d}>{capitalize(d.replace(/-/g, " "))}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={order} onValueChange={setOrder}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="asc">A → Z</SelectItem>
                  <SelectItem value="desc">Z → A</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {total > 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              {items.length} / {total} Pokémon
            </p>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((p) => (
          <PokemonCard key={p.id} pokemon={p} />
        ))}
        {loading &&
          Array.from({ length: 12 }).map((_, i) => (
            <PokemonCardSkeleton key={`sk-${i}`} />
          ))}
      </div>

      {hasMore && <div ref={sentinelRef} className="h-1" />}

      {!hasMore && items.length > 0 && (
        <p className="text-center text-sm text-zinc-400 mt-10">
          All {total} Pokémon loaded.
        </p>
      )}

      {!loading && items.length === 0 && (
        <p className="text-center text-zinc-400 mt-20">No Pokémon match your filters.</p>
      )}
    </div>
  );
}
