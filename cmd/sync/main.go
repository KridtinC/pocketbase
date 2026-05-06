package main

import (
	"context"
	"flag"
	"log/slog"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"

	"github.com/KridtinC/pocketbase/internal/adapter/outbound/mongorepo"
	"github.com/KridtinC/pocketbase/internal/adapter/outbound/pokeapi"
	"github.com/KridtinC/pocketbase/internal/core/port"
	"github.com/KridtinC/pocketbase/internal/core/service"
)

type syncConfig struct {
	Mongo  mongorepo.Config
	PokeAPI pokeapi.Config
}

type syncApp struct {
	Svc port.SyncService
}

func loadConfig() syncConfig {
	rps, _ := strconv.ParseFloat(envOr("POKEAPI_REQ_PER_SEC", "8"), 64)
	burst, _ := strconv.Atoi(envOr("POKEAPI_BURST", "4"))
	return syncConfig{
		Mongo: mongorepo.Config{
			URI:      envOr("MONGO_URI", "mongodb://localhost:27017"),
			Database: envOr("MONGO_DB", "pokedex"),
		},
		PokeAPI: pokeapi.Config{
			BaseURL:   envOr("POKEAPI_BASE_URL", "https://pokeapi.co/api/v2"),
			ReqPerSec: rps,
			Burst:     burst,
		},
	}
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func provideSyncMongoConfig(c syncConfig) mongorepo.Config { return c.Mongo }
func provideSyncPokeAPIConfig(c syncConfig) pokeapi.Config { return c.PokeAPI }

func provideSyncDeps(
	client port.PokeAPIClient,
	pokemon port.PokemonRepo,
	moves port.MoveRepo,
	abilities port.AbilityRepo,
	types port.TypeRepo,
	eggGroups port.EggGroupRepo,
	evolutions port.EvolutionRepo,
	items port.ItemRepo,
	natures port.NatureRepo,
	logger *slog.Logger,
) service.SyncDeps {
	return service.SyncDeps{
		Client:      client,
		Pokemon:     pokemon,
		Moves:       moves,
		Abilities:   abilities,
		Types:       types,
		EggGroups:   eggGroups,
		Evolutions:  evolutions,
		Items:       items,
		Natures:     natures,
		Logger:      logger,
		Concurrency: parseIntEnv("POKEAPI_CONCURRENCY", 4),
	}
}

func parseIntEnv(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

func main() {
	var (
		maxFlag   = flag.Int("max", 0, "max pokemon to sync (0 = all)")
		forceFlag = flag.Bool("force", false, "re-fetch even if doc exists")
		onlyFlag  = flag.String("only", "", "comma-separated entity types to sync, e.g. items,natures")
	)
	flag.Parse()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	cfg := loadConfig()
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	app, cleanup, err := initializeSync(ctx, cfg, logger)
	if err != nil {
		logger.Error("init", "err", err)
		os.Exit(1)
	}
	defer cleanup()

	var only []string
	if *onlyFlag != "" {
		for _, s := range strings.Split(*onlyFlag, ",") {
			if t := strings.TrimSpace(s); t != "" {
				only = append(only, t)
			}
		}
	}

	logger.Info("sync starting", "max", *maxFlag, "force", *forceFlag, "only", only)
	rep, err := app.Svc.Run(ctx, port.SyncOptions{MaxPokemon: *maxFlag, Force: *forceFlag, Only: only})
	if err != nil {
		logger.Error("sync", "err", err, "report", rep)
		os.Exit(1)
	}
	logger.Info("done", "report", rep)
}
