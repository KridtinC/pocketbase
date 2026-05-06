package pokeapi

import (
	"context"
	"fmt"
)

// ListPokemonIDs — pokémon are sequentially numbered 1..N, so we just generate
// IDs locally rather than paying a list call. PokéAPI confirms this invariant.
func (c *Client) ListPokemonIDs(ctx context.Context, max int) ([]int, error) {
	if max <= 0 {
		max = 1025
	}
	ids := make([]int, max)
	for i := 0; i < max; i++ {
		ids[i] = i + 1
	}
	return ids, nil
}

func (c *Client) listNames(ctx context.Context, path string) ([]string, error) {
	var resp listResp
	if err := c.getJSON(ctx, c.url(path+"?limit=20000"), &resp); err != nil {
		return nil, fmt.Errorf("list %s: %w", path, err)
	}
	out := make([]string, 0, len(resp.Results))
	for _, r := range resp.Results {
		out = append(out, r.Name)
	}
	return out, nil
}

func (c *Client) ListMoveNames(ctx context.Context) ([]string, error) {
	return c.listNames(ctx, "/move")
}

func (c *Client) ListAbilityNames(ctx context.Context) ([]string, error) {
	return c.listNames(ctx, "/ability")
}

func (c *Client) ListTypeNames(ctx context.Context) ([]string, error) {
	all, err := c.listNames(ctx, "/type")
	if err != nil {
		return nil, err
	}
	// Drop the meta-types unused by mainline Pokédex UIs.
	out := all[:0]
	for _, n := range all {
		if n == "unknown" || n == "shadow" || n == "stellar" {
			continue
		}
		out = append(out, n)
	}
	return out, nil
}

func (c *Client) ListEggGroupNames(ctx context.Context) ([]string, error) {
	return c.listNames(ctx, "/egg-group")
}

func (c *Client) ListItemNames(ctx context.Context) ([]string, error) {
	return c.listNames(ctx, "/item")
}

func (c *Client) ListNatureNames(ctx context.Context) ([]string, error) {
	return c.listNames(ctx, "/nature")
}

func (c *Client) ListPokedexNames(ctx context.Context) ([]string, error) {
	return c.listNames(ctx, "/pokedex")
}

// GetPokedex returns the species names belonging to the named pokedex.
func (c *Client) GetPokedex(ctx context.Context, name string) ([]string, error) {
	var resp pokedexResp
	if err := c.getJSON(ctx, c.url(fmt.Sprintf("/pokedex/%s", name)), &resp); err != nil {
		return nil, fmt.Errorf("get pokedex %s: %w", name, err)
	}
	out := make([]string, 0, len(resp.PokemonEntries))
	for _, e := range resp.PokemonEntries {
		out = append(out, e.PokemonSpecies.Name)
	}
	return out, nil
}
