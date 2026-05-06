package service

import (
	"context"

	"github.com/KridtinC/pocketbase/internal/core/domain"
	"github.com/KridtinC/pocketbase/internal/core/port"
)

type evolutionService struct {
	repo port.EvolutionRepo
}

func NewEvolutionService(repo port.EvolutionRepo) port.EvolutionService {
	return &evolutionService{repo: repo}
}

func (s *evolutionService) Get(ctx context.Context, id int) (domain.EvolutionChain, error) {
	return s.repo.GetByID(ctx, id)
}
