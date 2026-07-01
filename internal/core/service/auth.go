package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"github.com/KridtinC/pocketbase/internal/core/domain"
	"github.com/KridtinC/pocketbase/internal/core/port"
)

const (
	googleUserInfoURL = "https://www.googleapis.com/oauth2/v3/userinfo"
	oauthStateIssuer  = "pocketbase-oauth-state"
	accessTokenIssuer = "pocketbase-api"
	oauthStateTTL     = 5 * time.Minute
)

// AuthConfig holds everything AuthService needs to run Google OAuth and
// mint/verify its own tokens.
type AuthConfig struct {
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	FrontendURL        string
	JWTSecret          []byte
	AccessTTL          time.Duration // default 15m
	RefreshTTL         time.Duration // default 30 days
}

type authService struct {
	users    port.UserRepo
	sessions port.SessionRepo
	oauthCfg *oauth2.Config
	cfg      AuthConfig
	client   *http.Client
}

func NewAuthService(users port.UserRepo, sessions port.SessionRepo, cfg AuthConfig) port.AuthService {
	if cfg.AccessTTL == 0 {
		cfg.AccessTTL = 15 * time.Minute
	}
	if cfg.RefreshTTL == 0 {
		cfg.RefreshTTL = 30 * 24 * time.Hour
	}
	return &authService{
		users:    users,
		sessions: sessions,
		cfg:      cfg,
		client:   http.DefaultClient,
		oauthCfg: &oauth2.Config{
			ClientID:     cfg.GoogleClientID,
			ClientSecret: cfg.GoogleClientSecret,
			RedirectURL:  cfg.GoogleRedirectURL,
			Scopes:       []string{"openid", "email", "profile"},
			Endpoint:     google.Endpoint,
		},
	}
}

// ─── State token (CSRF protection, no server-side storage needed) ─────────────

func (s *authService) ConsentURL(_ context.Context) (string, error) {
	nonce, err := randomToken(16)
	if err != nil {
		return "", err
	}
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Issuer:    oauthStateIssuer,
		ID:        nonce,
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(oauthStateTTL)),
	}
	state, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.cfg.JWTSecret)
	if err != nil {
		return "", err
	}
	return s.oauthCfg.AuthCodeURL(state, oauth2.SetAuthURLParam("prompt", "select_account")), nil
}

func (s *authService) verifyState(state string) error {
	claims := jwt.RegisteredClaims{}
	token, err := jwt.ParseWithClaims(state, &claims, func(t *jwt.Token) (any, error) {
		return s.cfg.JWTSecret, nil
	}, jwt.WithValidMethods([]string{"HS256"}), jwt.WithIssuer(oauthStateIssuer))
	if err != nil || !token.Valid {
		return domain.ErrUnauthorized
	}
	return nil
}

// ─── Login callback ────────────────────────────────────────────────────────

type googleUserInfo struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

func (s *authService) HandleCallback(ctx context.Context, code, state string) (port.AuthResult, error) {
	if err := s.verifyState(state); err != nil {
		return port.AuthResult{}, err
	}

	tok, err := s.oauthCfg.Exchange(ctx, code)
	if err != nil {
		return port.AuthResult{}, fmt.Errorf("exchange code: %w", err)
	}

	info, err := s.fetchGoogleUserInfo(ctx, tok)
	if err != nil {
		return port.AuthResult{}, err
	}
	if info.Sub == "" {
		return port.AuthResult{}, domain.ErrUnauthorized
	}

	user, err := s.users.Upsert(ctx, domain.User{
		ID: newID(), Provider: "google", ProviderUserID: info.Sub,
		Email: info.Email, Name: info.Name, AvatarURL: info.Picture,
		CreatedAt: time.Now(),
	})
	if err != nil {
		return port.AuthResult{}, fmt.Errorf("upsert user: %w", err)
	}

	return s.issueTokenPair(ctx, user, newID())
}

func (s *authService) fetchGoogleUserInfo(ctx context.Context, tok *oauth2.Token) (googleUserInfo, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, googleUserInfoURL, nil)
	if err != nil {
		return googleUserInfo{}, err
	}
	tok.SetAuthHeader(req)
	resp, err := s.client.Do(req)
	if err != nil {
		return googleUserInfo{}, fmt.Errorf("fetch userinfo: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return googleUserInfo{}, fmt.Errorf("userinfo status %d: %s", resp.StatusCode, body)
	}
	var info googleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return googleUserInfo{}, fmt.Errorf("decode userinfo: %w", err)
	}
	return info, nil
}

