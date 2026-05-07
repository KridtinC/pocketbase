import Link from "next/link";
import Image from "next/image";
import { TypeBadge } from "./type-badge";
import { formatId, dualTypeGradient, capitalize } from "@/lib/utils";
import type { PokemonSummary } from "@/lib/types";

interface Props {
  pokemon: PokemonSummary;
}

export function PokemonCard({ pokemon }: Props) {
  const gradient = dualTypeGradient(pokemon.types);
  const imgSrc = pokemon.sprites.official_artwork || pokemon.sprites.default || "";
  const displayName = pokemon.names.en || capitalize(pokemon.name);

  return (
    <Link
      href={`/pokemon/${pokemon.name}`}
      className="group flex flex-col rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 border border-white/30 dark:border-white/10 hover:scale-[1.02]"
    >
      {/* Gradient image area — fixed height */}
      <div
        className="relative flex items-center justify-center h-36 sm:h-44 shrink-0"
        style={{ background: gradient }}
      >
        <span className="absolute top-2 right-2 text-xs font-bold text-white/70 drop-shadow">
          {formatId(pokemon.id)}
        </span>
        {imgSrc && (
          <Image
            src={imgSrc}
            alt={displayName}
            width={110}
            height={110}
            className="object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300 max-h-28 sm:max-h-36"
            unoptimized
          />
        )}
      </div>

      {/* Info strip — no fixed height, grid row stretches all cards evenly */}
      <div className="px-3 py-2.5 sm:px-4 sm:py-3 backdrop-blur-md bg-white/30 dark:bg-black/30 border-t border-white/20 dark:border-white/10 flex flex-col gap-1 flex-1">
        <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm leading-tight truncate">
          {displayName}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate leading-tight">{pokemon.names.ja}</p>
        <div className="flex flex-wrap gap-1 mt-auto pt-1">
          {pokemon.types.map((t) => (
            <TypeBadge key={t} type={t} showIcon />
          ))}
        </div>
      </div>
    </Link>
  );
}
