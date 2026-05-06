//go:build wireinject
// +build wireinject

package main

import (
	"context"
	"log/slog"

	"github.com/google/wire"

	"github.com/KridtinC/pocketbase/internal/adapter/outbound/mongorepo"
	"github.com/KridtinC/pocketbase/internal/adapter/outbound/pokeapi"
	"github.com/KridtinC/pocketbase/internal/core/service"
)

func initializeSync(ctx context.Context, cfg syncConfig, logger *slog.Logger) (*syncApp, func(), error) {
	wire.Build(
		provideSyncMongoConfig,
		provideSyncPokeAPIConfig,
		provideSyncDeps,
		mongorepo.ProviderSet,
		pokeapi.ProviderSet,
		service.SyncProviderSet,
		wire.Struct(new(syncApp), "*"),
	)
	return nil, nil, nil
}
