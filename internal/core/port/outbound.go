package port

import (
	"context"

	"github.com/KridtinC/pocketbase/internal/core/domain"
)

// PokemonFilter is the query shape for listing pokémon.
type PokemonFilter struct {
	Search    string // substring on name (case-insensitive)
	Type      string // single type id, e.g. "fire"
	EggGroup  string // single egg group id
	Ability   string // single ability id
	Move      string // move name — returns pokémon that can learn this move
	Pokedex   string // pokedex slug, e.g. "paldea"
	SortBy    string // "id" | "name" | "type" | "egg_group" | "ability"
	SortOrder string // "asc" | "desc"
	Page      int    // 1-based
	Limit     int    // page size
}

type PokemonPage struct {
	Items []domain.PokemonSummary `json:"items"`
	Total int64                   `json:"total"`
	Page  int                     `json:"page"`
	Limit int                     `json:"limit"`
}

type ListFilter struct {
	Search    string
	SortOrder string // "asc" | "desc"
	Page      int
	Limit     int
}

type MoveFilter struct {
	ListFilter
	Type        string
	DamageClass string
}

type MovePage struct {
	Items []domain.Move `json:"items"`
	Total int64         `json:"total"`
	Page  int           `json:"page"`
	Limit int           `json:"limit"`
}

type AbilityPage struct {
	Items []domain.Ability `json:"items"`
	Total int64            `json:"total"`
	Page  int              `json:"page"`
	Limit int              `json:"limit"`
}

type EggGroupPage struct {
	Items []domain.EggGroup `json:"items"`
	Total int64             `json:"total"`
	Page  int               `json:"page"`
	Limit int               `json:"limit"`
}

type ItemFilter struct {
	ListFilter
	Category string
}

type ItemPage struct {
	Items []domain.Item `json:"items"`
	Total int64         `json:"total"`
	Page  int           `json:"page"`
	Limit int           `json:"limit"`
}

// PokemonRepo is the outbound port for pokémon persistence.
type PokemonRepo interface {
	List(ctx context.Context, f PokemonFilter) (PokemonPage, error)
	GetByIDOrName(ctx context.Context, idOrName string) (domain.Pokemon, error)
	Upsert(ctx context.Context, p domain.Pokemon) error
	SetPokedexes(ctx context.Context, pokemonName string, pokedexes []string) error
	Count(ctx context.Context) (int64, error)
	ListPokedexNames(ctx context.Context) ([]string, error)
}

type MoveRepo interface {
	List(ctx context.Context, f MoveFilter) (MovePage, error)
	GetByName(ctx context.Context, name string) (domain.Move, error)
	Upsert(ctx context.Context, m domain.Move) error
}

type AbilityRepo interface {
	List(ctx context.Context, f ListFilter) (AbilityPage, error)
	GetByName(ctx context.Context, name string) (domain.Ability, error)
	Upsert(ctx context.Context, a domain.Ability) error
	ListAllNames(ctx context.Context) ([]string, error)
}

type TypeRepo interface {
	List(ctx context.Context) ([]domain.Type, error)
	GetByName(ctx context.Context, name string) (domain.Type, error)
	Upsert(ctx context.Context, t domain.Type) error
}

type EggGroupRepo interface {
	List(ctx context.Context, f ListFilter) (EggGroupPage, error)
	GetByName(ctx context.Context, name string) (domain.EggGroup, error)
	Upsert(ctx context.Context, g domain.EggGroup) error
	ListAllNames(ctx context.Context) ([]string, error)
}

type EvolutionRepo interface {
	GetByID(ctx context.Context, id int) (domain.EvolutionChain, error)
	Upsert(ctx context.Context, c domain.EvolutionChain) error
}

type ItemRepo interface {
	List(ctx context.Context, f ItemFilter) (ItemPage, error)
	GetByName(ctx context.Context, name string) (domain.Item, error)
	Upsert(ctx context.Context, i domain.Item) error
	ListCategories(ctx context.Context) ([]string, error)
}

type NatureRepo interface {
	List(ctx context.Context) ([]domain.Nature, error)
	GetByName(ctx context.Context, name string) (domain.Nature, error)
	Upsert(ctx context.Context, n domain.Nature) error
}

// TeamRepo is scoped by owner: every read/write is filtered by userID at the
// query level so a bug in the service layer can never leak another user's team.
type TeamRepo interface {
	List(ctx context.Context, userID string) ([]domain.Team, error)
	GetByID(ctx context.Context, id, userID string) (domain.Team, error)
	Create(ctx context.Context, t domain.Team) error
	Update(ctx context.Context, t domain.Team) error
	Delete(ctx context.Context, id, userID string) error
}

// UserRepo is the outbound port for OAuth-authenticated user persistence.
type UserRepo interface {
	GetByProviderID(ctx context.Context, provider, providerUserID string) (domain.User, error)
	GetByID(ctx context.Context, id string) (domain.User, error)
	// Upsert creates the user on first login, or refreshes their profile
	// fields (name/email/avatar may change on the provider's side) on
	// subsequent logins.
	Upsert(ctx context.Context, u domain.User) (domain.User, error)
}

// SessionRepo is the outbound port for refresh-token session persistence.
// Only the SHA-256 hash of a refresh token is ever stored.
type SessionRepo interface {
	Create(ctx context.Context, s domain.Session) error
	GetByHash(ctx context.Context, refreshTokenHash string) (domain.Session, error)
	// Revoke marks a session used. replacedBy is the ID of the session that
	// rotated it (empty on plain logout).
	Revoke(ctx context.Context, id, replacedBy string) error
	RevokeFamily(ctx context.Context, familyID string) error
}

// PokeAPIClient is the outbound port for the upstream PokéAPI service.
type PokeAPIClient interface {
	ListPokemonIDs(ctx context.Context, max int) ([]int, error)
	ListMoveNames(ctx context.Context) ([]string, error)
	ListAbilityNames(ctx context.Context) ([]string, error)
	ListTypeNames(ctx context.Context) ([]string, error)
	ListEggGroupNames(ctx context.Context) ([]string, error)
	ListItemNames(ctx context.Context) ([]string, error)
	ListNatureNames(ctx context.Context) ([]string, error)
	ListPokedexNames(ctx context.Context) ([]string, error)
	GetPokedex(ctx context.Context, name string) ([]string, error)

	GetPokemon(ctx context.Context, id int) (domain.Pokemon, error)
	GetMove(ctx context.Context, name string) (domain.Move, error)
	GetAbility(ctx context.Context, name string) (domain.Ability, error)
	GetType(ctx context.Context, name string) (domain.Type, error)
	GetEggGroup(ctx context.Context, name string) (domain.EggGroup, error)
	GetEvolutionChain(ctx context.Context, id int) (domain.EvolutionChain, error)
	GetItem(ctx context.Context, name string) (domain.Item, error)
	GetNature(ctx context.Context, name string) (domain.Nature, error)
}
