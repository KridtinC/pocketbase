package domain

import "time"

type Localized struct {
	En string `json:"en,omitempty"`
	Ja string `json:"ja,omitempty"`
}

type PokemonAbility struct {
	Name     string `json:"name"`
	IsHidden bool   `json:"is_hidden"`
	Slot     int    `json:"slot"`
}

type PokemonStats struct {
	HP             int `json:"hp"`
	Attack         int `json:"attack"`
	Defense        int `json:"defense"`
	SpecialAttack  int `json:"special_attack"`
	SpecialDefense int `json:"special_defense"`
	Speed          int `json:"speed"`
}

type Sprites struct {
	Default              string `json:"default,omitempty"`
	Shiny                string `json:"shiny,omitempty"`
	OfficialArtwork      string `json:"official_artwork,omitempty"`
	OfficialArtworkShiny string `json:"official_artwork_shiny,omitempty"`
}

type LearnedMove struct {
	Name         string `json:"name"`
	LearnMethod  string `json:"learn_method"`
	Level        int    `json:"level"`
	VersionGroup string `json:"version_group"`
}

type Pokemon struct {
	ID               int              `json:"id"`
	Name             string           `json:"name"`
	Names            Localized        `json:"names"`
	Genus            Localized        `json:"genus"`
	Height           int              `json:"height"` // decimeters
	Weight           int              `json:"weight"` // hectograms
	BaseExperience   int              `json:"base_experience"`
	Types            []string         `json:"types"`
	Abilities        []PokemonAbility `json:"abilities"`
	EggGroups        []string         `json:"egg_groups"`
	Stats            PokemonStats     `json:"stats"`
	EVYield          PokemonStats     `json:"ev_yield"`
	CaptureRate      int              `json:"capture_rate"`        // 0–255
	GenderRate       int              `json:"gender_rate"`         // -1 = genderless, 0–8 = female chance in eighths
	Sprites          Sprites          `json:"sprites"`
	Cry              string           `json:"cry,omitempty"`
	Moves            []LearnedMove    `json:"moves"`
	Pokedexes        []string         `json:"pokedexes,omitempty"` // pokedex slugs the pokemon belongs to
	EvolutionChainID int              `json:"evolution_chain_id"`
	SpeciesID        int              `json:"species_id"`
	UpdatedAt        time.Time        `json:"updated_at"`
}

// PokemonSummary is the trimmed shape returned by list endpoints.
type PokemonSummary struct {
	ID      int       `json:"id"`
	Name    string    `json:"name"`
	Names   Localized `json:"names"`
	Types   []string  `json:"types"`
	Sprites Sprites   `json:"sprites"`
}
