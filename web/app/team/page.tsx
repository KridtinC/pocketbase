"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Trash2, Save, FolderOpen, X, ChevronDown, ChevronUp, RotateCcw, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchPokemonList, fetchNatureList, fetchTeamList, createTeam, updateTeam, deleteTeam, fetchItemList } from "@/lib/api";
import { capitalize, typeBg } from "@/lib/utils";
import type { PokemonSummary, Nature, Team, TeamMember, StatBlock, Pokemon, Item } from "@/lib/types";

// ─── Stat formula ─────────────────────────────────────────────────────────────

const STAT_KEYS = ["hp", "attack", "defense", "special_attack", "special_defense", "speed"] as const;
type StatKey = typeof STAT_KEYS[number];

const STAT_LABELS: Record<StatKey, string> = {
  hp: "HP", attack: "Atk", defense: "Def",
  special_attack: "S.Atk", special_defense: "S.Def", speed: "Spd",
};

const NATURE_STAT_MAP: Record<string, StatKey> = {
  "attack": "attack", "defense": "defense",
  "special-attack": "special_attack", "special-defense": "special_defense",
  "speed": "speed",
};

function calcHP(base: number, iv: number, ev: number, level: number): number {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level / 100) + level + 10);
}

function calcStat(base: number, iv: number, ev: number, level: number, mod: number): number {
  return Math.floor(Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 5) * mod);
}

