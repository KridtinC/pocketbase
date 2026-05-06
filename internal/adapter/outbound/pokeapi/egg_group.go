package pokeapi

import (
	"context"
	"fmt"

	"github.com/KridtinC/pocketbase/internal/core/domain"
)

func (c *Client) GetEggGroup(ctx context.Context, name string) (domain.EggGroup, error) {
	var g eggGroupResp
	if err := c.getJSON(ctx, c.url("/egg-group/"+name), &g); err != nil {
		return domain.EggGroup{}, fmt.Errorf("get egg group %s: %w", name, err)
	}
	out := domain.EggGroup{Name: g.Name, Names: pickLocalizedName(g.Names)}
	if out.Names.En == "" {
		out.Names.En = g.Name
	}
	return out, nil
}
