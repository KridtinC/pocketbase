package httpadapter

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/KridtinC/pocketbase/internal/core/port"
)

type moveHandler struct {
	svc port.MoveService
}

func (h *moveHandler) list(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	limit, _ := strconv.Atoi(q.Get("limit"))
	f := port.MoveFilter{
		ListFilter: port.ListFilter{
			Search:    q.Get("search"),
			SortOrder: q.Get("order"),
			Page:      page,
			Limit:     limit,
		},
		Type:        q.Get("type"),
		DamageClass: q.Get("damage_class"),
	}
	p, err := h.svc.List(r.Context(), f)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (h *moveHandler) get(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	m, err := h.svc.Get(r.Context(), name)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, m)
}
