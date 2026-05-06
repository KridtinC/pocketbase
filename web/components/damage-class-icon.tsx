import Image from "next/image";

const ICONS: Record<string, string> = {
  physical: "https://img.pokemondb.net/images/icons/move-physical.png",
  special:  "https://img.pokemondb.net/images/icons/move-special.png",
  status:   "https://img.pokemondb.net/images/icons/move-status.png",
};

interface Props {
  dmgClass: string;
  className?: string;
}

export function DamageClassIcon({ dmgClass, className = "" }: Props) {
  const src = ICONS[dmgClass.toLowerCase()];
  if (!src) return <span className={`text-xs text-zinc-500 ${className}`}>{dmgClass}</span>;

  return (
    <Image
      src={src}
      alt={dmgClass}
      title={dmgClass.charAt(0).toUpperCase() + dmgClass.slice(1)}
      width={24}
      height={24}
      className={`object-contain ${className}`}
      unoptimized
    />
  );
}
