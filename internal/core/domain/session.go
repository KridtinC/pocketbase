package domain

import "time"

// Session represents one issued refresh token (a "token family" member).
// The raw refresh token is never stored — only its SHA-256 hash.
type Session struct {
	ID                string    `json:"id"`
	UserID            string    `json:"user_id"`
	FamilyID          string    `json:"family_id"`
	RefreshTokenHash  string    `json:"-"`
	Revoked           bool      `json:"-"`
	ReplacedBySession string    `json:"-"`
	ExpiresAt         time.Time `json:"-"`
	CreatedAt         time.Time `json:"-"`
}
