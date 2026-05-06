package httpadapter

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/KridtinC/pocketbase/internal/core/port"
)

type eggGroupHandler struct {
	svc port.EggGroupService
}

func (h *eggGroupHandler) list(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	limit, _ := strconv.Atoi(q.Get("limit"))
	f := port.ListFilter{
		Search:    q.Get("search"),
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

func (h *eggGroupHandler) get(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	g, err := h.svc.Get(r.Context(), name)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, g)
}
