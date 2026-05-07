package mongorepo

import (
	"context"
	"errors"
	"strconv"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/KridtinC/pocketbase/internal/core/domain"
	"github.com/KridtinC/pocketbase/internal/core/port"
)

type localizedDoc struct {
	En string `bson:"en,omitempty"`
	Ja string `bson:"ja,omitempty"`
}

type abilityDoc struct {
	Name     string `bson:"name"`
	IsHidden bool   `bson:"is_hidden"`
	Slot     int    `bson:"slot"`
}

type statsDoc struct {
	HP             int `bson:"hp"`
	Attack         int `bson:"attack"`
	Defense        int `bson:"defense"`
	SpecialAttack  int `bson:"special_attack"`
	SpecialDefense int `bson:"special_defense"`
	Speed          int `bson:"speed"`
}

type spritesDoc struct {
	Default              string `bson:"default,omitempty"`
	Shiny                string `bson:"shiny,omitempty"`
	OfficialArtwork      string `bson:"official_artwork,omitempty"`
	OfficialArtworkShiny string `bson:"official_artwork_shiny,omitempty"`
}

type learnedMoveDoc struct {
	Name         string `bson:"name"`
	LearnMethod  string `bson:"learn_method"`
	Level        int    `bson:"level"`
	VersionGroup string `bson:"version_group"`
}

type pokemonDoc struct {
	ID               int              `bson:"_id"`
	Name             string           `bson:"name"`
	Names            localizedDoc     `bson:"names"`
	Genus            localizedDoc     `bson:"genus"`
	Height           int              `bson:"height"`
	Weight           int              `bson:"weight"`
	BaseExperience   int              `bson:"base_experience"`
	Types            []string         `bson:"types"`
	Abilities        []abilityDoc     `bson:"abilities"`
	EggGroups        []string         `bson:"egg_groups"`
	Stats            statsDoc         `bson:"stats"`
	EVYield          statsDoc         `bson:"ev_yield"`
	CaptureRate      int              `bson:"capture_rate"`
	GenderRate       int              `bson:"gender_rate"`
	Sprites          spritesDoc       `bson:"sprites"`
	Cry              string           `bson:"cry,omitempty"`
	Moves            []learnedMoveDoc `bson:"moves"`
	Pokedexes        []string         `bson:"pokedexes,omitempty"`
	EvolutionChainID int              `bson:"evolution_chain_id"`
	SpeciesID        int              `bson:"species_id"`
	UpdatedAt        time.Time        `bson:"updated_at"`
}

func toDocPokemon(p domain.Pokemon) pokemonDoc {
	abs := make([]abilityDoc, len(p.Abilities))
	for i, a := range p.Abilities {
		abs[i] = abilityDoc(a)
	}
	mvs := make([]learnedMoveDoc, len(p.Moves))
	for i, m := range p.Moves {
		mvs[i] = learnedMoveDoc(m)
	}
	return pokemonDoc{
		ID: p.ID, Name: p.Name,
		Names: localizedDoc(p.Names), Genus: localizedDoc(p.Genus),
		Height: p.Height, Weight: p.Weight,
		BaseExperience: p.BaseExperience,
		Types: p.Types, Abilities: abs, EggGroups: p.EggGroups,
		Stats:       statsDoc(p.Stats),
		EVYield:     statsDoc(p.EVYield),
		CaptureRate: p.CaptureRate,
		GenderRate:  p.GenderRate,
		Sprites:     spritesDoc(p.Sprites),
		Cry:         p.Cry, Moves: mvs,
		Pokedexes:        p.Pokedexes,
		EvolutionChainID: p.EvolutionChainID, SpeciesID: p.SpeciesID,
		UpdatedAt: p.UpdatedAt,
	}
}

func (d pokemonDoc) toDomain() domain.Pokemon {
	abs := make([]domain.PokemonAbility, len(d.Abilities))
	for i, a := range d.Abilities {
		abs[i] = domain.PokemonAbility(a)
	}
	mvs := make([]domain.LearnedMove, len(d.Moves))
	for i, m := range d.Moves {
		mvs[i] = domain.LearnedMove(m)
	}
	return domain.Pokemon{
		ID: d.ID, Name: d.Name,
		Names: domain.Localized(d.Names), Genus: domain.Localized(d.Genus),
		Height: d.Height, Weight: d.Weight,
		BaseExperience: d.BaseExperience,
		Types: d.Types, Abilities: abs, EggGroups: d.EggGroups,
		Stats:       domain.PokemonStats(d.Stats),
		EVYield:     domain.PokemonStats(d.EVYield),
		CaptureRate: d.CaptureRate,
		GenderRate:  d.GenderRate,
		Sprites:     domain.Sprites(d.Sprites),
		Cry:         d.Cry, Moves: mvs,
		Pokedexes:        d.Pokedexes,
		EvolutionChainID: d.EvolutionChainID, SpeciesID: d.SpeciesID,
		UpdatedAt: d.UpdatedAt,
	}
}

