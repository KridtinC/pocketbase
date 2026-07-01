package httpadapter

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/KridtinC/pocketbase/internal/core/domain"
	"github.com/KridtinC/pocketbase/internal/core/port"
)

type ctxKey int

const userIDCtxKey ctxKey = iota

func userIDFromContext(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(userIDCtxKey).(string)
	return v, ok
}

// authMiddleware requires a valid "Authorization: Bearer <accessToken>"
// header and puts the resolved userID on the request context.
func authMiddleware(svc port.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			const prefix = "Bearer "
			if !strings.HasPrefix(header, prefix) {
				writeJSON(w, http.StatusUnauthorized, errorBody{Error: "missing bearer token"})
				return
			}
			userID, err := svc.VerifyAccessToken(strings.TrimPrefix(header, prefix))
			if err != nil {
				writeJSON(w, http.StatusUnauthorized, errorBody{Error: "invalid or expired token"})
				return
			}
			next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), userIDCtxKey, userID)))
		})
	}
}

type authHandler struct {
	svc         port.AuthService
	frontendURL string
}

type authResponse struct {
	AccessToken  string      `json:"access_token"`
	ExpiresIn    int         `json:"expires_in"`
	RefreshToken string      `json:"refresh_token"`
	User         domain.User `json:"user"`
}

func toAuthResponse(r port.AuthResult) authResponse {
	return authResponse{
		AccessToken: r.AccessToken, ExpiresIn: r.AccessExpiresIn,
		RefreshToken: r.RefreshToken, User: r.User,
	}
}

// login redirects the browser to Google's consent screen.
func (h *authHandler) login(w http.ResponseWriter, r *http.Request) {
	consentURL, err := h.svc.ConsentURL(r.Context())
	if err != nil {
		writeError(w, err)
		return
	}
	http.Redirect(w, r, consentURL, http.StatusFound)
}

// callback exchanges the code, then hands the token pair to the frontend via
// a URL fragment (never sent to the server on subsequent requests, unlike a
// query string, and stripped by browsers before the Referer header).
func (h *authHandler) callback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")
	if code == "" || state == "" {
		http.Redirect(w, r, h.frontendURL+"/auth/callback?error=missing_params", http.StatusFound)
		return
	}

	result, err := h.svc.HandleCallback(r.Context(), code, state)
	if err != nil {
		slog.Error("oauth callback", "err", err)
		http.Redirect(w, r, h.frontendURL+"/auth/callback?error=auth_failed", http.StatusFound)
		return
	}

	dest, err := url.Parse(h.frontendURL + "/auth/callback")
	if err != nil {
		writeError(w, err)
		return
	}
	frag := url.Values{}
	frag.Set("access_token", result.AccessToken)
	frag.Set("expires_in", strconv.Itoa(result.AccessExpiresIn))
	frag.Set("refresh_token", result.RefreshToken)
	dest.Fragment = frag.Encode()
	http.Redirect(w, r, dest.String(), http.StatusFound)
}

type refreshBody struct {
	RefreshToken string `json:"refresh_token"`
}

func (h *authHandler) refresh(w http.ResponseWriter, r *http.Request) {
	var body refreshBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.RefreshToken == "" {
		writeJSON(w, http.StatusBadRequest, errorBody{Error: "missing refresh_token"})
		return
	}
	result, err := h.svc.Refresh(r.Context(), body.RefreshToken)
	if err != nil {
		if errors.Is(err, domain.ErrUnauthorized) {
			writeJSON(w, http.StatusUnauthorized, errorBody{Error: "invalid or expired refresh token"})
			return
		}
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toAuthResponse(result))
}

func (h *authHandler) logout(w http.ResponseWriter, r *http.Request) {
	var body refreshBody
	_ = json.NewDecoder(r.Body).Decode(&body)
	if body.RefreshToken != "" {
		_ = h.svc.Logout(r.Context(), body.RefreshToken)
	}
	writeJSON(w, http.StatusNoContent, nil)
}

func (h *authHandler) me(w http.ResponseWriter, r *http.Request) {
	userID, ok := userIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, errorBody{Error: "unauthorized"})
		return
	}
	user, err := h.svc.Me(r.Context(), userID)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, user)
}
