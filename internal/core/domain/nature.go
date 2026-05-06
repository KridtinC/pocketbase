package domain

import "time"

type Nature struct {
	Name          string    `json:"name"`
	Names         Localized `json:"names"`
	IncreasedStat string    `json:"increased_stat,omitempty"`
	DecreasedStat string    `json:"decreased_stat,omitempty"`
	LikesFlavor   string    `json:"likes_flavor,omitempty"`
	HatesFlavor   string    `json:"hates_flavor,omitempty"`
	UpdatedAt     time.Time `json:"updated_at"`
}
