package pokeapi

import (
	"context"
	"fmt"

	"github.com/KridtinC/pocketbase/internal/core/domain"
)

func (c *Client) GetNature(ctx context.Context, name string) (domain.Nature, error) {
	var r natureResp
	if err := c.getJSON(ctx, c.url("/nature/"+name), &r); err != nil {
		return domain.Nature{}, fmt.Errorf("get nature %s: %w", name, err)
	}
	out := domain.Nature{
		Name:  r.Name,
		Names: pickLocalizedName(r.Names),
	}
	if out.Names.En == "" {
		out.Names.En = r.Name
	}
	if r.IncreasedStat != nil {
		out.IncreasedStat = r.IncreasedStat.Name
	}
	if r.DecreasedStat != nil {
		out.DecreasedStat = r.DecreasedStat.Name
	}
	if r.LikesFlavor != nil {
		out.LikesFlavor = r.LikesFlavor.Name
	}
	if r.HatesFlavor != nil {
		out.HatesFlavor = r.HatesFlavor.Name
	}
	return out, nil
}
