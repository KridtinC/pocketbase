"use client";

import Image from "next/image";
import { cn, TYPE_COLORS, capitalize } from "@/lib/utils";

interface Props {
  type: string;
  showIcon?: boolean;
  className?: string;
}

export function TypeBadge({ type, showIcon = true, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
        TYPE_COLORS[type] ?? "bg-zinc-400 text-white",
        className
      )}
    >
      {showIcon && (
        <Image
          src={`/types/${type}.svg`}
          alt={type}
          width={14}
          height={14}
          className="shrink-0"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      )}
      {capitalize(type)}
    </span>
  );
}
