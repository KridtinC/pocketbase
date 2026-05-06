package httpadapter

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/KridtinC/pocketbase/internal/core/port"
)

type pokemonHandler struct {
	svc port.PokemonService
}

func (h *pokemonHandler) list(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	limit, _ := strconv.Atoi(q.Get("limit"))
	f := port.PokemonFilter{
		Search:    q.Get("search"),
		Type:      q.Get("type"),
		EggGroup:  q.Get("egg_group"),
		Ability:   q.Get("ability"),
		Move:      q.Get("move"),
		Pokedex:   q.Get("pokedex"),
		SortBy:    q.Get("sort"),
		SortOrder: q.Get("order"),
		Page:      page,
		Limit:     limit,
	}
	p, err := h.svc.List(r.Context(), f)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (h *pokemonHandler) get(w http.ResponseWriter, r *http.Request) {
	idOrName := chi.URLParam(r, "idOrName")
	p, err := h.svc.Get(r.Context(), idOrName)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (h *pokemonHandler) listPokedexes(w http.ResponseWriter, r *http.Request) {
	names, err := h.svc.ListPokedexNames(r.Context())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, names)
}
