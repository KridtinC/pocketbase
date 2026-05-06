package domain

import "time"

type Move struct {
	Name        string    `json:"name"`
	Names       Localized `json:"names"`
	Power       *int      `json:"power"`
	Accuracy    *int      `json:"accuracy"`
	PP          *int      `json:"pp"`
	Priority    int       `json:"priority"`
	Type        string    `json:"type"`
	DamageClass string    `json:"damage_class"`
	Target      string    `json:"target"`
	Effect      string    `json:"effect,omitempty"`
	ShortEffect string    `json:"short_effect,omitempty"`
	UpdatedAt   time.Time `json:"updated_at"`
}
