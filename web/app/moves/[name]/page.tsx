export const runtime = "edge";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TypeBadge } from "@/components/type-badge";
import { DamageClassIcon } from "@/components/damage-class-icon";
import { fetchMove, fetchPokemonByMove } from "@/lib/api";
import { capitalize, typeGradient } from "@/lib/utils";
import type { Metadata } from "next";

interface Props { params: { name: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const m = await fetchMove(params.name);
    return { title: m.names.en ?? capitalize(m.name) };
  } catch { return { title: "Move" }; }
}

export const dynamic = "force-dynamic";

export default async function MoveDetail({ params }: Props) {
  let move;
  try { move = await fetchMove(params.name); }
  catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("404") || msg.includes("not found")) notFound();
    throw err;
  }

  const learnersPage = await fetchPokemonByMove(params.name).catch(() => null);
  const gradient = typeGradient(move.type);

  const statBoxes: [string, number | null][] = [
    ["POW",  move.power],
    ["ACC",  move.accuracy],
    ["PP",   move.pp],
    ["PRIO", move.priority],
  ];

  return (
    <>
      {/* Full-screen type gradient */}
      <div className="fixed inset-0 -z-10" style={{ background: gradient }} />

      <div className="max-w-lg mx-auto">
        <Link href="/moves" className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white mb-4 transition-colors">
          <ArrowLeft size={16} /> Moves
        </Link>

        {/* Glass card */}
        <div
          className="rounded-3xl overflow-hidden shadow-2xl border border-white/20 mb-4"
          style={{ background: "var(--glass-card)", backdropFilter: "blur(2px)" }}
        >
          {/* Header */}
          <div className="flex flex-col items-center px-6 pt-8 pb-20">
            <div className="flex gap-2 mb-4">
              <TypeBadge type={move.type} showIcon />
              <DamageClassIcon dmgClass={move.damage_class} className="w-7 h-7" />
            </div>
            <h1 className="text-white font-extrabold text-2xl mb-1 text-center">
              {move.names.en ?? capitalize(move.name)}
            </h1>
            {move.names.ja && (
              <p className="text-white/70 text-sm mb-6">{move.names.ja}</p>
            )}

            {/* Stat boxes */}
            <div className="flex gap-3 flex-wrap justify-center">
              {statBoxes.map(([label, val]) => (
                <div
                  key={label}
                  className="flex flex-col items-center rounded-2xl px-5 py-3 min-w-[64px]"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <span className="text-white/60 text-xs mb-1">{label}</span>
                  <span className="text-white font-bold text-xl">{val ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Glass info panel */}
          <div
            className="rounded-t-3xl -mt-6 px-5 pt-4 pb-8 border-t border-white/30"
            style={{ background: "var(--glass-bg)", backdropFilter: "blur(24px) saturate(200%)" }}
          >
            {move.short_effect && (
              <section className="mb-4">
                <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">Summary</h2>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{move.short_effect}</p>
              </section>
            )}

            {move.effect && move.effect !== move.short_effect && (
              <section className="mb-4">
                <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">Full Effect</h2>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{move.effect}</p>
              </section>
            )}

            <section className="mb-4">
              <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">Target</h2>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{capitalize(move.target)}</p>
            </section>

            {move.names.ja && (
              <section className="mb-6">
                <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">Translation</h2>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {move.names.en ?? capitalize(move.name)}
                  {` — ${move.names.ja}`}
                </p>
              </section>
            )}

            {learnersPage && learnersPage.items.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-3">
                  Learnable by
                  <span className="ml-2 font-normal normal-case">
                    ({learnersPage.total} Pokémon{learnersPage.total > learnersPage.items.length ? `, showing ${learnersPage.items.length}` : ""})
                  </span>
                </h2>
                <div className="flex flex-wrap gap-3">
                  {learnersPage.items.map((p) => (
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
      </div>
    </>
  );
}
