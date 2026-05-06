package httpadapter

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/KridtinC/pocketbase/internal/core/port"
)

type itemHandler struct{ svc port.ItemService }

func (h *itemHandler) list(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	limit, _ := strconv.Atoi(q.Get("limit"))
	f := port.ItemFilter{
		ListFilter: port.ListFilter{
			Search:    q.Get("search"),
			SortOrder: q.Get("order"),
			Page:      page,
			Limit:     limit,
		},
		Category: q.Get("category"),
	}
	p, err := h.svc.List(r.Context(), f)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (h *itemHandler) get(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	item, err := h.svc.Get(r.Context(), name)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *itemHandler) categories(w http.ResponseWriter, r *http.Request) {
	cats, err := h.svc.ListCategories(r.Context())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, cats)
}
