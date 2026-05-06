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

type natureDoc struct {
	Name          string       `bson:"_id"`
	Names         localizedDoc `bson:"names"`
	IncreasedStat string       `bson:"increased_stat,omitempty"`
	DecreasedStat string       `bson:"decreased_stat,omitempty"`
	LikesFlavor   string       `bson:"likes_flavor,omitempty"`
	HatesFlavor   string       `bson:"hates_flavor,omitempty"`
	UpdatedAt     time.Time    `bson:"updated_at"`
}

func (d natureDoc) toDomain() domain.Nature {
	return domain.Nature{
		Name: d.Name, Names: domain.Localized(d.Names),
		IncreasedStat: d.IncreasedStat, DecreasedStat: d.DecreasedStat,
		LikesFlavor: d.LikesFlavor, HatesFlavor: d.HatesFlavor,
		UpdatedAt: d.UpdatedAt,
	}
}

func toDocNature(n domain.Nature) natureDoc {
	return natureDoc{
		Name: n.Name, Names: localizedDoc(n.Names),
		IncreasedStat: n.IncreasedStat, DecreasedStat: n.DecreasedStat,
		LikesFlavor: n.LikesFlavor, HatesFlavor: n.HatesFlavor,
		UpdatedAt: n.UpdatedAt,
	}
}

type NatureRepo struct{ coll *mongo.Collection }

func NewNatureRepo(db *mongo.Database) port.NatureRepo {
	return &NatureRepo{coll: db.Collection("natures")}
}

func (r *NatureRepo) List(ctx context.Context) ([]domain.Nature, error) {
	cur, err := r.coll.Find(ctx, bson.M{}, options.Find().SetSort(bson.D{{Key: "_id", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	var docs []natureDoc
	if err := cur.All(ctx, &docs); err != nil {
		return nil, err
	}
	out := make([]domain.Nature, len(docs))
	for i, d := range docs {
		out[i] = d.toDomain()
	}
	return out, nil
}

func (r *NatureRepo) GetByName(ctx context.Context, name string) (domain.Nature, error) {
	var d natureDoc
	err := r.coll.FindOne(ctx, bson.M{"_id": name}).Decode(&d)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return domain.Nature{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.Nature{}, err
	}
	return d.toDomain(), nil
}

func (r *NatureRepo) Upsert(ctx context.Context, n domain.Nature) error {
	d := toDocNature(n)
	_, err := r.coll.ReplaceOne(ctx, bson.M{"_id": d.Name}, d, options.Replace().SetUpsert(true))
	return err
}
