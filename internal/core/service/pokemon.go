package service

import (
	"context"

	"github.com/KridtinC/pocketbase/internal/core/domain"
	"github.com/KridtinC/pocketbase/internal/core/port"
)

type pokemonService struct {
	repo port.PokemonRepo
}

func NewPokemonService(repo port.PokemonRepo) port.PokemonService {
	return &pokemonService{repo: repo}
}

func (s *pokemonService) List(ctx context.Context, f port.PokemonFilter) (port.PokemonPage, error) {
	if f.Limit <= 0 || f.Limit > 100 {
		f.Limit = 24
	}
	if f.Page <= 0 {
		f.Page = 1
	}
	if f.SortBy == "" {
		f.SortBy = "id"
	}
	if f.SortOrder == "" {
		f.SortOrder = "asc"
	}
	return s.repo.List(ctx, f)
}

func (s *pokemonService) Get(ctx context.Context, idOrName string) (domain.Pokemon, error) {
	return s.repo.GetByIDOrName(ctx, idOrName)
}

func (s *pokemonService) ListPokedexNames(ctx context.Context) ([]string, error) {
	return s.repo.ListPokedexNames(ctx)
}
