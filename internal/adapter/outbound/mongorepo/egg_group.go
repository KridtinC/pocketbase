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

type eggGroupDoc struct {
	Name      string       `bson:"_id"`
	Names     localizedDoc `bson:"names"`
	UpdatedAt time.Time    `bson:"updated_at"`
}

func (d eggGroupDoc) toDomain() domain.EggGroup {
	return domain.EggGroup{Name: d.Name, Names: domain.Localized(d.Names), UpdatedAt: d.UpdatedAt}
}

func toDocEggGroup(g domain.EggGroup) eggGroupDoc {
	return eggGroupDoc{Name: g.Name, Names: localizedDoc(g.Names), UpdatedAt: g.UpdatedAt}
}

type EggGroupRepo struct {
	coll *mongo.Collection
}

func NewEggGroupRepo(db *mongo.Database) port.EggGroupRepo {
	return &EggGroupRepo{coll: db.Collection("egg_groups")}
}

func (r *EggGroupRepo) List(ctx context.Context, f port.ListFilter) (port.EggGroupPage, error) {
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
		return port.EggGroupPage{}, err
	}
	cur, err := r.coll.Find(ctx, filter,
		options.Find().
			SetSort(bson.D{{Key: "_id", Value: order}}).
			SetSkip(int64((f.Page-1)*f.Limit)).
			SetLimit(int64(f.Limit)),
	)
	if err != nil {
		return port.EggGroupPage{}, err
	}
	defer cur.Close(ctx)
	var docs []eggGroupDoc
	if err := cur.All(ctx, &docs); err != nil {
		return port.EggGroupPage{}, err
	}
	items := make([]domain.EggGroup, len(docs))
	for i, d := range docs {
		items[i] = d.toDomain()
	}
	return port.EggGroupPage{Items: items, Total: total, Page: f.Page, Limit: f.Limit}, nil
}

func (r *EggGroupRepo) GetByName(ctx context.Context, name string) (domain.EggGroup, error) {
	var d eggGroupDoc
	err := r.coll.FindOne(ctx, bson.M{"_id": name}).Decode(&d)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return domain.EggGroup{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.EggGroup{}, err
	}
	return d.toDomain(), nil
}

func (r *EggGroupRepo) Upsert(ctx context.Context, g domain.EggGroup) error {
	d := toDocEggGroup(g)
	_, err := r.coll.ReplaceOne(ctx, bson.M{"_id": d.Name}, d, options.Replace().SetUpsert(true))
	return err
}

func (r *EggGroupRepo) ListAllNames(ctx context.Context) ([]string, error) {
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
