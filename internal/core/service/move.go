package service

import (
	"context"

	"github.com/KridtinC/pocketbase/internal/core/domain"
	"github.com/KridtinC/pocketbase/internal/core/port"
)

type moveService struct {
	repo port.MoveRepo
}

func NewMoveService(repo port.MoveRepo) port.MoveService {
	return &moveService{repo: repo}
}

func (s *moveService) List(ctx context.Context, f port.MoveFilter) (port.MovePage, error) {
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

func (s *moveService) Get(ctx context.Context, name string) (domain.Move, error) {
	return s.repo.GetByName(ctx, name)
}
