package pokeapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"golang.org/x/time/rate"
)

type Config struct {
	BaseURL    string
	ReqPerSec  float64 // sustained rate
	Burst      int     // burst capacity
	HTTPClient *http.Client
}

func DefaultConfig() Config {
	return Config{
		BaseURL:   "https://pokeapi.co/api/v2",
		ReqPerSec: 8,
		Burst:     4,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 20,
				IdleConnTimeout:     90 * time.Second,
			},
		},
	}
}

type Client struct {
	cfg Config
	lim *rate.Limiter
}

func NewClient(cfg Config) *Client {
	if cfg.BaseURL == "" {
		cfg.BaseURL = "https://pokeapi.co/api/v2"
	}
	if cfg.ReqPerSec <= 0 {
		cfg.ReqPerSec = 8
	}
	if cfg.Burst <= 0 {
		cfg.Burst = 4
	}
	if cfg.HTTPClient == nil {
		cfg.HTTPClient = &http.Client{Timeout: 30 * time.Second}
	}
	return &Client{
		cfg: cfg,
		lim: rate.NewLimiter(rate.Limit(cfg.ReqPerSec), cfg.Burst),
	}
}

// getJSON fetches the URL and decodes JSON into v, observing the rate limiter
// and applying exponential backoff on 5xx and 429 responses.
func (c *Client) getJSON(ctx context.Context, url string, v any) error {
	const maxAttempts = 4
	var lastErr error
	for attempt := 0; attempt < maxAttempts; attempt++ {
		if err := c.lim.Wait(ctx); err != nil {
			return err
		}
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			return err
		}
		req.Header.Set("Accept", "application/json")
		req.Header.Set("User-Agent", "pocketbase-pokedex/0.1")

		resp, err := c.cfg.HTTPClient.Do(req)
		if err != nil {
			lastErr = err
			backoff(ctx, attempt)
			continue
		}
		switch {
		case resp.StatusCode == http.StatusOK:
			defer resp.Body.Close()
			return json.NewDecoder(resp.Body).Decode(v)
		case resp.StatusCode == http.StatusNotFound:
			io.Copy(io.Discard, resp.Body)
			resp.Body.Close()
			return ErrNotFound
		case resp.StatusCode == http.StatusTooManyRequests || resp.StatusCode >= 500:
			io.Copy(io.Discard, resp.Body)
			resp.Body.Close()
			lastErr = fmt.Errorf("pokeapi: status %d for %s", resp.StatusCode, url)
			backoff(ctx, attempt)
			continue
		default:
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			return fmt.Errorf("pokeapi: status %d for %s: %s", resp.StatusCode, url, string(body))
		}
	}
	if lastErr == nil {
		lastErr = errors.New("pokeapi: max attempts exceeded")
	}
	return lastErr
}

func backoff(ctx context.Context, attempt int) {
	d := time.Duration(1<<attempt) * 500 * time.Millisecond
	t := time.NewTimer(d)
	defer t.Stop()
	select {
	case <-ctx.Done():
	case <-t.C:
	}
}

var ErrNotFound = errors.New("pokeapi: not found")

func (c *Client) url(path string) string {
	return c.cfg.BaseURL + path
}
