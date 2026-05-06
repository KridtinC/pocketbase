"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchPokemonList } from "@/lib/api";
import type { PokemonListParams } from "@/lib/api";
import type { PokemonSummary } from "@/lib/types";

const LIMIT = 24;

interface RestoredState {
  items: PokemonSummary[];
  page: number;
  total: number;
}

export function usePokemonList(
  filters: Omit<PokemonListParams, "page" | "limit">,
  restored?: RestoredState,
) {
  const filtersKey = JSON.stringify(filters);
  const prevFiltersKey = useRef(filtersKey);

  const [items, setItems] = useState<PokemonSummary[]>(() => restored?.items ?? []);
  const [page, setPage] = useState<number>(() => restored?.page ?? 1);
  const [total, setTotal] = useState<number>(() => restored?.total ?? 0);
  const [hasMore, setHasMore] = useState<boolean>(() =>
    restored ? restored.page * LIMIT < restored.total : true,
  );
  const [loading, setLoading] = useState(false);

  // Skip the very first fetch when restoring from cache.
  const skipFetch = useRef(!!restored?.items?.length);

  // Reset on filter change.
  useEffect(() => {
    if (prevFiltersKey.current !== filtersKey) {
      prevFiltersKey.current = filtersKey;
      skipFetch.current = false;
      setItems([]);
      setPage(1);
      setHasMore(true);
    }
  }, [filtersKey]);

  useEffect(() => {
    if (skipFetch.current) {
      skipFetch.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchPokemonList({ ...filters, page, limit: LIMIT })
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

  return { items, loading, hasMore, loadMore, total };
}
