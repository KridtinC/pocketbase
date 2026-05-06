package pokeapi

import (
	"context"
	"fmt"

	"github.com/KridtinC/pocketbase/internal/core/domain"
)

func (c *Client) GetEvolutionChain(ctx context.Context, id int) (domain.EvolutionChain, error) {
	var resp evolutionChainResp
	if err := c.getJSON(ctx, c.url(fmt.Sprintf("/evolution-chain/%d", id)), &resp); err != nil {
		return domain.EvolutionChain{}, fmt.Errorf("get evolution chain %d: %w", id, err)
	}
	return domain.EvolutionChain{
		ID:   id,
		Root: linkToNode(resp.Chain),
	}, nil
}

func linkToNode(l evolutionLinkResp) domain.EvolutionNode {
	steps := make([]domain.EvolutionStep, 0, len(l.EvolutionDetails))
	for _, d := range l.EvolutionDetails {
		s := domain.EvolutionStep{
			Trigger:      d.Trigger.Name,
			MinLevel:     d.MinLevel,
			MinHappiness: d.MinHappiness,
			TimeOfDay:    d.TimeOfDay,
			Gender:       d.Gender,
		}
		if d.Item != nil {
			s.Item = d.Item.Name
		}
		if d.HeldItem != nil {
			s.HeldItem = d.HeldItem.Name
		}
		if d.Location != nil {
			s.Location = d.Location.Name
		}
		if d.KnownMove != nil {
			s.KnownMove = d.KnownMove.Name
		}
		steps = append(steps, s)
	}
	children := make([]domain.EvolutionNode, 0, len(l.EvolvesTo))
	for _, c := range l.EvolvesTo {
		children = append(children, linkToNode(c))
	}
	return domain.EvolutionNode{
		Species:   l.Species.Name,
		Triggers:  steps,
		EvolvesTo: children,
	}
}
