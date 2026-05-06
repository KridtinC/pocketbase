export interface Localized {
  en?: string;
  ja?: string;
}

export interface Sprites {
  default?: string;
  shiny?: string;
  official_artwork?: string;
  official_artwork_shiny?: string;
}

export interface PokemonAbility {
  name: string;
  is_hidden: boolean;
  slot: number;
}

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
}

export interface LearnedMove {
  name: string;
  learn_method: string;
  level: number;
  version_group: string;
}

export interface Pokemon {
  id: number;
  name: string;
  names: Localized;
  genus: Localized;
  height: number;
  weight: number;
  base_experience: number;
  types: string[];
  abilities: PokemonAbility[];
  egg_groups: string[];
  stats: PokemonStats;
  ev_yield: PokemonStats;
  capture_rate: number;
  gender_rate: number;
  sprites: Sprites;
  cry?: string;
  moves: LearnedMove[];
  pokedexes?: string[];
  evolution_chain_id: number;
  species_id: number;
  updated_at: string;
}

export interface PokemonSummary {
  id: number;
  name: string;
  names: Localized;
  types: string[];
  sprites: Sprites;
}

export interface PokemonPage {
  items: PokemonSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface Move {
  name: string;
  names: Localized;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number;
  type: string;
  damage_class: string;
  target: string;
  effect?: string;
  short_effect?: string;
  updated_at: string;
}

export interface MovePage {
  items: Move[];
  total: number;
  page: number;
  limit: number;
}

export interface Ability {
  name: string;
  names: Localized;
  effect?: string;
  short_effect?: string;
  updated_at: string;
}

export interface AbilityPage {
  items: Ability[];
  total: number;
  page: number;
  limit: number;
}

export interface DamageRelations {
  double_damage_to: string[];
  half_damage_to: string[];
  no_damage_to: string[];
  double_damage_from: string[];
  half_damage_from: string[];
  no_damage_from: string[];
}

export interface PokemonType {
  name: string;
  names: Localized;
  damage_relations: DamageRelations;
}

export interface EvolutionStep {
  trigger?: string;
  min_level?: number;
  min_happiness?: number;
  item?: string;
  held_item?: string;
  time_of_day?: string;
}

export interface EvolutionNode {
  species: string;
  triggers?: EvolutionStep[];
  evolves_to?: EvolutionNode[];
}

export interface EvolutionChain {
  id: number;
  root: EvolutionNode;
}

export interface Item {
  name: string;
  names: Localized;
  cost: number;
  category: string;
  effect?: string;
  short_effect?: string;
  image_url?: string;
  updated_at: string;
}

export interface ItemPage {
  items: Item[];
  total: number;
  page: number;
  limit: number;
}

export interface Nature {
  name: string;
  names: Localized;
  increased_stat?: string;
  decreased_stat?: string;
  likes_flavor?: string;
  hates_flavor?: string;
}

export interface StatBlock {
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
}

export interface TeamMember {
  pokemon_name: string;
  nickname?: string;
  level: number;
  nature: string;
  held_item?: string;
  moves?: string[];
  ivs: StatBlock;
  evs: StatBlock;
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  created_at: string;
  updated_at: string;
}
