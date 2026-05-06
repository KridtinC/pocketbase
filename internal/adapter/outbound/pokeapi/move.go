package pokeapi

import (
	"context"
	"fmt"

	"github.com/KridtinC/pocketbase/internal/core/domain"
)

func (c *Client) GetMove(ctx context.Context, name string) (domain.Move, error) {
	var m moveResp
	if err := c.getJSON(ctx, c.url("/move/"+name), &m); err != nil {
		return domain.Move{}, fmt.Errorf("get move %s: %w", name, err)
	}
	out := domain.Move{
		Name:        m.Name,
		Names:       pickLocalizedName(m.Names),
		Power:       m.Power,
		Accuracy:    m.Accuracy,
		PP:          m.PP,
		Priority:    m.Priority,
		Type:        m.Type.Name,
		DamageClass: m.DamageClass.Name,
		Target:      m.Target.Name,
	}
	if out.Names.En == "" {
		out.Names.En = m.Name
	}
	for _, e := range m.EffectEntries {
		if e.Language.Name == "en" {
			out.Effect = e.Effect
			out.ShortEffect = e.ShortEffect
			break
		}
	}
	return out, nil
}
