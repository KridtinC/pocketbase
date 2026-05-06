export const runtime = "edge";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchAbility, fetchPokemonByAbility } from "@/lib/api";
import { capitalize } from "@/lib/utils";
import type { Metadata } from "next";

interface Props { params: { name: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const a = await fetchAbility(params.name);
    return { title: a.names.en ?? capitalize(a.name) };
  } catch { return { title: "Ability" }; }
}

export const dynamic = "force-dynamic";

export default async function AbilityDetail({ params }: Props) {
  let ability;
  try { ability = await fetchAbility(params.name); }
  catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("404") || msg.includes("not found")) notFound();
    throw err;
  }

  const pokemonPage = await fetchPokemonByAbility(params.name).catch(() => null);

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/abilities"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4 transition-colors"
      >
        <ArrowLeft size={16} /> Abilities
      </Link>

      <div
        className="rounded-3xl shadow-sm p-6 border border-white/30 dark:border-white/10 backdrop-blur-xl"
        style={{ background: "var(--glass-bg)" }}
      >
        <h1 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-zinc-100">
          {ability.names.en ?? capitalize(ability.name)}
        </h1>
        {ability.names.ja && (
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mb-6">{ability.names.ja}</p>
        )}

        {ability.short_effect && (
          <section className="mb-4">
            <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">Summary</h2>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{ability.short_effect}</p>
          </section>
        )}

        {ability.effect && ability.effect !== ability.short_effect && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">Full Effect</h2>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{ability.effect}</p>
          </section>
        )}

        {pokemonPage && pokemonPage.items.length > 0 && (
          <section className="mt-2">
            <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-3">
              Pokémon with this ability
              <span className="ml-2 font-normal normal-case">
                ({pokemonPage.total}{pokemonPage.total > pokemonPage.items.length ? `, showing ${pokemonPage.items.length}` : ""})
              </span>
            </h2>
            <div className="flex flex-wrap gap-3">
              {pokemonPage.items.map((p) => (
                <Link key={p.id} href={`/pokemon/${p.name}`} className="flex flex-col items-center gap-1 group w-16">
                  {(p.sprites.official_artwork || p.sprites.default) ? (
                    <Image
                      src={p.sprites.official_artwork || p.sprites.default || ""}
                      alt={p.names.en ?? p.name}
                      width={56}
                      height={56}
                      className="group-hover:scale-110 transition-transform drop-shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white/20" />
                  )}
                  <span className="text-[10px] text-center text-zinc-600 dark:text-zinc-400 leading-tight truncate w-full">
                    {p.names.en ?? capitalize(p.name)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
