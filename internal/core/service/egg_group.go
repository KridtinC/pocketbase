package service

import (
	"context"

	"github.com/KridtinC/pocketbase/internal/core/domain"
	"github.com/KridtinC/pocketbase/internal/core/port"
)

type eggGroupService struct {
	repo port.EggGroupRepo
}

func NewEggGroupService(repo port.EggGroupRepo) port.EggGroupService {
	return &eggGroupService{repo: repo}
}

func (s *eggGroupService) List(ctx context.Context, f port.ListFilter) (port.EggGroupPage, error) {
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

func (s *eggGroupService) Get(ctx context.Context, name string) (domain.EggGroup, error) {
	return s.repo.GetByName(ctx, name)
}
