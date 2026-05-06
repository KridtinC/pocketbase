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

type damageRelationsDoc struct {
	DoubleDamageTo   []string `bson:"double_damage_to"`
	HalfDamageTo     []string `bson:"half_damage_to"`
	NoDamageTo       []string `bson:"no_damage_to"`
	DoubleDamageFrom []string `bson:"double_damage_from"`
	HalfDamageFrom   []string `bson:"half_damage_from"`
	NoDamageFrom     []string `bson:"no_damage_from"`
}

type typeDoc struct {
	Name            string             `bson:"_id"`
	Names           localizedDoc       `bson:"names"`
	DamageRelations damageRelationsDoc `bson:"damage_relations"`
	UpdatedAt       time.Time          `bson:"updated_at"`
}

func (d typeDoc) toDomain() domain.Type {
	return domain.Type{
		Name: d.Name, Names: domain.Localized(d.Names),
		DamageRelations: domain.DamageRelations(d.DamageRelations),
		UpdatedAt:       d.UpdatedAt,
	}
}

func toDocType(t domain.Type) typeDoc {
	return typeDoc{
		Name: t.Name, Names: localizedDoc(t.Names),
		DamageRelations: damageRelationsDoc(t.DamageRelations),
		UpdatedAt:       t.UpdatedAt,
	}
}

type TypeRepo struct {
	coll *mongo.Collection
}

func NewTypeRepo(db *mongo.Database) port.TypeRepo {
	return &TypeRepo{coll: db.Collection("types")}
}

func (r *TypeRepo) List(ctx context.Context) ([]domain.Type, error) {
	cur, err := r.coll.Find(ctx, bson.M{}, options.Find().SetSort(bson.D{{Key: "_id", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	var docs []typeDoc
	if err := cur.All(ctx, &docs); err != nil {
		return nil, err
	}
	items := make([]domain.Type, len(docs))
	for i, d := range docs {
		items[i] = d.toDomain()
	}
	return items, nil
}

func (r *TypeRepo) GetByName(ctx context.Context, name string) (domain.Type, error) {
	var d typeDoc
	err := r.coll.FindOne(ctx, bson.M{"_id": name}).Decode(&d)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return domain.Type{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.Type{}, err
	}
	return d.toDomain(), nil
}

func (r *TypeRepo) Upsert(ctx context.Context, t domain.Type) error {
	d := toDocType(t)
	_, err := r.coll.ReplaceOne(ctx, bson.M{"_id": d.Name}, d, options.Replace().SetUpsert(true))
	return err
}
