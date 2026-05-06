package service

import (
	"context"

	"github.com/KridtinC/pocketbase/internal/core/domain"
	"github.com/KridtinC/pocketbase/internal/core/port"
)

type itemService struct{ repo port.ItemRepo }

func NewItemService(repo port.ItemRepo) port.ItemService {
	return &itemService{repo: repo}
}

func (s *itemService) List(ctx context.Context, f port.ItemFilter) (port.ItemPage, error) {
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

func (s *itemService) Get(ctx context.Context, name string) (domain.Item, error) {
	return s.repo.GetByName(ctx, name)
}

func (s *itemService) ListCategories(ctx context.Context) ([]string, error) {
	return s.repo.ListCategories(ctx)
}
