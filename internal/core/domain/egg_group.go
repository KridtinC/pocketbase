package domain

import "time"

type EggGroup struct {
	Name      string    `json:"name"`
	Names     Localized `json:"names"`
	UpdatedAt time.Time `json:"updated_at"`
}
