package domain

import "time"

type EvolutionStep struct {
	Trigger      string `json:"trigger,omitempty"`
	MinLevel     *int   `json:"min_level,omitempty"`
	MinHappiness *int   `json:"min_happiness,omitempty"`
	Item         string `json:"item,omitempty"`
	HeldItem     string `json:"held_item,omitempty"`
	TimeOfDay    string `json:"time_of_day,omitempty"`
	Location     string `json:"location,omitempty"`
	KnownMove    string `json:"known_move,omitempty"`
	Gender       *int   `json:"gender,omitempty"`
}

type EvolutionNode struct {
	Species   string          `json:"species"`
	Triggers  []EvolutionStep `json:"triggers,omitempty"`
	EvolvesTo []EvolutionNode `json:"evolves_to,omitempty"`
}

type EvolutionChain struct {
	ID        int           `json:"id"`
	Root      EvolutionNode `json:"root"`
	UpdatedAt time.Time     `json:"updated_at"`
}
