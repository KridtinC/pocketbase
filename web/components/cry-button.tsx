"use client";

import { Volume2 } from "lucide-react";

export function CryButton({ src }: { src: string }) {
  const play = () => {
    const audio = new Audio(src);
    audio.play().catch(() => {});
  };
  return (
    <button
      onClick={play}
      className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
      aria-label="Play cry"
    >
      <Volume2 size={20} />
    </button>
  );
}
