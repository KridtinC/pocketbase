package domain

import "time"

type DamageRelations struct {
	DoubleDamageTo   []string `json:"double_damage_to"`
	HalfDamageTo     []string `json:"half_damage_to"`
	NoDamageTo       []string `json:"no_damage_to"`
	DoubleDamageFrom []string `json:"double_damage_from"`
	HalfDamageFrom   []string `json:"half_damage_from"`
	NoDamageFrom     []string `json:"no_damage_from"`
}

type Type struct {
	Name            string          `json:"name"`
	Names           Localized       `json:"names"`
	DamageRelations DamageRelations `json:"damage_relations"`
	UpdatedAt       time.Time       `json:"updated_at"`
}
