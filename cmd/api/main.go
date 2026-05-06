package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/mongo"

	httpadapter "github.com/KridtinC/pocketbase/internal/adapter/inbound/http"
	"github.com/KridtinC/pocketbase/internal/adapter/outbound/mongorepo"
)

type apiApp struct {
	Router *chi.Mux
	DB     *mongo.Database
}

func provideMongoConfig(cfg appConfig) mongorepo.Config { return cfg.Mongo }

func provideRouterConfig(cfg appConfig) httpadapter.RouterConfig {
	return httpadapter.RouterConfig{CORSOrigin: cfg.CORSOrig}
}

type appConfig struct {
	Mongo    mongorepo.Config
	HTTPAddr string
	CORSOrig string
}

func loadConfig() appConfig {
	return appConfig{
		Mongo: mongorepo.Config{
			URI:      envOr("MONGO_URI", "mongodb://localhost:27017"),
			Database: envOr("MONGO_DB", "pokedex"),
		},
		HTTPAddr: envOr("HTTP_ADDR", ":8080"),
		CORSOrig: envOr("CORS_ORIGIN", "http://localhost:3000"),
	}
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	cfg := loadConfig()
	rootCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	app, cleanup, err := initializeAPI(rootCtx, cfg)
	if err != nil {
		logger.Error("init", "err", err)
		os.Exit(1)
	}
	defer cleanup()

	if err := mongorepo.EnsureIndexes(rootCtx, app.DB); err != nil {
		logger.Error("ensure indexes", "err", err)
		os.Exit(1)
	}

	srv := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           app.Router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		logger.Info("api listening", "addr", cfg.HTTPAddr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server", "err", err)
			stop()
		}
	}()

	<-rootCtx.Done()
	logger.Info("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
}