function computeStats(
  base: StatBlock,
  ivs: StatBlock,
  evs: StatBlock,
  level: number,
  nature: Nature | undefined,
): StatBlock {
  const mod = (key: StatKey): number => {
    if (!nature || !nature.increased_stat) return 1;
    const inc = NATURE_STAT_MAP[nature.increased_stat];
    const dec = NATURE_STAT_MAP[nature.decreased_stat ?? ""];
    if (inc === key) return 1.1;
    if (dec === key) return 0.9;
    return 1;
  };
  return {
    hp:              calcHP(base.hp, ivs.hp, evs.hp, level),
    attack:          calcStat(base.attack, ivs.attack, evs.attack, level, mod("attack")),
    defense:         calcStat(base.defense, ivs.defense, evs.defense, level, mod("defense")),
    special_attack:  calcStat(base.special_attack, ivs.special_attack, evs.special_attack, level, mod("special_attack")),
    special_defense: calcStat(base.special_defense, ivs.special_defense, evs.special_defense, level, mod("special_defense")),
    speed:           calcStat(base.speed, ivs.speed, evs.speed, level, mod("speed")),
  };
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultIVs = (): StatBlock => ({ hp: 31, attack: 31, defense: 31, special_attack: 31, special_defense: 31, speed: 31 });
const defaultEVs = (): StatBlock => ({ hp: 0, attack: 0, defense: 0, special_attack: 0, special_defense: 0, speed: 0 });

interface SlotState {
  pokemon: PokemonSummary | null;
  nickname: string;
  level: number;
  nature: string;
  heldItem: string;
  moves: [string, string, string, string];
  ivs: StatBlock;
  evs: StatBlock;
  expanded: boolean;
}

const defaultSlot = (): SlotState => ({
  pokemon: null, nickname: "", level: 50, nature: "hardy",
  heldItem: "", moves: ["", "", "", ""],
  ivs: defaultIVs(), evs: defaultEVs(), expanded: false,
});

// ─── Components ───────────────────────────────────────────────────────────────

function StatBars({ base, final, nature, statKey }: {
  base: StatBlock; final: StatBlock; nature: Nature | undefined; statKey: StatKey;
}) {
  const MAX_STAT = statKey === "hp" ? 714 : 658;
  const pct = Math.min(100, Math.round((final[statKey] / MAX_STAT) * 100));

  const getColor = () => {
    if (!nature?.increased_stat) return "bg-blue-400";
    const inc = NATURE_STAT_MAP[nature.increased_stat];
    const dec = NATURE_STAT_MAP[nature.decreased_stat ?? ""];
    if (statKey !== "hp" && inc === statKey) return "bg-green-400";
    if (statKey !== "hp" && dec === statKey) return "bg-red-400";
    return "bg-blue-400";
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 font-medium text-zinc-500 dark:text-zinc-400 shrink-0">{STAT_LABELS[statKey]}</span>
      <span className="w-8 text-right font-bold text-zinc-500 dark:text-zinc-400 shrink-0 tabular-nums">{base[statKey]}</span>
      <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div className={`h-2 rounded-full ${getColor()}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right font-bold text-zinc-900 dark:text-zinc-100 shrink-0 tabular-nums">{final[statKey]}</span>
    </div>
  );
}

function PokemonSearch({ onSelect }: { onSelect: (p: PokemonSummary) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PokemonSummary[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    const t = setTimeout(() => {
      fetchPokemonList({ search: query, limit: 8 })
        .then((r) => { setResults(r.items); setOpen(true); })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="relative">
      <Input
        placeholder="Search Pokémon…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-white/30 dark:border-white/10 shadow-xl overflow-hidden" style={{ background: "var(--glass-strong)" }}>
          {results.map((p) => (
            <button
              key={p.id}
              onMouseDown={() => { onSelect(p); setQuery(""); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
            >
              {(p.sprites.official_artwork || p.sprites.default) && (
                <Image src={p.sprites.official_artwork || p.sprites.default || ""} alt={p.names.en ?? p.name} width={28} height={28} className="object-contain" unoptimized />
              )}
              <span className="text-sm text-zinc-900 dark:text-zinc-100">{p.names.en ?? capitalize(p.name)}</span>
              <span className="text-xs text-zinc-400 ml-auto">#{p.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemSearch({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [query, setQuery] = useState(value ? capitalize(value.replace(/-/g, " ")) : "");
  const [results, setResults] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    const t = setTimeout(() => {
      fetchItemList({ search: query, limit: 8 })
        .then((r) => { setResults(r.items); setOpen(r.items.length > 0); })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="relative">
      <div className="relative">
        <Package size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <Input
          placeholder="Search held item…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); if (!e.target.value) onChange(""); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="pl-7 text-sm h-8"
        />
        {value && (
          <button
            onMouseDown={() => { onChange(""); setQuery(""); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-white/30 dark:border-white/10 shadow-xl overflow-hidden" style={{ background: "var(--glass-strong)" }}>
          {results.map((item) => (
            <button
              key={item.name}
              onMouseDown={() => { onChange(item.name); setQuery(item.names.en ?? capitalize(item.name)); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
            >
              {item.image_url ? (
                <Image src={item.image_url} alt={item.name} width={20} height={20} className="object-contain shrink-0" unoptimized />
              ) : (
                <Package size={16} className="text-zinc-400 shrink-0" />
              )}
              <span className="text-sm text-zinc-900 dark:text-zinc-100">{item.names.en ?? capitalize(item.name)}</span>
              <span className="text-xs text-zinc-400 ml-auto truncate max-w-[6rem]">{capitalize(item.category.replace(/-/g, " "))}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MoveSlot({
  value,
  moves,
  onChange,
  placeholder,
}: {
  value: string;
  moves: { name: string; learn_method: string; level: number }[];
  onChange: (name: string) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState(value ? capitalize(value.replace(/-/g, " ")) : "");
  const [open, setOpen] = useState(false);

  const filtered = moves
    .filter((m) => m.name.includes(query.toLowerCase().replace(/ /g, "-")) || capitalize(m.name.replace(/-/g, " ")).toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(""); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="text-sm h-8 pr-6"
        />
        {value && (
          <button
            onMouseDown={() => { onChange(""); setQuery(""); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-white/30 dark:border-white/10 shadow-xl overflow-hidden" style={{ background: "var(--glass-strong)" }}>
          {filtered.map((m) => (
            <button
              key={m.name}
              onMouseDown={() => { onChange(m.name); setQuery(capitalize(m.name.replace(/-/g, " "))); setOpen(false); }}
              className="flex items-center justify-between w-full px-3 py-1.5 text-left hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
            >
              <span className="text-sm text-zinc-900 dark:text-zinc-100">{capitalize(m.name.replace(/-/g, " "))}</span>
              <span className="text-xs text-zinc-400">{m.learn_method === "level-up" ? `Lv.${m.level || "Evo"}` : capitalize(m.learn_method)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeamBuilderPage() {
  const [slots, setSlots] = useState<SlotState[]>(Array.from({ length: 6 }, defaultSlot));
  const [natures, setNatures] = useState<Nature[]>([]);
  const [teamName, setTeamName] = useState("My Team");
  const [savedTeams, setSavedTeams] = useState<Team[]>([]);
  const [saving, setSaving] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  // Full pokemon data cache (stats + moves)
  const [pokemonCache, setPokemonCache] = useState<Record<string, Pokemon>>({});

  useEffect(() => {
    fetchNatureList().then(setNatures).catch(console.error);
    fetchTeamList().then(setSavedTeams).catch(console.error);
  }, []);

  // Fetch full pokemon data when Pokémon is selected
  useEffect(() => {
    slots.forEach((slot) => {
      if (slot.pokemon && !pokemonCache[slot.pokemon.name]) {
        import("@/lib/api").then(({ fetchPokemon }) =>
          fetchPokemon(slot.pokemon!.name).then((p) => {
            setPokemonCache((prev) => ({ ...prev, [p.name]: p }));
          }).catch(() => {})
        );
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots.map((s) => s.pokemon?.name).join(",")]);

  const updateSlot = (i: number, patch: Partial<SlotState>) =>
    setSlots((prev) => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));

  const updateIV = (i: number, key: StatKey, val: number) =>
    setSlots((prev) => prev.map((s, idx) => idx === i ? { ...s, ivs: { ...s.ivs, [key]: Math.min(31, Math.max(0, val)) } } : s));

  const updateEV = (i: number, key: StatKey, val: number) => {
    const slot = slots[i];
    const currentTotal = Object.values(slot.evs).reduce((a, b) => a + b, 0);
    const clamped = Math.min(252, Math.max(0, val));
    const diff = clamped - slot.evs[key];
    if (currentTotal + diff > 510) return;
    setSlots((prev) => prev.map((s, idx) => idx === i ? { ...s, evs: { ...s.evs, [key]: clamped } } : s));
  };

  const updateMove = (slotIdx: number, moveIdx: number, moveName: string) => {
    setSlots((prev) => prev.map((s, idx) => {
      if (idx !== slotIdx) return s;
      const moves = [...s.moves] as [string, string, string, string];
      moves[moveIdx] = moveName;
      return { ...s, moves };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const members = slots
        .filter((s) => s.pokemon)
        .map((s): TeamMember => ({
          pokemon_name: s.pokemon!.name,
          nickname: s.nickname || undefined,
          level: s.level,
          nature: s.nature,
          held_item: s.heldItem || undefined,
          moves: s.moves.filter(Boolean).length > 0 ? s.moves.filter(Boolean) : undefined,
          ivs: s.ivs,
          evs: s.evs,
        }));
      if (currentTeamId) {
        const updated = await updateTeam(currentTeamId, { name: teamName, members });
        setSavedTeams((prev) => prev.map((t) => t.id === currentTeamId ? updated : t));
      } else {
        const created = await createTeam({ name: teamName, members });
        setSavedTeams((prev) => [created, ...prev]);
        setCurrentTeamId(created.id);
      }
    } finally {
      setSaving(false);
    }
  };

  const loadTeam = (team: Team) => {
    setTeamName(team.name);
    setCurrentTeamId(team.id);
    setShowSaved(false);
    const newSlots: SlotState[] = Array.from({ length: 6 }, defaultSlot);
    team.members.forEach((m, i) => {
      if (i >= 6) return;
      const savedMoves = m.moves ?? [];
      newSlots[i] = {
        ...defaultSlot(),
        nickname: m.nickname ?? "",
        level: m.level,
        nature: m.nature,
        heldItem: m.held_item ?? "",
        moves: [savedMoves[0] ?? "", savedMoves[1] ?? "", savedMoves[2] ?? "", savedMoves[3] ?? ""],
        ivs: m.ivs,
        evs: m.evs,
        pokemon: { name: m.pokemon_name, id: 0, names: { en: capitalize(m.pokemon_name) }, types: [], sprites: {} },
      };
      import("@/lib/api").then(({ fetchPokemon }) =>
        fetchPokemon(m.pokemon_name).then((p) => {
          setSlots((prev) => prev.map((s, idx) =>
            idx === i ? { ...s, pokemon: { id: p.id, name: p.name, names: p.names, types: p.types, sprites: p.sprites } } : s
          ));
          setPokemonCache((prev) => ({ ...prev, [p.name]: p }));
        }).catch(() => {})
      );
    });
    setSlots(newSlots);
  };

  const handleDeleteTeam = async (id: string) => {
    await deleteTeam(id);
    setSavedTeams((prev) => prev.filter((t) => t.id !== id));
    if (currentTeamId === id) setCurrentTeamId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 shrink-0">Team Builder</h1>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => { setSlots(Array.from({ length: 6 }, defaultSlot)); setCurrentTeamId(null); setTeamName("My Team"); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-white/30 dark:border-white/10 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400 transition-colors text-zinc-700 dark:text-zinc-200"
            style={{ background: "var(--glass-bg)" }}
          >
            <RotateCcw size={15} />
            <span className="hidden sm:inline">Clear</span>
          </button>
          <button
            onClick={() => setShowSaved(!showSaved)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-white/30 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-colors text-zinc-700 dark:text-zinc-200"
            style={{ background: "var(--glass-bg)" }}
          >
            <FolderOpen size={15} />
            <span className="hidden sm:inline">Saved</span>
            <span>({savedTeams.length})</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white transition-colors"
          >
            <Save size={15} />
            <span>{saving ? "Saving…" : <><span className="hidden sm:inline">Save </span>Team</>}</span>
          </button>
        </div>
      </div>

      {/* Team name */}
      <div className="mb-6 max-w-xs">
        <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name…" />
      </div>

      {/* Saved teams panel */}
      {showSaved && savedTeams.length > 0 && (
        <div className="mb-6 rounded-2xl border border-white/30 dark:border-white/10 overflow-hidden" style={{ background: "var(--glass-bg)" }}>
          <div className="px-4 py-2 border-b border-white/20 dark:border-white/10 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500" style={{ background: "var(--glass-strong)" }}>
            Saved Teams
          </div>
          {savedTeams.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 border-b border-white/10 last:border-0 hover:bg-white/10 dark:hover:bg-white/5">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{t.name}</p>
                <p className="text-xs text-zinc-400">{t.members.length} Pokémon · {new Date(t.updated_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => loadTeam(t)} className="text-xs px-2 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">Load</button>
                <button onClick={() => handleDeleteTeam(t.id)} className="text-xs px-2 py-1 rounded-lg bg-red-500/80 text-white hover:bg-red-600 transition-colors"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6 slots */}
      <div className="grid lg:grid-cols-2 gap-4">
        {slots.map((slot, i) => {
          const pkmnData = slot.pokemon ? pokemonCache[slot.pokemon.name] : null;
          const base = pkmnData?.stats ?? null;
          const nature = natures.find((n) => n.name === slot.nature);
          const finalStats = base ? computeStats(base, slot.ivs, slot.evs, slot.level, nature) : null;
          const evTotal = Object.values(slot.evs).reduce((a, b) => a + b, 0);
          const mainType = slot.pokemon?.types[0];
          const bg = mainType ? typeBg(mainType) : "#9ca3af";

          return (
            <div key={i} className="rounded-3xl border border-white/20 dark:border-white/10 shadow-sm min-w-0" style={{ background: "var(--glass-bg)" }}>
              {/* Header */}
              <div className={`relative flex items-center gap-3 p-4 ${slot.pokemon ? "rounded-t-3xl" : "rounded-3xl"}`} style={{ backgroundColor: slot.pokemon ? bg + "99" : "rgba(156,163,175,0.15)" }}>
                {slot.pokemon ? (
                  <>
                    {(slot.pokemon.sprites.official_artwork || slot.pokemon.sprites.default) && (
                      <Image
                        src={slot.pokemon.sprites.official_artwork || slot.pokemon.sprites.default || ""}
                        alt={slot.pokemon.names.en ?? slot.pokemon.name}
                        width={64} height={64}
                        className="object-contain drop-shadow-md"
                        unoptimized
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-lg leading-tight drop-shadow">
                        {slot.nickname || slot.pokemon.names.en || capitalize(slot.pokemon.name)}
                      </p>
                      {slot.nickname && (
                        <p className="text-white/70 text-xs">{slot.pokemon.names.en}</p>
                      )}
                      <p className="text-white/70 text-xs mt-0.5">
                        Lv.{slot.level} · {capitalize(slot.nature)}
                        {slot.heldItem && <span> · {capitalize(slot.heldItem.replace(/-/g, " "))}</span>}
                      </p>
                    </div>
                    <button onClick={() => updateSlot(i, defaultSlot())} className="text-white/60 hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <div className="flex-1">
                    <p className="text-zinc-600 dark:text-white/60 font-medium text-sm mb-2">Slot {i + 1}</p>
                    <PokemonSearch onSelect={(p) => updateSlot(i, { pokemon: p, expanded: true })} />
                  </div>
                )}
                {slot.pokemon && (
                  <button
                    onClick={() => updateSlot(i, { expanded: !slot.expanded })}
                    className="absolute bottom-2 right-3 text-white/60 hover:text-white transition-colors"
                  >
                    {slot.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
              </div>

              {/* Edit panel */}
              {slot.pokemon && slot.expanded && (
                <div className="p-4 space-y-4">
                  {/* Nickname + level + nature row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500 font-semibold">Nickname</label>
                      <Input value={slot.nickname} onChange={(e) => updateSlot(i, { nickname: e.target.value })} placeholder="(none)" className="mt-1 text-sm h-8" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500 font-semibold">Level</label>
                      <Input
                        type="number" min={1} max={100}
                        value={slot.level}
                        onChange={(e) => updateSlot(i, { level: Math.min(100, Math.max(1, +e.target.value || 1)) })}
                        className="mt-1 text-sm h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500 font-semibold">Nature</label>
                      <Select value={slot.nature} onValueChange={(v) => updateSlot(i, { nature: v })}>
                        <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-56 overflow-y-auto">
                          <SelectGroup>
                            {natures.map((n) => (
                              <SelectItem key={n.name} value={n.name}>{n.names.en ?? capitalize(n.name)}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Held item */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500 font-semibold">Held Item</label>
                    <div className="mt-1">
                      <ItemSearch value={slot.heldItem} onChange={(name) => updateSlot(i, { heldItem: name })} />
                    </div>
                  </div>

                  {/* Moves — 4 slots */}
                  {pkmnData && (
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500 font-semibold">Moves</label>
                      <div className="mt-1 grid grid-cols-2 gap-1.5">
                        {([0, 1, 2, 3] as const).map((mi) => (
                          <MoveSlot
                            key={mi}
                            value={slot.moves[mi]}
                            moves={pkmnData.moves}
                            onChange={(name) => updateMove(i, mi, name)}
                            placeholder={`Move ${mi + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* IV / EV inputs */}
                  <div className="min-w-0">
                    <div className="grid grid-cols-[2.5rem_1fr_2rem_1px_1fr_2rem] items-center gap-x-1.5 mb-1">
                      <span />
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-400 text-center">IV</span>
                      <span />
                      <span />
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-400 text-center">EV</span>
                      <span />
                    </div>
                    <div className="space-y-1">
                      {STAT_KEYS.map((k) => (
                        <div key={k} className="grid grid-cols-[2.5rem_1fr_2rem_1px_1fr_2rem] items-center gap-x-1.5">
                          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">{STAT_LABELS[k]}</span>
                          <input
                            type="range" min={0} max={31}
                            value={slot.ivs[k]}
                            onChange={(e) => updateIV(i, k, +e.target.value)}
                            className="w-full h-1 accent-blue-400 cursor-pointer min-w-0"
                          />
                          <input
                            type="number" min={0} max={31}
                            value={slot.ivs[k]}
                            onChange={(e) => updateIV(i, k, +e.target.value)}
                            className="w-full text-center text-[11px] font-bold rounded border border-zinc-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-100 h-5 px-0 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 justify-self-center" />
                          <input
                            type="range" min={0} max={252}
                            value={slot.evs[k]}
                            onChange={(e) => updateEV(i, k, +e.target.value)}
                            className="w-full h-1 accent-amber-400 cursor-pointer min-w-0"
                          />
                          <input
                            type="number" min={0} max={252}
                            value={slot.evs[k]}
                            onChange={(e) => updateEV(i, k, +e.target.value)}
                            className="w-full text-center text-[11px] font-bold rounded border border-zinc-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-100 h-5 px-0 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-right text-zinc-400 tabular-nums mt-1">{evTotal} / 510 EVs</p>
                  </div>

                  {/* Final stats */}
                  {base && finalStats && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500 font-semibold mb-2">Final Stats</p>
                      {STAT_KEYS.map((k) => (
                        <StatBars key={k} base={base} final={finalStats} nature={nature} statKey={k} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Collapsed preview */}
              {slot.pokemon && !slot.expanded && finalStats && (
                <div className="px-4 pb-3 pt-1">
                  <div className="flex gap-2 flex-wrap">
                    {STAT_KEYS.map((k) => (
                      <div key={k} className="text-center">
                        <p className="text-[9px] text-zinc-400 dark:text-zinc-500">{STAT_LABELS[k]}</p>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{finalStats[k]}</p>
                      </div>
                    ))}
                  </div>
                  {slot.moves.some(Boolean) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {slot.moves.filter(Boolean).map((m) => (
                        <span key={m} className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {capitalize(m.replace(/-/g, " "))}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
