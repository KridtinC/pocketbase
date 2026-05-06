package pokeapi

import (
	"context"
	"fmt"

	"github.com/KridtinC/pocketbase/internal/core/domain"
)

func (c *Client) GetItem(ctx context.Context, name string) (domain.Item, error) {
	var r itemResp
	if err := c.getJSON(ctx, c.url("/item/"+name), &r); err != nil {
		return domain.Item{}, fmt.Errorf("get item %s: %w", name, err)
	}
	out := domain.Item{
		Name:     r.Name,
		Names:    pickLocalizedName(r.Names),
		Cost:     r.Cost,
		Category: r.Category.Name,
		ImageURL: r.Sprites.Default,
	}
	if out.Names.En == "" {
		out.Names.En = r.Name
	}
	for _, e := range r.EffectEntries {
		if e.Language.Name == "en" {
			out.Effect = e.Effect
			out.ShortEffect = e.ShortEffect
			break
		}
	}
	return out, nil
}
