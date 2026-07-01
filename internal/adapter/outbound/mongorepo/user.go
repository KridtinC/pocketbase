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

type userDoc struct {
	ID             string    `bson:"_id"`
	Provider       string    `bson:"provider"`
	ProviderUserID string    `bson:"provider_user_id"`
	Email          string    `bson:"email"`
	Name           string    `bson:"name"`
	AvatarURL      string    `bson:"avatar_url,omitempty"`
	CreatedAt      time.Time `bson:"created_at"`
}

func (d userDoc) toDomain() domain.User {
	return domain.User{
		ID: d.ID, Provider: d.Provider, ProviderUserID: d.ProviderUserID,
		Email: d.Email, Name: d.Name, AvatarURL: d.AvatarURL, CreatedAt: d.CreatedAt,
	}
}

func fromUserDomain(u domain.User) userDoc {
	return userDoc{
		ID: u.ID, Provider: u.Provider, ProviderUserID: u.ProviderUserID,
		Email: u.Email, Name: u.Name, AvatarURL: u.AvatarURL, CreatedAt: u.CreatedAt,
	}
}

type UserRepo struct{ coll *mongo.Collection }

func NewUserRepo(db *mongo.Database) port.UserRepo {
	return &UserRepo{coll: db.Collection("users")}
}

func (r *UserRepo) GetByProviderID(ctx context.Context, provider, providerUserID string) (domain.User, error) {
	var d userDoc
	err := r.coll.FindOne(ctx, bson.M{"provider": provider, "provider_user_id": providerUserID}).Decode(&d)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return domain.User{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.User{}, err
	}
	return d.toDomain(), nil
}

func (r *UserRepo) GetByID(ctx context.Context, id string) (domain.User, error) {
	var d userDoc
	err := r.coll.FindOne(ctx, bson.M{"_id": id}).Decode(&d)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return domain.User{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.User{}, err
	}
	return d.toDomain(), nil
}

// Upsert inserts the user on first login, or refreshes their profile fields
// on subsequent logins, keying on (provider, provider_user_id). The caller
// must have already set u.ID (used only on insert).
func (r *UserRepo) Upsert(ctx context.Context, u domain.User) (domain.User, error) {
	filter := bson.M{"provider": u.Provider, "provider_user_id": u.ProviderUserID}
	update := bson.M{
		"$set": bson.M{
			"email": u.Email, "name": u.Name, "avatar_url": u.AvatarURL,
		},
		"$setOnInsert": bson.M{
			"_id": u.ID, "provider": u.Provider, "provider_user_id": u.ProviderUserID,
			"created_at": u.CreatedAt,
		},
	}
	opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)
	var d userDoc
	if err := r.coll.FindOneAndUpdate(ctx, filter, update, opts).Decode(&d); err != nil {
		return domain.User{}, err
	}
	return d.toDomain(), nil
}
