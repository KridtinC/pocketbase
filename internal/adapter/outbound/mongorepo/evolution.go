package mongorepo

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/KridtinC/pocketbase/internal/core/domain"
	"github.com/KridtinC/pocketbase/internal/core/port"
)

type evolutionStepDoc struct {
	Trigger      string `bson:"trigger,omitempty"`
	MinLevel     *int   `bson:"min_level,omitempty"`
	MinHappiness *int   `bson:"min_happiness,omitempty"`
	Item         string `bson:"item,omitempty"`
	HeldItem     string `bson:"held_item,omitempty"`
	TimeOfDay    string `bson:"time_of_day,omitempty"`
	Location     string `bson:"location,omitempty"`
	KnownMove    string `bson:"known_move,omitempty"`
	Gender       *int   `bson:"gender,omitempty"`
}

type evolutionNodeDoc struct {
	Species   string             `bson:"species"`
	Triggers  []evolutionStepDoc `bson:"triggers,omitempty"`
	EvolvesTo []evolutionNodeDoc `bson:"evolves_to,omitempty"`
}

type evolutionChainDoc struct {
	ID        int              `bson:"_id"`
	Root      evolutionNodeDoc `bson:"root"`
	UpdatedAt time.Time        `bson:"updated_at"`
}

func nodeToDoc(n domain.EvolutionNode) evolutionNodeDoc {
	steps := make([]evolutionStepDoc, len(n.Triggers))
	for i, t := range n.Triggers {
		steps[i] = evolutionStepDoc(t)
	}
	children := make([]evolutionNodeDoc, len(n.EvolvesTo))
	for i, c := range n.EvolvesTo {
		children[i] = nodeToDoc(c)
	}
	return evolutionNodeDoc{Species: n.Species, Triggers: steps, EvolvesTo: children}
}

func nodeToDomain(d evolutionNodeDoc) domain.EvolutionNode {
	steps := make([]domain.EvolutionStep, len(d.Triggers))
	for i, t := range d.Triggers {
		steps[i] = domain.EvolutionStep(t)
	}
	children := make([]domain.EvolutionNode, len(d.EvolvesTo))
	for i, c := range d.EvolvesTo {
		children[i] = nodeToDomain(c)
	}
	return domain.EvolutionNode{Species: d.Species, Triggers: steps, EvolvesTo: children}
}

type EvolutionRepo struct {
	coll *mongo.Collection
}

func NewEvolutionRepo(db *mongo.Database) port.EvolutionRepo {
	return &EvolutionRepo{coll: db.Collection("evolution_chains")}
}

func (r *EvolutionRepo) GetByID(ctx context.Context, id int) (domain.EvolutionChain, error) {
	var d evolutionChainDoc
	err := r.coll.FindOne(ctx, bson.M{"_id": id}).Decode(&d)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return domain.EvolutionChain{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.EvolutionChain{}, err
	}
	return domain.EvolutionChain{ID: d.ID, Root: nodeToDomain(d.Root), UpdatedAt: d.UpdatedAt}, nil
}

func (r *EvolutionRepo) Upsert(ctx context.Context, c domain.EvolutionChain) error {
	d := evolutionChainDoc{ID: c.ID, Root: nodeToDoc(c.Root), UpdatedAt: c.UpdatedAt}
	_, err := r.coll.ReplaceOne(ctx, bson.M{"_id": d.ID}, d, options.Replace().SetUpsert(true))
	return err
}
