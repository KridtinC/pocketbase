package domain

import "time"

type Ability struct {
	Name        string    `json:"name"`
	Names       Localized `json:"names"`
	Effect      string    `json:"effect,omitempty"`
	ShortEffect string    `json:"short_effect,omitempty"`
	UpdatedAt   time.Time `json:"updated_at"`
}
