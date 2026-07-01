package port

import (
	"context"

	"github.com/KridtinC/pocketbase/internal/core/domain"
)

// PokemonService is the inbound port consumed by the HTTP layer.
type PokemonService interface {
	List(ctx context.Context, f PokemonFilter) (PokemonPage, error)
	Get(ctx context.Context, idOrName string) (domain.Pokemon, error)
	ListPokedexNames(ctx context.Context) ([]string, error)
}

type MoveService interface {
	List(ctx context.Context, f MoveFilter) (MovePage, error)
	Get(ctx context.Context, name string) (domain.Move, error)
}

type AbilityService interface {
	List(ctx context.Context, f ListFilter) (AbilityPage, error)
	Get(ctx context.Context, name string) (domain.Ability, error)
}

type TypeService interface {
	List(ctx context.Context) ([]domain.Type, error)
	Get(ctx context.Context, name string) (domain.Type, error)
}

type EggGroupService interface {
	List(ctx context.Context, f ListFilter) (EggGroupPage, error)
	Get(ctx context.Context, name string) (domain.EggGroup, error)
}

type EvolutionService interface {
	Get(ctx context.Context, id int) (domain.EvolutionChain, error)
}

type ItemService interface {
	List(ctx context.Context, f ItemFilter) (ItemPage, error)
	Get(ctx context.Context, name string) (domain.Item, error)
	ListCategories(ctx context.Context) ([]string, error)
}

type NatureService interface {
	List(ctx context.Context) ([]domain.Nature, error)
	Get(ctx context.Context, name string) (domain.Nature, error)
}

// TeamService is scoped by owner — every method takes the authenticated
// caller's userID and only ever operates on that user's teams.
type TeamService interface {
	List(ctx context.Context, userID string) ([]domain.Team, error)
	Get(ctx context.Context, userID, id string) (domain.Team, error)
	Create(ctx context.Context, userID string, t domain.Team) (domain.Team, error)
	Update(ctx context.Context, userID, id string, t domain.Team) (domain.Team, error)
	Delete(ctx context.Context, userID, id string) error
}

// AuthResult is returned after a successful login or token refresh.
type AuthResult struct {
	User            domain.User
	AccessToken     string
	AccessExpiresIn int // seconds
	RefreshToken    string
}

// AuthService drives the Google OAuth login flow and manages the
// short-lived access JWT / long-lived rotating refresh token pair.
type AuthService interface {
	// ConsentURL returns the Google consent-screen URL, embedding a signed,
	// short-lived state token (CSRF protection — no server-side state needed).
	ConsentURL(ctx context.Context) (string, error)
	// HandleCallback verifies state, exchanges the code with Google, upserts
	// the user, and issues a fresh access/refresh token pair.
	HandleCallback(ctx context.Context, code, state string) (AuthResult, error)
	// Refresh rotates a refresh token: the presented token is invalidated and
	// a new pair is issued. Reuse of an already-rotated token revokes the
	// whole token family (signals a stolen token).
	Refresh(ctx context.Context, refreshToken string) (AuthResult, error)
	// Logout revokes the single session the given refresh token belongs to.
	Logout(ctx context.Context, refreshToken string) error
	// VerifyAccessToken validates an access JWT and returns the subject userID.
	VerifyAccessToken(accessToken string) (userID string, err error)
	// Me returns the profile for an already-authenticated userID.
	Me(ctx context.Context, userID string) (domain.User, error)
}

// SyncReport is returned by SyncService.Run.
type SyncReport struct {
	Pokemon     int
	Moves       int
	Abilities   int
	Types       int
	EggGroups   int
	Evolutions  int
	Items       int
	Natures     int
	Pokedexes   int
	Errors      int
	DurationMs  int64
}

type SyncOptions struct {
	MaxPokemon int      // limit for testing; 0 = all
	Force      bool     // re-fetch even if doc exists
	Only       []string // if non-empty, only sync these entity types (e.g. ["items","natures"])
}

// SyncService orchestrates a bulk pull from the upstream PokeAPIClient
// into the persistence layer.
type SyncService interface {
	Run(ctx context.Context, opts SyncOptions) (SyncReport, error)
}
