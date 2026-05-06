import type { PokemonSummary } from "./types";

export interface ListCache {
  search: string;
  type: string;
  pokedex: string;
  sort: string;
  order: string;
  items: PokemonSummary[];
  page: number;
  total: number;
  scrollY: number;
}

let cache: ListCache | null = null;

export function getListCache(): ListCache | null { return cache; }
export function saveListCache(c: ListCache): void { cache = c; }
