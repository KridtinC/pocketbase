import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { capitalize } from "@/lib/utils";
import type { EvolutionNode } from "@/lib/types";

interface Props {
  node: EvolutionNode;
  sprites: Record<string, string>; // name -> official_artwork url
}

export function EvolutionChainDisplay({ node, sprites }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-2">
      <EvolutionBranch node={node} sprites={sprites} />
    </div>
  );
}

function EvolutionBranch({ node, sprites }: Props) {
  const imgSrc = sprites[node.species];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Link
        href={`/pokemon/${node.species}`}
        className="flex flex-col items-center gap-1 group"
      >
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={node.species}
            width={80}
            height={80}
            className="group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        )}
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{capitalize(node.species)}</span>
      </Link>

      {node.evolves_to?.map((child) => (
        <div key={child.species} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <ChevronRight className="text-zinc-500 dark:text-zinc-400" size={20} />
            {child.triggers?.[0] && (
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 text-center max-w-16 leading-tight">
                {triggerLabel(child.triggers[0])}
              </span>
            )}
          </div>
          <EvolutionBranch node={child} sprites={sprites} />
        </div>
      ))}
    </div>
  );
}

function triggerLabel(t: { trigger?: string; min_level?: number; item?: string }): string {
  if (t.trigger === "level-up" && t.min_level) return `Lv. ${t.min_level}`;
  if (t.trigger === "use-item" && t.item) return capitalize(t.item);
  if (t.trigger === "trade") return "Trade";
  return capitalize(t.trigger ?? "");
}