type pokemonSummaryDoc struct {
	ID      int          `bson:"_id"`
	Name    string       `bson:"name"`
	Names   localizedDoc `bson:"names"`
	Types   []string     `bson:"types"`
	Sprites spritesDoc   `bson:"sprites"`
}

func (d pokemonSummaryDoc) toDomain() domain.PokemonSummary {
	return domain.PokemonSummary{
		ID: d.ID, Name: d.Name,
		Names:   domain.Localized(d.Names),
		Types:   d.Types,
		Sprites: domain.Sprites(d.Sprites),
	}
}

type PokemonRepo struct {
	coll *mongo.Collection
}

func NewPokemonRepo(db *mongo.Database) port.PokemonRepo {
	return &PokemonRepo{coll: db.Collection("pokemon")}
}

func (r *PokemonRepo) List(ctx context.Context, f port.PokemonFilter) (port.PokemonPage, error) {
	filter := bson.M{}
	if f.Search != "" {
		filter["name"] = bson.M{"$regex": f.Search, "$options": "i"}
	}
	if f.Type != "" {
		filter["types"] = f.Type
	}
	if f.EggGroup != "" {
		filter["egg_groups"] = f.EggGroup
	}
	if f.Ability != "" {
		filter["abilities.name"] = f.Ability
	}
	if f.Move != "" {
		filter["moves.name"] = f.Move
	}
	if f.Pokedex != "" {
		filter["pokedexes"] = f.Pokedex
	}

	sortField := "_id"
	switch f.SortBy {
	case "name":
		sortField = "name"
	case "type":
		sortField = "types.0"
	case "egg_group":
		sortField = "egg_groups.0"
	case "ability":
		sortField = "abilities.0.name"
	}
	order := 1
	if f.SortOrder == "desc" {
		order = -1
	}

	total, err := r.coll.CountDocuments(ctx, filter)
	if err != nil {
		return port.PokemonPage{}, err
	}

	skip := int64((f.Page - 1) * f.Limit)
	limit := int64(f.Limit)
	sortDoc := bson.D{{Key: sortField, Value: order}}
	if sortField != "_id" {
		sortDoc = append(sortDoc, bson.E{Key: "_id", Value: 1})
	}
	opts := options.Find().
		SetSort(sortDoc).
		SetSkip(skip).
		SetLimit(limit).
		SetProjection(bson.M{"_id": 1, "name": 1, "names": 1, "types": 1, "sprites": 1})

	cur, err := r.coll.Find(ctx, filter, opts)
	if err != nil {
		return port.PokemonPage{}, err
	}
	defer cur.Close(ctx)

	docs := make([]pokemonSummaryDoc, 0, f.Limit)
	if err := cur.All(ctx, &docs); err != nil {
		return port.PokemonPage{}, err
	}
	items := make([]domain.PokemonSummary, len(docs))
	for i, d := range docs {
		items[i] = d.toDomain()
	}
	return port.PokemonPage{Items: items, Total: total, Page: f.Page, Limit: f.Limit}, nil
}

func (r *PokemonRepo) GetByIDOrName(ctx context.Context, idOrName string) (domain.Pokemon, error) {
	var filter bson.M
	if id, err := strconv.Atoi(idOrName); err == nil {
		filter = bson.M{"_id": id}
	} else {
		filter = bson.M{"name": idOrName}
	}
	var d pokemonDoc
	err := r.coll.FindOne(ctx, filter).Decode(&d)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return domain.Pokemon{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.Pokemon{}, err
	}
	return d.toDomain(), nil
}

func (r *PokemonRepo) Upsert(ctx context.Context, p domain.Pokemon) error {
	d := toDocPokemon(p)
	_, err := r.coll.ReplaceOne(ctx,
		bson.M{"_id": d.ID},
		d,
		options.Replace().SetUpsert(true),
	)
	return err
}

func (r *PokemonRepo) SetPokedexes(ctx context.Context, pokemonName string, pokedexes []string) error {
	_, err := r.coll.UpdateOne(ctx,
		bson.M{"name": pokemonName},
		bson.M{"$set": bson.M{"pokedexes": pokedexes}},
	)
	return err
}

func (r *PokemonRepo) ListPokedexNames(ctx context.Context) ([]string, error) {
	vals, err := r.coll.Distinct(ctx, "pokedexes", bson.M{})
	if err != nil {
		return nil, err
	}
	out := make([]string, 0, len(vals))
	for _, v := range vals {
		if s, ok := v.(string); ok && s != "" {
			out = append(out, s)
		}
	}
	return out, nil
}

func (r *PokemonRepo) Count(ctx context.Context) (int64, error) {
	return r.coll.EstimatedDocumentCount(ctx)
}
