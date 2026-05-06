package httpadapter

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/KridtinC/pocketbase/internal/core/port"
)

type natureHandler struct{ svc port.NatureService }

func (h *natureHandler) list(w http.ResponseWriter, r *http.Request) {
	nats, err := h.svc.List(r.Context())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, nats)
}

func (h *natureHandler) get(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	n, err := h.svc.Get(r.Context(), name)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, n)
}
