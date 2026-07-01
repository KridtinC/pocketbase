package domain

import "time"

type User struct {
	ID             string    `json:"id"`
	Provider       string    `json:"provider"`
	ProviderUserID string    `json:"-"`
	Email          string    `json:"email"`
	Name           string    `json:"name"`
	AvatarURL      string    `json:"avatar_url,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}
