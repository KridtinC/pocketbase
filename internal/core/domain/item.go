package domain

import "time"

type Item struct {
	Name        string    `json:"name"`
	Names       Localized `json:"names"`
	Cost        int       `json:"cost"`
	Category    string    `json:"category"`
	Effect      string    `json:"effect,omitempty"`
	ShortEffect string    `json:"short_effect,omitempty"`
	ImageURL    string    `json:"image_url,omitempty"`
	UpdatedAt   time.Time `json:"updated_at"`
}
