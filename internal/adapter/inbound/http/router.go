package httpadapter

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/KridtinC/pocketbase/internal/core/port"
)

type RouterConfig struct {
	CORSOrigin  string
	FrontendURL string
}

type Deps struct {
	Pokemon   port.PokemonService
	Moves     port.MoveService
	Abilities port.AbilityService
	Types     port.TypeService
	EggGroups port.EggGroupService
	Evo       port.EvolutionService
	Items     port.ItemService
	Natures   port.NatureService
	Teams     port.TeamService
	Auth      port.AuthService
	Config    RouterConfig
}

func NewRouter(d Deps) *chi.Mux {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(middleware.Logger)

	origin := d.Config.CORSOrigin
	if origin == "" {
		origin = "*"
	}
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{origin},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "Authorization"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	ph := &pokemonHandler{svc: d.Pokemon}
	mh := &moveHandler{svc: d.Moves}
	ah := &abilityHandler{svc: d.Abilities}
	th := &typeHandler{svc: d.Types}
	gh := &eggGroupHandler{svc: d.EggGroups}
	eh := &evolutionHandler{svc: d.Evo}
	ih := &itemHandler{svc: d.Items}
	nh := &natureHandler{svc: d.Natures}
	teamh := &teamHandler{svc: d.Teams}
	authh := &authHandler{svc: d.Auth, frontendURL: d.Config.FrontendURL}

	r.Route("/auth", func(r chi.Router) {
		r.Get("/google/login", authh.login)
		r.Get("/google/callback", authh.callback)
		r.Post("/refresh", authh.refresh)
		r.Post("/logout", authh.logout)
		r.With(authMiddleware(d.Auth)).Get("/me", authh.me)
	})

	r.Route("/api", func(r chi.Router) {
		r.Get("/pokemon", ph.list)
		r.Get("/pokemon/{idOrName}", ph.get)
		r.Get("/pokedexes", ph.listPokedexes)

		r.Get("/moves", mh.list)
		r.Get("/moves/{name}", mh.get)

		r.Get("/abilities", ah.list)
		r.Get("/abilities/{name}", ah.get)

		r.Get("/types", th.list)
		r.Get("/types/{name}", th.get)

		r.Get("/egg-groups", gh.list)
		r.Get("/egg-groups/{name}", gh.get)

		r.Get("/evolution-chains/{id}", eh.get)

		r.Get("/items", ih.list)
		r.Get("/items/categories", ih.categories)
		r.Get("/items/{name}", ih.get)

		r.Get("/natures", nh.list)
		r.Get("/natures/{name}", nh.get)

		r.Group(func(r chi.Router) {
			r.Use(authMiddleware(d.Auth))
			r.Get("/teams", teamh.list)
			r.Post("/teams", teamh.create)
			r.Get("/teams/{id}", teamh.get)
			r.Put("/teams/{id}", teamh.update)
			r.Delete("/teams/{id}", teamh.delete)
		})
	})

	return r
}
