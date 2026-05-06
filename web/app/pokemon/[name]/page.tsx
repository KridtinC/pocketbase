export const runtime = "edge";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TypeBadge } from "@/components/type-badge";
import { StatBar } from "@/components/stat-bar";
import { EvolutionChainDisplay } from "@/components/evolution-chain";
import { CryButton } from "@/components/cry-button";
import { ShinySprite } from "@/components/shiny-sprite";
import { PokemonMatchups } from "@/components/pokemon-matchups";
import type { MatchupRow } from "@/components/pokemon-matchups";
import { fetchPokemon, fetchEvolutionChain, fetchTypeList, fetchAbility } from "@/lib/api";
import { formatId, formatHeight, formatWeight, typeGradient, capitalize } from "@/lib/utils";
import { extractSpriteColor, hexToGradient } from "@/lib/colors";
import type { Metadata } from "next";
import type { EvolutionNode, PokemonType } from "@/lib/types";

interface Props {
  params: { name: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const p = await fetchPokemon(params.name);
    return { title: p.names.en ?? capitalize(p.name) };
  } catch {
    return { title: "Pokémon" };
  }
}

export const dynamic = "force-dynamic";

function collectSpecies(node: EvolutionNode): string[] {
  return [node.species, ...(node.evolves_to ?? []).flatMap(collectSpecies)];
}

// Compute type matchups (damage received) given the pokemon's types and full type list.
function computeMatchups(pokemonTypes: string[], allTypes: PokemonType[]): MatchupRow[] {
  const typeMap = new Map(allTypes.map((t) => [t.name, t]));

  const grouped = new Map<number, string[]>();
  for (const atkType of allTypes) {
    let mult = 1;
    for (const defType of pokemonTypes) {
      const dr = atkType.damage_relations;
      if (dr.no_damage_to.includes(defType))      { mult *= 0; break; }
      if (dr.double_damage_to.includes(defType))  mult *= 2;
      if (dr.half_damage_to.includes(defType))    mult *= 0.5;
    }
    if (!grouped.has(mult)) grouped.set(mult, []);
    grouped.get(mult)!.push(atkType.name);
  }

  const ORDER = [4, 2, 1, 0.5, 0.25, 0];
  const LABELS: Record<number, string> = {
    4: "4× — Super effective",
    2: "2× — Super effective",
    1: "1× — Normal damage",
    0.5: "½× — Not very effective",
    0.25: "¼× — Not very effective",
    0: "0× — Immune",
  };

  return ORDER.map((m) => ({
    multiplier: m,
    label: LABELS[m] ?? `${m}×`,
    types: grouped.get(m) ?? [],
  }));
}

// Render gender ratio with ♂/♀ symbols.
function GenderDisplay({ genderRate }: { genderRate: number }) {
  if (genderRate === -1) {
    return <span className="text-zinc-400 dark:text-zinc-500">— Genderless</span>;
  }
  if (genderRate === 0) {
    return <span className="text-blue-500 dark:text-blue-400">♂ 100%</span>;
  }
  if (genderRate === 8) {
    return <span className="text-pink-500 dark:text-pink-400">♀ 100%</span>;
  }
  const femalePct = (genderRate / 8) * 100;
  const malePct = 100 - femalePct;
  return (
    <span className="flex items-center gap-2">
      <span className="text-blue-500 dark:text-blue-400">♂ {malePct}%</span>
      <span className="text-pink-500 dark:text-pink-400">♀ {femalePct}%</span>
    </span>
  );
}

const STAT_LABELS: Record<string, string> = {
  hp: "HP", attack: "Atk", defense: "Def",
  special_attack: "SpAtk", special_defense: "SpDef", speed: "Spd",
};