// ─── Refresh rotation with reuse detection ─────────────────────────────────

func (s *authService) Refresh(ctx context.Context, refreshToken string) (port.AuthResult, error) {
	hash := sha256Hex(refreshToken)
	sess, err := s.sessions.GetByHash(ctx, hash)
	if errors.Is(err, domain.ErrNotFound) {
		return port.AuthResult{}, domain.ErrUnauthorized
	}
	if err != nil {
		return port.AuthResult{}, err
	}
	if sess.Revoked {
		// This token was already rotated (or explicitly revoked) — presenting
		// it again means it was copied. Kill the whole family.
		_ = s.sessions.RevokeFamily(ctx, sess.FamilyID)
		return port.AuthResult{}, domain.ErrUnauthorized
	}
	if time.Now().After(sess.ExpiresAt) {
		return port.AuthResult{}, domain.ErrUnauthorized
	}

	user, err := s.users.GetByID(ctx, sess.UserID)
	if err != nil {
		return port.AuthResult{}, err
	}

	newSessionID := newID()
	result, err := s.issueTokenPairWithID(ctx, user, sess.FamilyID, newSessionID)
	if err != nil {
		return port.AuthResult{}, err
	}
	_ = s.sessions.Revoke(ctx, sess.ID, newSessionID)

	return result, nil
}

func (s *authService) Logout(ctx context.Context, refreshToken string) error {
	hash := sha256Hex(refreshToken)
	sess, err := s.sessions.GetByHash(ctx, hash)
	if errors.Is(err, domain.ErrNotFound) {
		return nil // already gone — logout is idempotent
	}
	if err != nil {
		return err
	}
	return s.sessions.Revoke(ctx, sess.ID, "")
}

// ─── Access token issuance / verification ──────────────────────────────────

func (s *authService) issueTokenPair(ctx context.Context, user domain.User, familyID string) (port.AuthResult, error) {
	return s.issueTokenPairWithID(ctx, user, familyID, newID())
}

func (s *authService) issueTokenPairWithID(ctx context.Context, user domain.User, familyID, sessionID string) (port.AuthResult, error) {
	accessToken, expiresIn, err := s.signAccessToken(user.ID)
	if err != nil {
		return port.AuthResult{}, err
	}

	refreshRaw, err := randomToken(32)
	if err != nil {
		return port.AuthResult{}, err
	}
	now := time.Now()
	if err := s.sessions.Create(ctx, domain.Session{
		ID: sessionID, UserID: user.ID, FamilyID: familyID,
		RefreshTokenHash: sha256Hex(refreshRaw),
		ExpiresAt:        now.Add(s.cfg.RefreshTTL),
		CreatedAt:        now,
	}); err != nil {
		return port.AuthResult{}, fmt.Errorf("create session: %w", err)
	}

	return port.AuthResult{
		User: user, AccessToken: accessToken, AccessExpiresIn: expiresIn, RefreshToken: refreshRaw,
	}, nil
}

func (s *authService) signAccessToken(userID string) (string, int, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   userID,
		Issuer:    accessTokenIssuer,
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(s.cfg.AccessTTL)),
	}
	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.cfg.JWTSecret)
	return signed, int(s.cfg.AccessTTL.Seconds()), err
}

func (s *authService) Me(ctx context.Context, userID string) (domain.User, error) {
	return s.users.GetByID(ctx, userID)
}

func (s *authService) VerifyAccessToken(accessToken string) (string, error) {
	claims := jwt.RegisteredClaims{}
	token, err := jwt.ParseWithClaims(accessToken, &claims, func(t *jwt.Token) (any, error) {
		return s.cfg.JWTSecret, nil
	}, jwt.WithValidMethods([]string{"HS256"}), jwt.WithIssuer(accessTokenIssuer))
	if err != nil || !token.Valid || claims.Subject == "" {
		return "", domain.ErrUnauthorized
	}
	return claims.Subject, nil
}

// ─── helpers ────────────────────────────────────────────────────────────────

func randomToken(nBytes int) (string, error) {
	b := make([]byte, nBytes)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func sha256Hex(s string) string {
	h := sha256.Sum256([]byte(s))
	return hex.EncodeToString(h[:])
}

func newID() string {
	b := make([]byte, 12)
	if _, err := rand.Read(b); err != nil {
		return hex.EncodeToString([]byte(time.Now().String()))
	}
	return hex.EncodeToString(b)
}
