package pokeapi

// Common shapes used across endpoints.

type namedRef struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

type listResp struct {
	Count   int        `json:"count"`
	Results []namedRef `json:"results"`
}

type localizedName struct {
	Name     string   `json:"name"`
	Language namedRef `json:"language"`
}

// Pokemon endpoint -----------------------------------------------------------

type pokemonResp struct {
	ID             int    `json:"id"`
	Name           string `json:"name"`
	Height         int    `json:"height"`
	Weight         int    `json:"weight"`
	BaseExperience int    `json:"base_experience"`
	Types          []struct {
		Slot int      `json:"slot"`
		Type namedRef `json:"type"`
	} `json:"types"`
	Stats []struct {
		BaseStat int      `json:"base_stat"`
		Effort   int      `json:"effort"`
		Stat     namedRef `json:"stat"`
	} `json:"stats"`
	Abilities []struct {
		Ability  namedRef `json:"ability"`
		IsHidden bool     `json:"is_hidden"`
		Slot     int      `json:"slot"`
	} `json:"abilities"`
	Moves []struct {
		Move                namedRef `json:"move"`
		VersionGroupDetails []struct {
			LevelLearnedAt  int      `json:"level_learned_at"`
			MoveLearnMethod namedRef `json:"move_learn_method"`
			VersionGroup    namedRef `json:"version_group"`
		} `json:"version_group_details"`
	} `json:"moves"`
	Sprites struct {
		FrontDefault string `json:"front_default"`
		FrontShiny   string `json:"front_shiny"`
		Other        struct {
			OfficialArtwork struct {
				FrontDefault string `json:"front_default"`
				FrontShiny   string `json:"front_shiny"`
			} `json:"official-artwork"`
		} `json:"other"`
	} `json:"sprites"`
	Cries struct {
		Latest string `json:"latest"`
		Legacy string `json:"legacy"`
	} `json:"cries"`
	Species namedRef `json:"species"`
}

// Pokemon-species endpoint ---------------------------------------------------

type speciesResp struct {
	ID          int             `json:"id"`
	Name        string          `json:"name"`
	Names       []localizedName `json:"names"`
	Genera      []struct {
		Genus    string   `json:"genus"`
		Language namedRef `json:"language"`
	} `json:"genera"`
	EggGroups      []namedRef `json:"egg_groups"`
	CaptureRate    int        `json:"capture_rate"`
	GenderRate     int        `json:"gender_rate"`
	EvolutionChain struct {
		URL string `json:"url"`
	} `json:"evolution_chain"`
}

// Pokedex endpoint -----------------------------------------------------------

type pokedexResp struct {
	ID             int    `json:"id"`
	Name           string `json:"name"`
	PokemonEntries []struct {
		EntryNumber    int      `json:"entry_number"`
		PokemonSpecies namedRef `json:"pokemon_species"`
	} `json:"pokemon_entries"`
}

// Move endpoint --------------------------------------------------------------

type moveResp struct {
	ID          int             `json:"id"`
	Name        string          `json:"name"`
	Names       []localizedName `json:"names"`
	Accuracy    *int            `json:"accuracy"`
	Power       *int            `json:"power"`
	PP          *int            `json:"pp"`
	Priority    int             `json:"priority"`
	Type        namedRef        `json:"type"`
	DamageClass namedRef        `json:"damage_class"`
	Target      namedRef        `json:"target"`
	EffectEntries []struct {
		Effect      string   `json:"effect"`
		ShortEffect string   `json:"short_effect"`
		Language    namedRef `json:"language"`
	} `json:"effect_entries"`
}

// Ability endpoint -----------------------------------------------------------

type abilityResp struct {
	ID            int             `json:"id"`
	Name          string          `json:"name"`
	Names         []localizedName `json:"names"`
	EffectEntries []struct {
		Effect      string   `json:"effect"`
		ShortEffect string   `json:"short_effect"`
		Language    namedRef `json:"language"`
	} `json:"effect_entries"`
}

// Type endpoint --------------------------------------------------------------

type typeResp struct {
	ID              int             `json:"id"`
	Name            string          `json:"name"`
	Names           []localizedName `json:"names"`
	DamageRelations struct {
		DoubleDamageTo   []namedRef `json:"double_damage_to"`
		HalfDamageTo     []namedRef `json:"half_damage_to"`
		NoDamageTo       []namedRef `json:"no_damage_to"`
		DoubleDamageFrom []namedRef `json:"double_damage_from"`
		HalfDamageFrom   []namedRef `json:"half_damage_from"`
		NoDamageFrom     []namedRef `json:"no_damage_from"`
	} `json:"damage_relations"`
}

// Egg-group endpoint ---------------------------------------------------------

type eggGroupResp struct {
	ID    int             `json:"id"`
	Name  string          `json:"name"`
	Names []localizedName `json:"names"`
}

// Evolution-chain endpoint ---------------------------------------------------

type evolutionChainResp struct {
	ID    int             `json:"id"`
	Chain evolutionLinkResp `json:"chain"`
}

type evolutionLinkResp struct {
	Species          namedRef            `json:"species"`
	EvolutionDetails []evolutionDetailResp `json:"evolution_details"`
	EvolvesTo        []evolutionLinkResp `json:"evolves_to"`
}

type evolutionDetailResp struct {
	Trigger      namedRef `json:"trigger"`
	MinLevel     *int     `json:"min_level"`
	MinHappiness *int     `json:"min_happiness"`
	Item         *namedRef `json:"item"`
	HeldItem     *namedRef `json:"held_item"`
	TimeOfDay    string   `json:"time_of_day"`
	Location     *namedRef `json:"location"`
	KnownMove    *namedRef `json:"known_move"`
	Gender       *int     `json:"gender"`
}

// Item endpoint --------------------------------------------------------------

type itemResp struct {
	ID       int             `json:"id"`
	Name     string          `json:"name"`
	Cost     int             `json:"cost"`
	Category namedRef        `json:"category"`
	Names    []localizedName `json:"names"`
	Sprites  struct {
		Default string `json:"default"`
	} `json:"sprites"`
	EffectEntries []struct {
		Effect      string   `json:"effect"`
		ShortEffect string   `json:"short_effect"`
		Language    namedRef `json:"language"`
	} `json:"effect_entries"`
}

// Nature endpoint ------------------------------------------------------------

type natureResp struct {
	ID            int             `json:"id"`
	Name          string          `json:"name"`
	Names         []localizedName `json:"names"`
	IncreasedStat *namedRef       `json:"increased_stat"`
	DecreasedStat *namedRef       `json:"decreased_stat"`
	LikesFlavor   *namedRef       `json:"likes_flavor"`
	HatesFlavor   *namedRef       `json:"hates_flavor"`
}
