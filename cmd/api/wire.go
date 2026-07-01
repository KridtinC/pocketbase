//go:build wireinject
// +build wireinject

package main

import (
	"context"

	"github.com/google/wire"

	httpadapter "github.com/KridtinC/pocketbase/internal/adapter/inbound/http"
	"github.com/KridtinC/pocketbase/internal/adapter/outbound/mongorepo"
	"github.com/KridtinC/pocketbase/internal/core/service"
)

func initializeAPI(ctx context.Context, cfg appConfig) (*apiApp, func(), error) {
	wire.Build(
		provideMongoConfig,
		provideRouterConfig,
		provideAuthConfig,
		mongorepo.ProviderSet,
		service.ProviderSet,
		httpadapter.ProviderSet,
		wire.Struct(new(apiApp), "*"),
	)
	return nil, nil, nil
}
