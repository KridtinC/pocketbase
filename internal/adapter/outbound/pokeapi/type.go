package pokeapi

import (
	"context"
	"fmt"

	"github.com/KridtinC/pocketbase/internal/core/domain"
)

func (c *Client) GetType(ctx context.Context, name string) (domain.Type, error) {
	var t typeResp
	if err := c.getJSON(ctx, c.url("/type/"+name), &t); err != nil {
		return domain.Type{}, fmt.Errorf("get type %s: %w", name, err)
	}
	mapNames := func(refs []namedRef) []string {
		out := make([]string, 0, len(refs))
		for _, r := range refs {
			out = append(out, r.Name)
		}
		return out
	}
	out := domain.Type{
		Name:  t.Name,
		Names: pickLocalizedName(t.Names),
		DamageRelations: domain.DamageRelations{
			DoubleDamageTo:   mapNames(t.DamageRelations.DoubleDamageTo),
			HalfDamageTo:     mapNames(t.DamageRelations.HalfDamageTo),
			NoDamageTo:       mapNames(t.DamageRelations.NoDamageTo),
			DoubleDamageFrom: mapNames(t.DamageRelations.DoubleDamageFrom),
			HalfDamageFrom:   mapNames(t.DamageRelations.HalfDamageFrom),
			NoDamageFrom:     mapNames(t.DamageRelations.NoDamageFrom),
		},
	}
	if out.Names.En == "" {
		out.Names.En = t.Name
	}
	return out, nil
}
