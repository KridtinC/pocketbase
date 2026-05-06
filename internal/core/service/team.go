package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/KridtinC/pocketbase/internal/core/domain"
	"github.com/KridtinC/pocketbase/internal/core/port"
)

type teamService struct{ repo port.TeamRepo }

func NewTeamService(repo port.TeamRepo) port.TeamService {
	return &teamService{repo: repo}
}

func newTeamID() string {
	b := make([]byte, 12)
	if _, err := rand.Read(b); err != nil {
		return hex.EncodeToString([]byte(time.Now().String()))
	}
	return hex.EncodeToString(b)
}

func (s *teamService) List(ctx context.Context) ([]domain.Team, error) {
	return s.repo.List(ctx)
}

func (s *teamService) Get(ctx context.Context, id string) (domain.Team, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *teamService) Create(ctx context.Context, t domain.Team) (domain.Team, error) {
	t.ID = newTeamID()
	now := time.Now()
	t.CreatedAt = now
	t.UpdatedAt = now
	if err := s.repo.Create(ctx, t); err != nil {
		return domain.Team{}, err
	}
	return t, nil
}

func (s *teamService) Update(ctx context.Context, id string, t domain.Team) (domain.Team, error) {
	t.ID = id
	t.UpdatedAt = time.Now()
	if err := s.repo.Update(ctx, t); err != nil {
		return domain.Team{}, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *teamService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
