"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";

interface Props {
  name: string;
  normal: string;
  shiny?: string;
}

export function ShinySprite({ name, normal, shiny }: Props) {
  const [isShiny, setIsShiny] = useState(false);
  const src = isShiny && shiny ? shiny : normal;

  return (
    <div className="relative flex flex-col items-center">
      <Image
        src={src}
        alt={name}
        width={200}
        height={200}
        priority
        className="drop-shadow-2xl transition-all duration-300"
      />
      {shiny && (
        <button
          onClick={() => setIsShiny((v) => !v)}
          className={[
            "absolute top-0 right-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-all",
            isShiny
              ? "bg-yellow-400/90 text-yellow-900 shadow-md shadow-yellow-400/30"
              : "bg-white/20 text-white/80 hover:bg-white/30",
          ].join(" ")}
          title={isShiny ? "Show normal" : "Show shiny"}
        >
          <Sparkles size={12} />
          {isShiny ? "Shiny" : "✦"}
        </button>
      )}
    </div>
  );
}
