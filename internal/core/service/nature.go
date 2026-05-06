package service

import (
	"context"

	"github.com/KridtinC/pocketbase/internal/core/domain"
	"github.com/KridtinC/pocketbase/internal/core/port"
)

type natureService struct{ repo port.NatureRepo }

func NewNatureService(repo port.NatureRepo) port.NatureService {
	return &natureService{repo: repo}
}

func (s *natureService) List(ctx context.Context) ([]domain.Nature, error) {
	return s.repo.List(ctx)
}

func (s *natureService) Get(ctx context.Context, name string) (domain.Nature, error) {
	return s.repo.GetByName(ctx, name)
}
