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

type moveDoc struct {
	Name        string       `bson:"_id"`
	Names       localizedDoc `bson:"names"`
	Power       *int         `bson:"power,omitempty"`
	Accuracy    *int         `bson:"accuracy,omitempty"`
	PP          *int         `bson:"pp,omitempty"`
	Priority    int          `bson:"priority"`
	Type        string       `bson:"type"`
	DamageClass string       `bson:"damage_class"`
	Target      string       `bson:"target"`
	Effect      string       `bson:"effect,omitempty"`
	ShortEffect string       `bson:"short_effect,omitempty"`
	UpdatedAt   time.Time    `bson:"updated_at"`
}

func toDocMove(m domain.Move) moveDoc {
	return moveDoc{
		Name: m.Name, Names: localizedDoc(m.Names),
		Power: m.Power, Accuracy: m.Accuracy, PP: m.PP,
		Priority: m.Priority, Type: m.Type, DamageClass: m.DamageClass,
		Target: m.Target, Effect: m.Effect, ShortEffect: m.ShortEffect,
		UpdatedAt: m.UpdatedAt,
	}
}

func (d moveDoc) toDomain() domain.Move {
	return domain.Move{
		Name: d.Name, Names: domain.Localized(d.Names),
		Power: d.Power, Accuracy: d.Accuracy, PP: d.PP,
		Priority: d.Priority, Type: d.Type, DamageClass: d.DamageClass,
		Target: d.Target, Effect: d.Effect, ShortEffect: d.ShortEffect,
		UpdatedAt: d.UpdatedAt,
	}
}

type MoveRepo struct {
	coll *mongo.Collection
}

func NewMoveRepo(db *mongo.Database) port.MoveRepo {
	return &MoveRepo{coll: db.Collection("moves")}
}

func (r *MoveRepo) List(ctx context.Context, f port.MoveFilter) (port.MovePage, error) {
	filter := bson.M{}
	if f.Search != "" {
		filter["_id"] = bson.M{"$regex": f.Search, "$options": "i"}
	}
	if f.Type != "" {
		filter["type"] = f.Type
	}
	if f.DamageClass != "" {
		filter["damage_class"] = f.DamageClass
	}
	order := 1
	if f.SortOrder == "desc" {
		order = -1
	}
	total, err := r.coll.CountDocuments(ctx, filter)
	if err != nil {
		return port.MovePage{}, err
	}
	cur, err := r.coll.Find(ctx, filter,
		options.Find().
			SetSort(bson.D{{Key: "_id", Value: order}}).
			SetSkip(int64((f.Page-1)*f.Limit)).
			SetLimit(int64(f.Limit)),
	)
	if err != nil {
		return port.MovePage{}, err
	}
	defer cur.Close(ctx)
	var docs []moveDoc
	if err := cur.All(ctx, &docs); err != nil {
		return port.MovePage{}, err
	}
	items := make([]domain.Move, len(docs))
	for i, d := range docs {
		items[i] = d.toDomain()
	}
	return port.MovePage{Items: items, Total: total, Page: f.Page, Limit: f.Limit}, nil
}

func (r *MoveRepo) GetByName(ctx context.Context, name string) (domain.Move, error) {
	var d moveDoc
	err := r.coll.FindOne(ctx, bson.M{"_id": name}).Decode(&d)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return domain.Move{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.Move{}, err
	}
	return d.toDomain(), nil
}

func (r *MoveRepo) Upsert(ctx context.Context, m domain.Move) error {
	d := toDocMove(m)
	_, err := r.coll.ReplaceOne(ctx, bson.M{"_id": d.Name}, d, options.Replace().SetUpsert(true))
	return err
}
