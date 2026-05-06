package pokeapi

import (
	"context"
	"fmt"

	"github.com/KridtinC/pocketbase/internal/core/domain"
)

func (c *Client) GetAbility(ctx context.Context, name string) (domain.Ability, error) {
	var a abilityResp
	if err := c.getJSON(ctx, c.url("/ability/"+name), &a); err != nil {
		return domain.Ability{}, fmt.Errorf("get ability %s: %w", name, err)
	}
	out := domain.Ability{
		Name:  a.Name,
		Names: pickLocalizedName(a.Names),
	}
	if out.Names.En == "" {
		out.Names.En = a.Name
	}
	for _, e := range a.EffectEntries {
		if e.Language.Name == "en" {
			out.Effect = e.Effect
			out.ShortEffect = e.ShortEffect
			break
		}
	}
	return out, nil
}
