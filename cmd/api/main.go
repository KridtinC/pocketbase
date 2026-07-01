package main

import (
	"context"
	"crypto/rand"
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
	"github.com/KridtinC/pocketbase/internal/core/service"
)

type apiApp struct {
	Router *chi.Mux
	DB     *mongo.Database
}

func provideMongoConfig(cfg appConfig) mongorepo.Config { return cfg.Mongo }

func provideRouterConfig(cfg appConfig) httpadapter.RouterConfig {
	return httpadapter.RouterConfig{CORSOrigin: cfg.CORSOrig, FrontendURL: cfg.FrontendURL}
}

func provideAuthConfig(cfg appConfig) service.AuthConfig { return cfg.Auth }

type appConfig struct {
	Mongo       mongorepo.Config
	Auth        service.AuthConfig
	HTTPAddr    string
	CORSOrig    string
	FrontendURL string
}

func loadConfig() appConfig {
	frontendURL := envOr("FRONTEND_URL", "http://localhost:3000")
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		slog.Warn("JWT_SECRET not set — generating an ephemeral secret; all sessions will be invalidated on restart. Set JWT_SECRET in production.")
		b := make([]byte, 32)
		_, _ = rand.Read(b)
		jwtSecret = string(b)
	}

	return appConfig{
		Mongo: mongorepo.Config{
			URI:      envOr("MONGO_URI", "mongodb://localhost:27017"),
			Database: envOr("MONGO_DB", "pokedex"),
		},
		Auth: service.AuthConfig{
			GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
			GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
			GoogleRedirectURL:  envOr("OAUTH_REDIRECT_URL", "http://localhost:8080/auth/google/callback"),
			FrontendURL:        frontendURL,
			JWTSecret:          []byte(jwtSecret),
		},
		HTTPAddr:    envOr("HTTP_ADDR", ":8080"),
		CORSOrig:    envOr("CORS_ORIGIN", "http://localhost:3000"),
		FrontendURL: frontendURL,
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
	if cfg.Auth.GoogleClientID == "" || cfg.Auth.GoogleClientSecret == "" {
		logger.Warn("GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET not set — Google login will fail")
	}
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
