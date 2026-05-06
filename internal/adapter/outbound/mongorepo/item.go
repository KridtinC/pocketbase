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

type itemDoc struct {
	Name        string       `bson:"_id"`
	Names       localizedDoc `bson:"names"`
	Cost        int          `bson:"cost"`
	Category    string       `bson:"category"`
	Effect      string       `bson:"effect,omitempty"`
	ShortEffect string       `bson:"short_effect,omitempty"`
	ImageURL    string       `bson:"image_url,omitempty"`
	UpdatedAt   time.Time    `bson:"updated_at"`
}

func (d itemDoc) toDomain() domain.Item {
	return domain.Item{
		Name: d.Name, Names: domain.Localized(d.Names),
		Cost: d.Cost, Category: d.Category,
		Effect: d.Effect, ShortEffect: d.ShortEffect,
		ImageURL: d.ImageURL, UpdatedAt: d.UpdatedAt,
	}
}

func toDocItem(i domain.Item) itemDoc {
	return itemDoc{
		Name: i.Name, Names: localizedDoc(i.Names),
		Cost: i.Cost, Category: i.Category,
		Effect: i.Effect, ShortEffect: i.ShortEffect,
		ImageURL: i.ImageURL, UpdatedAt: i.UpdatedAt,
	}
}

type ItemRepo struct{ coll *mongo.Collection }

func NewItemRepo(db *mongo.Database) port.ItemRepo {
	return &ItemRepo{coll: db.Collection("items")}
}

func (r *ItemRepo) List(ctx context.Context, f port.ItemFilter) (port.ItemPage, error) {
	filter := bson.M{}
	if f.Search != "" {
		filter["_id"] = bson.M{"$regex": f.Search, "$options": "i"}
	}
	if f.Category != "" {
		filter["category"] = f.Category
	}
	order := 1
	if f.SortOrder == "desc" {
		order = -1
	}
	total, err := r.coll.CountDocuments(ctx, filter)
	if err != nil {
		return port.ItemPage{}, err
	}
	cur, err := r.coll.Find(ctx, filter,
		options.Find().
			SetSort(bson.D{{Key: "_id", Value: order}}).
			SetSkip(int64((f.Page-1)*f.Limit)).
			SetLimit(int64(f.Limit)),
	)
	if err != nil {
		return port.ItemPage{}, err
	}
	defer cur.Close(ctx)
	var docs []itemDoc
	if err := cur.All(ctx, &docs); err != nil {
		return port.ItemPage{}, err
	}
	items := make([]domain.Item, len(docs))
	for i, d := range docs {
		items[i] = d.toDomain()
	}
	return port.ItemPage{Items: items, Total: total, Page: f.Page, Limit: f.Limit}, nil
}

func (r *ItemRepo) GetByName(ctx context.Context, name string) (domain.Item, error) {
	var d itemDoc
	err := r.coll.FindOne(ctx, bson.M{"_id": name}).Decode(&d)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return domain.Item{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.Item{}, err
	}
	return d.toDomain(), nil
}

func (r *ItemRepo) Upsert(ctx context.Context, i domain.Item) error {
	d := toDocItem(i)
	_, err := r.coll.ReplaceOne(ctx, bson.M{"_id": d.Name}, d, options.Replace().SetUpsert(true))
	return err
}

func (r *ItemRepo) ListCategories(ctx context.Context) ([]string, error) {
	vals, err := r.coll.Distinct(ctx, "category", bson.M{})
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
