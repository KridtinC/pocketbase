package service

import (
	"context"

	"github.com/KridtinC/pocketbase/internal/core/domain"
	"github.com/KridtinC/pocketbase/internal/core/port"
)

type typeService struct {
	repo port.TypeRepo
}

func NewTypeService(repo port.TypeRepo) port.TypeService {
	return &typeService{repo: repo}
}

func (s *typeService) List(ctx context.Context) ([]domain.Type, error) {
	return s.repo.List(ctx)
}

func (s *typeService) Get(ctx context.Context, name string) (domain.Type, error) {
	return s.repo.GetByName(ctx, name)
}
