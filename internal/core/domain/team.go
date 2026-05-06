package domain

import "time"

type StatBlock struct {
	HP             int `json:"hp"`
	Attack         int `json:"attack"`
	Defense        int `json:"defense"`
	SpecialAttack  int `json:"special_attack"`
	SpecialDefense int `json:"special_defense"`
	Speed          int `json:"speed"`
}

type TeamMember struct {
	PokemonName string    `json:"pokemon_name"`
	Nickname    string    `json:"nickname,omitempty"`
	Level       int       `json:"level"`
	Nature      string    `json:"nature"`
	HeldItem    string    `json:"held_item,omitempty"`
	Moves       []string  `json:"moves,omitempty"`
	IVs         StatBlock `json:"ivs"`
	EVs         StatBlock `json:"evs"`
}

type Team struct {
	ID        string       `json:"id"`
	Name      string       `json:"name"`
	Members   []TeamMember `json:"members"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
}
