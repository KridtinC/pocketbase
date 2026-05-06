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

type TeamService interface {
	List(ctx context.Context) ([]domain.Team, error)
	Get(ctx context.Context, id string) (domain.Team, error)
	Create(ctx context.Context, t domain.Team) (domain.Team, error)
	Update(ctx context.Context, id string, t domain.Team) (domain.Team, error)
	Delete(ctx context.Context, id string) error
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
