import type {
  Pokemon, PokemonPage, Move, MovePage,
  Ability, AbilityPage, PokemonType, EvolutionChain,
  Item, ItemPage, Nature, Team,
} from "./types";
import { apiBase } from "./env";
import { getAccessToken, refreshAccessToken } from "./auth-token";

const getBase = apiBase;

// Attaches a bearer access token when one is available (silently refreshing
// it first if needed) and retries once on 401 in case it expired mid-flight.
// Harmless on public endpoints — they simply ignore the header.
async function authedFetch(url: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers);
  let token = getAccessToken() ?? (await refreshAccessToken());
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res = await fetch(url, { ...init, headers });
  if (res.status === 401 && token) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      headers.set("Authorization", `Bearer ${fresh}`);
      res = await fetch(url, { ...init, headers });
    }
  }
  return res;
}

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(getBase() + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "" && v !== 0) {
        url.searchParams.set(k, String(v));
      }
    }
  }
  const res = await authedFetch(url.toString(), {});
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function mutate<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await authedFetch(getBase() + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Pokémon ─────────────────────────────────────────────────────────────────

export interface PokemonListParams {
  search?: string;
  type?: string;
  egg_group?: string;
  ability?: string;
  move?: string;
  pokedex?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export const fetchPokemonList = (p: PokemonListParams = {}) =>
  get<PokemonPage>("/api/pokemon", p as Record<string, string | number | undefined>);

export const fetchPokemon = (idOrName: string) =>
  get<Pokemon>(`/api/pokemon/${idOrName}`);

export const fetchPokemonByMove = (moveName: string) =>
  get<PokemonPage>("/api/pokemon", { move: moveName, sort: "id", order: "asc", limit: 60 } as Record<string, string | number | undefined>);

export const fetchPokemonByAbility = (abilityName: string) =>
  get<PokemonPage>("/api/pokemon", { ability: abilityName, sort: "id", order: "asc", limit: 60 } as Record<string, string | number | undefined>);

export const fetchPokedexList = () => get<string[]>("/api/pokedexes");

// ─── Moves ───────────────────────────────────────────────────────────────────

export interface MoveListParams {
  search?: string;
  type?: string;
  damage_class?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export const fetchMoveList = (p: MoveListParams = {}) =>
  get<MovePage>("/api/moves", p as Record<string, string | number | undefined>);

export const fetchMove = (name: string) => get<Move>(`/api/moves/${name}`);

// ─── Abilities ───────────────────────────────────────────────────────────────

export interface AbilityListParams {
  search?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export const fetchAbilityList = (p: AbilityListParams = {}) =>
  get<AbilityPage>("/api/abilities", p as Record<string, string | number | undefined>);

export const fetchAbility = (name: string) => get<Ability>(`/api/abilities/${name}`);

// ─── Types ───────────────────────────────────────────────────────────────────

export const fetchTypeList = () =>
  get<{ items: PokemonType[] }>("/api/types");

export const fetchType = (name: string) => get<PokemonType>(`/api/types/${name}`);

// ─── Evolution ───────────────────────────────────────────────────────────────

export const fetchEvolutionChain = (id: number) =>
  get<EvolutionChain>(`/api/evolution-chains/${id}`);

// ─── Items ───────────────────────────────────────────────────────────────────

export interface ItemListParams {
  search?: string;
  category?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export const fetchItemList = (p: ItemListParams = {}) =>
  get<ItemPage>("/api/items", p as Record<string, string | number | undefined>);

export const fetchItem = (name: string) => get<Item>(`/api/items/${name}`);

export const fetchItemCategories = () =>
  get<string[]>("/api/items/categories");

// ─── Natures ─────────────────────────────────────────────────────────────────

export const fetchNatureList = () => get<Nature[]>("/api/natures");
export const fetchNature = (name: string) => get<Nature>(`/api/natures/${name}`);

// ─── Teams ───────────────────────────────────────────────────────────────────

export const fetchTeamList = () => get<Team[]>("/api/teams");
export const fetchTeam = (id: string) => get<Team>(`/api/teams/${id}`);
export const createTeam = (t: Omit<Team, "id" | "created_at" | "updated_at">) =>
  mutate<Team>("POST", "/api/teams", t);
export const updateTeam = (id: string, t: Partial<Team>) =>
  mutate<Team>("PUT", `/api/teams/${id}`, t);
export const deleteTeam = (id: string) =>
  mutate<void>("DELETE", `/api/teams/${id}`);
