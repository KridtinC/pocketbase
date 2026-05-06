package pokeapi

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/KridtinC/pocketbase/internal/core/domain"
)

// GetPokemon fetches /pokemon/{id} and the linked /pokemon-species/{id} so it
// can return a fully-populated domain.Pokemon (egg groups, localized names,
// evolution chain id all live on the species resource).
func (c *Client) GetPokemon(ctx context.Context, id int) (domain.Pokemon, error) {
	var p pokemonResp
	if err := c.getJSON(ctx, c.url(fmt.Sprintf("/pokemon/%d", id)), &p); err != nil {
		return domain.Pokemon{}, fmt.Errorf("get pokemon %d: %w", id, err)
	}
	speciesID := id
	if p.Species.URL != "" {
		if sid, ok := lastIDFromURL(p.Species.URL); ok {
			speciesID = sid
		}
	}
	var sp speciesResp
	if err := c.getJSON(ctx, c.url(fmt.Sprintf("/pokemon-species/%d", speciesID)), &sp); err != nil {
		return domain.Pokemon{}, fmt.Errorf("get species %d: %w", speciesID, err)
	}
	chainID, _ := lastIDFromURL(sp.EvolutionChain.URL)

	out := domain.Pokemon{
		ID:               p.ID,
		Name:             p.Name,
		Height:           p.Height,
		Weight:           p.Weight,
		BaseExperience:   p.BaseExperience,
		CaptureRate:      sp.CaptureRate,
		GenderRate:       sp.GenderRate,
		EvolutionChainID: chainID,
		SpeciesID:        speciesID,
	}

	// Names + genus (en/ja).
	out.Names = pickLocalizedName(sp.Names)
	if out.Names.En == "" {
		out.Names.En = strings.Title(p.Name)
	}
	for _, g := range sp.Genera {
		switch g.Language.Name {
		case "en":
			out.Genus.En = g.Genus
		case "ja", "ja-Hrkt":
			if out.Genus.Ja == "" {
				out.Genus.Ja = g.Genus
			}
		}
	}

	// Types.
	out.Types = make([]string, 0, len(p.Types))
	for _, t := range p.Types {
		out.Types = append(out.Types, t.Type.Name)
	}

	// Stats + EV yield.
	for _, st := range p.Stats {
		switch st.Stat.Name {
		case "hp":
			out.Stats.HP = st.BaseStat
			out.EVYield.HP = st.Effort
		case "attack":
			out.Stats.Attack = st.BaseStat
			out.EVYield.Attack = st.Effort
		case "defense":
			out.Stats.Defense = st.BaseStat
			out.EVYield.Defense = st.Effort
		case "special-attack":
			out.Stats.SpecialAttack = st.BaseStat
			out.EVYield.SpecialAttack = st.Effort
		case "special-defense":
			out.Stats.SpecialDefense = st.BaseStat
			out.EVYield.SpecialDefense = st.Effort
		case "speed":
			out.Stats.Speed = st.BaseStat
			out.EVYield.Speed = st.Effort
		}
	}

	// Abilities.
	out.Abilities = make([]domain.PokemonAbility, 0, len(p.Abilities))
	for _, a := range p.Abilities {
		out.Abilities = append(out.Abilities, domain.PokemonAbility{
			Name: a.Ability.Name, IsHidden: a.IsHidden, Slot: a.Slot,
		})
	}

	// Egg groups.
	out.EggGroups = make([]string, 0, len(sp.EggGroups))
	for _, e := range sp.EggGroups {
		out.EggGroups = append(out.EggGroups, e.Name)
	}

	// Sprites.
	out.Sprites = domain.Sprites{
		Default:              p.Sprites.FrontDefault,
		Shiny:                p.Sprites.FrontShiny,
		OfficialArtwork:      p.Sprites.Other.OfficialArtwork.FrontDefault,
		OfficialArtworkShiny: p.Sprites.Other.OfficialArtwork.FrontShiny,
	}

	// Cry.
	if p.Cries.Latest != "" {
		out.Cry = p.Cries.Latest
	} else {
		out.Cry = p.Cries.Legacy
	}

	// Moves: pick the latest version-group entry per move to keep the doc compact.
	out.Moves = make([]domain.LearnedMove, 0, len(p.Moves))
	for _, mv := range p.Moves {
		if len(mv.VersionGroupDetails) == 0 {
			continue
		}
		d := mv.VersionGroupDetails[len(mv.VersionGroupDetails)-1]
		out.Moves = append(out.Moves, domain.LearnedMove{
			Name:         mv.Move.Name,
			LearnMethod:  d.MoveLearnMethod.Name,
			Level:        d.LevelLearnedAt,
			VersionGroup: d.VersionGroup.Name,
		})
	}

	return out, nil
}

func pickLocalizedName(names []localizedName) domain.Localized {
	var out domain.Localized
	for _, n := range names {
		switch n.Language.Name {
		case "en":
			out.En = n.Name
		case "ja":
			if out.Ja == "" {
				out.Ja = n.Name
			}
		case "ja-Hrkt":
			out.Ja = n.Name // prefer the kana form when present
		}
	}
	return out
}

// lastIDFromURL parses the trailing numeric segment from a PokéAPI URL of the
// form ".../resource/123/" — used to discover the species/evolution-chain id.
func lastIDFromURL(u string) (int, bool) {
	u = strings.TrimSuffix(u, "/")
	idx := strings.LastIndex(u, "/")
	if idx < 0 {
		return 0, false
	}
	id, err := strconv.Atoi(u[idx+1:])
	if err != nil {
		return 0, false
	}
	return id, true
}
