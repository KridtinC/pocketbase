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

type abilityRowDoc struct {
	Name        string       `bson:"_id"`
	Names       localizedDoc `bson:"names"`
	Effect      string       `bson:"effect,omitempty"`
	ShortEffect string       `bson:"short_effect,omitempty"`
	UpdatedAt   time.Time    `bson:"updated_at"`
}

func (d abilityRowDoc) toDomain() domain.Ability {
	return domain.Ability{
		Name: d.Name, Names: domain.Localized(d.Names),
		Effect: d.Effect, ShortEffect: d.ShortEffect, UpdatedAt: d.UpdatedAt,
	}
}

func toDocAbility(a domain.Ability) abilityRowDoc {
	return abilityRowDoc{
		Name: a.Name, Names: localizedDoc(a.Names),
		Effect: a.Effect, ShortEffect: a.ShortEffect, UpdatedAt: a.UpdatedAt,
	}
}

type AbilityRepo struct {
	coll *mongo.Collection
}

func NewAbilityRepo(db *mongo.Database) port.AbilityRepo {
	return &AbilityRepo{coll: db.Collection("abilities")}
}

func (r *AbilityRepo) List(ctx context.Context, f port.ListFilter) (port.AbilityPage, error) {
	filter := bson.M{}
	if f.Search != "" {
		filter["_id"] = bson.M{"$regex": f.Search, "$options": "i"}
	}
	order := 1
	if f.SortOrder == "desc" {
		order = -1
	}
	total, err := r.coll.CountDocuments(ctx, filter)
	if err != nil {
		return port.AbilityPage{}, err
	}
	cur, err := r.coll.Find(ctx, filter,
		options.Find().
			SetSort(bson.D{{Key: "_id", Value: order}}).
			SetSkip(int64((f.Page-1)*f.Limit)).
			SetLimit(int64(f.Limit)),
	)
	if err != nil {
		return port.AbilityPage{}, err
	}
	defer cur.Close(ctx)
	var docs []abilityRowDoc
	if err := cur.All(ctx, &docs); err != nil {
		return port.AbilityPage{}, err
	}
	items := make([]domain.Ability, len(docs))
	for i, d := range docs {
		items[i] = d.toDomain()
	}
	return port.AbilityPage{Items: items, Total: total, Page: f.Page, Limit: f.Limit}, nil
}

func (r *AbilityRepo) GetByName(ctx context.Context, name string) (domain.Ability, error) {
	var d abilityRowDoc
	err := r.coll.FindOne(ctx, bson.M{"_id": name}).Decode(&d)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return domain.Ability{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.Ability{}, err
	}
	return d.toDomain(), nil
}

func (r *AbilityRepo) Upsert(ctx context.Context, a domain.Ability) error {
	d := toDocAbility(a)
	_, err := r.coll.ReplaceOne(ctx, bson.M{"_id": d.Name}, d, options.Replace().SetUpsert(true))
	return err
}

func (r *AbilityRepo) ListAllNames(ctx context.Context) ([]string, error) {
	cur, err := r.coll.Find(ctx, bson.M{}, options.Find().SetProjection(bson.M{"_id": 1}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	var rows []struct {
		ID string `bson:"_id"`
	}
	if err := cur.All(ctx, &rows); err != nil {
		return nil, err
	}
	out := make([]string, len(rows))
	for i, r := range rows {
		out[i] = r.ID
	}
	return out, nil
}
