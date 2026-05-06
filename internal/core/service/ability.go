package service

import (
	"context"

	"github.com/KridtinC/pocketbase/internal/core/domain"
	"github.com/KridtinC/pocketbase/internal/core/port"
)

type abilityService struct {
	repo port.AbilityRepo
}

func NewAbilityService(repo port.AbilityRepo) port.AbilityService {
	return &abilityService{repo: repo}
}

func (s *abilityService) List(ctx context.Context, f port.ListFilter) (port.AbilityPage, error) {
	if f.Limit <= 0 || f.Limit > 100 {
		f.Limit = 30
	}
	if f.Page <= 0 {
		f.Page = 1
	}
	if f.SortOrder == "" {
		f.SortOrder = "asc"
	}
	return s.repo.List(ctx, f)
}

func (s *abilityService) Get(ctx context.Context, name string) (domain.Ability, error) {
	return s.repo.GetByName(ctx, name)
}