export default async function PokemonDetail({ params }: Props) {
  let pokemon;
  try {
    pokemon = await fetchPokemon(params.name);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("404") || msg.includes("not found")) notFound();
    throw err;
  }

  // Fetch evolution chain, all types (for matchups), and ability details in parallel.
  const [chain, typesResult, ...abilityResults] = await Promise.all([
    pokemon.evolution_chain_id
      ? fetchEvolutionChain(pokemon.evolution_chain_id).catch(() => null)
      : Promise.resolve(null),
    fetchTypeList().catch(() => ({ items: [] as import("@/lib/types").PokemonType[] })),
    ...pokemon.abilities.map((a) => fetchAbility(a.name).catch(() => null)),
  ]);

  // Fetch sprites for every stage of the evolution chain in parallel.
  const evoSprites: Record<string, string> = {};
  if (chain) {
    const species = collectSpecies(chain.root);
    const results = await Promise.allSettled(species.map((n) => fetchPokemon(n)));
    results.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value.sprites.official_artwork) {
        evoSprites[species[i]] = r.value.sprites.official_artwork;
      }
    });
  }

  const allTypes = typesResult.items ?? [];
  const matchups = computeMatchups(pokemon.types, allTypes);

  const mainType = pokemon.types[0] ?? "normal";
  const spriteColor = pokemon.sprites.official_artwork
    ? await extractSpriteColor(pokemon.sprites.official_artwork).catch(() => null)
    : null;
  const gradient = spriteColor ? hexToGradient(spriteColor) : typeGradient(mainType);

  const stats: [string, number][] = [
    ["hp", pokemon.stats.hp],
    ["attack", pokemon.stats.attack],
    ["defense", pokemon.stats.defense],
    ["special_attack", pokemon.stats.special_attack],
    ["special_defense", pokemon.stats.special_defense],
    ["speed", pokemon.stats.speed],
  ];

  const evYieldEntries: [string, number][] = [
    ["hp", pokemon.ev_yield?.hp ?? 0],
    ["attack", pokemon.ev_yield?.attack ?? 0],
    ["defense", pokemon.ev_yield?.defense ?? 0],
    ["special_attack", pokemon.ev_yield?.special_attack ?? 0],
    ["special_defense", pokemon.ev_yield?.special_defense ?? 0],
    ["speed", pokemon.ev_yield?.speed ?? 0],
  ];

  const levelMoves = pokemon.moves
    .filter((m) => m.learn_method === "level-up")
    .sort((a, b) => a.level - b.level);

  const tmMoves = pokemon.moves.filter((m) => m.learn_method !== "level-up");

  return (
    <>
      {/* Full-screen type gradient fills the whole viewport behind everything */}
      <div className="fixed inset-0 -z-10" style={{ background: gradient }} />

      <div className="max-w-lg mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        {/* Outer glass card */}
        <div
          className="rounded-3xl overflow-hidden shadow-2xl border border-white/20 mb-4"
          style={{ background: "var(--glass-card)", backdropFilter: "blur(2px)" }}
        >
          {/* Header */}
          <div className="relative flex flex-col items-center pt-8 pb-20">
            {/* Type badges — top left */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {pokemon.types.map((t) => <TypeBadge key={t} type={t} showIcon />)}
            </div>

            {/* Cry button — top right */}
            {pokemon.cry && <CryButton src={pokemon.cry} />}

            <p className="text-white/60 text-sm font-bold mb-1">{formatId(pokemon.id)}</p>
            <h1 className="text-white font-extrabold text-2xl mb-1">
              {pokemon.names.en ?? capitalize(pokemon.name)}
            </h1>
            <p className="text-white/70 text-sm mb-4">{pokemon.names.ja}</p>

            {pokemon.sprites.official_artwork && (
              <ShinySprite
                name={pokemon.names.en ?? pokemon.name}
                normal={pokemon.sprites.official_artwork}
                shiny={pokemon.sprites.official_artwork_shiny}
              />
            )}
          </div>

          {/* Frosted glass tab panel */}
          <div
            className="rounded-t-3xl -mt-6 px-5 pt-3 pb-8 border-t border-white/30"
            style={{ background: "var(--glass-bg)", backdropFilter: "blur(24px) saturate(200%)" }}
          >
            <Tabs defaultValue="about">
              <TabsList>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="matchups">Matchups</TabsTrigger>
                <TabsTrigger value="evolution">Evolution</TabsTrigger>
                <TabsTrigger value="moves">Moves</TabsTrigger>
              </TabsList>

              {/* About */}
              <TabsContent value="about">
                <dl className="space-y-3 text-sm">
                  <Row label="Height"   value={formatHeight(pokemon.height)} />
                  <Row label="Weight"   value={formatWeight(pokemon.weight)} />
                  <Row label="Category" value={pokemon.genus.en ?? "—"} />
                  <Row label="Base Exp" value={pokemon.base_experience ?? "—"} />
                  <Row label="Catch Rate" value={
                    <span title={`${Math.round((pokemon.capture_rate / 255) * 100)}% chance at full HP with Poké Ball`}>
                      {pokemon.capture_rate ?? "—"}
                    </span>
                  } />
                  <Row label="Gender" value={<GenderDisplay genderRate={pokemon.gender_rate} />} />
                  <Row
                    label="EV Yield"
                    value={
                      <span className="flex flex-wrap gap-x-3 gap-y-0.5 justify-end">
                        {evYieldEntries.map(([key, val]) => (
                          <span key={key} className={val === 0 ? "text-zinc-400 dark:text-zinc-600" : ""}>
                            {STAT_LABELS[key]} <strong>{val > 0 ? `+${val}` : val}</strong>
                          </span>
                        ))}
                      </span>
                    }
                  />
                  <Row
                    label="Egg Groups"
                    value={pokemon.egg_groups.map(capitalize).join(", ") || "—"}
                  />
                </dl>

                {/* Abilities as cards */}
                <div className="mt-5">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Abilities</h3>
                  <div className="space-y-2">
                    {pokemon.abilities.map((a, idx) => {
                      const detail = abilityResults[idx];
                      return (
                        <Link
                          key={a.slot}
                          href={`/abilities/${a.name}`}
                          className="flex flex-col gap-0.5 rounded-xl p-3 border border-white/30 dark:border-white/10 hover:shadow-md transition-all"
                          style={{ background: "var(--glass-strong)" }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                              {detail?.names?.en ?? capitalize(a.name)}
                            </span>
                            {a.is_hidden && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">Hidden</span>
                            )}
                          </div>
                          {detail?.short_effect ? (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{detail.short_effect}</p>
                          ) : (
                            <p className="text-xs text-zinc-400 dark:text-zinc-600 italic">No description</p>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* Stats */}
              <TabsContent value="stats">
                <div className="space-y-3">
                  {stats.map(([key, val]) => (
                    <StatBar key={key} label={key} value={val} />
                  ))}
                  <div className="pt-3 border-t border-white/40">
                    <StatBar
                      label="total"
                      value={stats.reduce((s, [, v]) => s + v, 0)}
                      max={720}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Matchups */}
              <TabsContent value="matchups">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                  Damage received as {pokemon.types.map(capitalize).join(" / ")} type
                </p>
                <PokemonMatchups matchups={matchups} />
              </TabsContent>

              {/* Evolution */}
              <TabsContent value="evolution">
                {chain ? (
                  <EvolutionChainDisplay node={chain.root} sprites={evoSprites} />
                ) : (
                  <p className="text-sm text-zinc-400">No evolution data.</p>
                )}
              </TabsContent>

              {/* Moves */}
              <TabsContent value="moves">
                <MoveTable title="Level-Up Moves" moves={levelMoves} showLevel />
                {tmMoves.length > 0 && (
                  <MoveTable title="Other Moves" moves={tmMoves} showLevel={false} />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500 dark:text-zinc-400 shrink-0">{label}</dt>
      <dd className="text-zinc-900 dark:text-zinc-100 font-semibold text-right">{value}</dd>
    </div>
  );
}

function MoveTable({
  title,
  moves,
  showLevel,
}: {
  title: string;
  moves: { name: string; learn_method: string; level: number }[];
  showLevel: boolean;
}) {
  if (moves.length === 0) return null;
  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
        {title}
      </h3>
      <div className="rounded-xl border border-white/40 overflow-hidden text-sm">
        {moves.map((m) => (
          <div
            key={`${m.name}-${m.level}`}
            className="flex items-center justify-between px-3 py-2 odd:bg-white/30"
          >
            <Link href={`/moves/${m.name}`} className="hover:underline">
              {capitalize(m.name)}
            </Link>
            {showLevel && (
              <span className="text-xs text-zinc-400">
                {m.level === 0 ? "Evo" : `Lv. ${m.level}`}
              </span>
            )}
            {!showLevel && (
              <span className="text-xs text-zinc-400">{capitalize(m.learn_method)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
