import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatId(id: number) {
  return `#${String(id).padStart(3, "0")}`;
}

export function formatHeight(decimeters: number) {
  const cm = decimeters * 10;
  const feet = Math.floor(cm / 30.48);
  const inches = Math.round((cm % 30.48) / 2.54);
  return `${(cm / 100).toFixed(1)} m (${feet}′${inches}″)`;
}

export function formatWeight(hectograms: number) {
  const kg = hectograms / 10;
  return `${kg.toFixed(1)} kg (${(kg * 2.205).toFixed(1)} lbs)`;
}

export function capitalize(s: string) {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Tailwind bg class for a given type name */
export const TYPE_COLORS: Record<string, string> = {
  normal:   "bg-[#A8A878] text-white",
  fire:     "bg-[#F08030] text-white",
  water:    "bg-[#6890F0] text-white",
  electric: "bg-[#F8D030] text-black",
  grass:    "bg-[#78C850] text-white",
  ice:      "bg-[#98D8D8] text-black",
  fighting: "bg-[#C03028] text-white",
  poison:   "bg-[#A040A0] text-white",
  ground:   "bg-[#E0C068] text-black",
  flying:   "bg-[#A890F0] text-white",
  psychic:  "bg-[#F85888] text-white",
  bug:      "bg-[#A8B820] text-white",
  rock:     "bg-[#B8A038] text-white",
  ghost:    "bg-[#705898] text-white",
  dragon:   "bg-[#7038F8] text-white",
  dark:     "bg-[#705848] text-white",
  steel:    "bg-[#B8B8D0] text-black",
  fairy:    "bg-[#EE99AC] text-white",
};

/** Solid hex for a type — used for card backgrounds */
export const TYPE_HEX: Record<string, string> = {
  normal:   "#A8A878",
  fire:     "#F08030",
  water:    "#6890F0",
  electric: "#F8D030",
  grass:    "#78C850",
  ice:      "#98D8D8",
  fighting: "#C03028",
  poison:   "#A040A0",
  ground:   "#E0C068",
  flying:   "#A890F0",
  psychic:  "#F85888",
  bug:      "#A8B820",
  rock:     "#B8A038",
  ghost:    "#705898",
  dragon:   "#7038F8",
  dark:     "#705848",
  steel:    "#B8B8D0",
  fairy:    "#EE99AC",
};

/** Darker shade of each type hex — used for gradient end stops */
export const TYPE_HEX_DARK: Record<string, string> = {
  normal:   "#686848",
  fire:     "#A04010",
  water:    "#3060C0",
  electric: "#B89000",
  grass:    "#488820",
  ice:      "#60A8A8",
  fighting: "#801010",
  poison:   "#601060",
  ground:   "#907030",
  flying:   "#6868C0",
  psychic:  "#B82058",
  bug:      "#687000",
  rock:     "#786010",
  ghost:    "#301868",
  dragon:   "#3008C0",
  dark:     "#301818",
  steel:    "#7070A0",
  fairy:    "#C04878",
};

export function typeBg(type: string): string {
  return TYPE_HEX[type] ?? "#A8A878";
}

export function typeGradient(type: string): string {
  const base = TYPE_HEX[type] ?? "#A8A878";
  const dark = TYPE_HEX_DARK[type] ?? "#686848";
  return `linear-gradient(145deg, ${base} 0%, ${dark} 100%)`;
}

/** Gradient for card header — single type: base→dark, dual type: type1→type2 */
export function dualTypeGradient(types: string[]): string {
  const t1 = types[0] ?? "normal";
  const c1 = TYPE_HEX[t1] ?? "#A8A878";
  if (types[1]) {
    const c2 = TYPE_HEX[types[1]] ?? TYPE_HEX_DARK[t1] ?? "#686848";
    return `linear-gradient(145deg, ${c1} 0%, ${c2} 100%)`;
  }
  const dark = TYPE_HEX_DARK[t1] ?? "#686848";
  return `linear-gradient(145deg, ${c1} 0%, ${dark} 100%)`;
}

export const STAT_MAX: Record<string, number> = {
  hp: 255,
  attack: 190,
  defense: 230,
  special_attack: 194,
  special_defense: 230,
  speed: 200,
};
