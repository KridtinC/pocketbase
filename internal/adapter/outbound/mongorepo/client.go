package mongorepo

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Config struct {
	URI      string
	Database string
}

// NewClient connects to Mongo and pings it.
func NewClient(ctx context.Context, cfg Config) (*mongo.Client, error) {
	if cfg.URI == "" {
		return nil, errors.New("mongo: empty URI")
	}
	c, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.URI))
	if err != nil {
		return nil, fmt.Errorf("mongo connect: %w", err)
	}
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := c.Ping(pingCtx, nil); err != nil {
		return nil, fmt.Errorf("mongo ping: %w", err)
	}
	return c, nil
}

// NewDatabase returns the application database handle.
func NewDatabase(client *mongo.Client, cfg Config) *mongo.Database {
	return client.Database(cfg.Database)
}

// EnsureIndexes creates the indexes the API relies on for fast queries.
// Idempotent — safe to call on every boot.
func EnsureIndexes(ctx context.Context, db *mongo.Database) error {
	type spec struct {
		coll string
		idx  []mongo.IndexModel
	}
	asc := func(field string) bson.D { return bson.D{{Key: field, Value: 1}} }

	specs := []spec{
		{"pokemon", []mongo.IndexModel{
			{Keys: asc("name"), Options: options.Index().SetUnique(true)},
			{Keys: asc("types")},
			{Keys: asc("egg_groups")},
			{Keys: asc("abilities.name")},
		}},
		{"moves", []mongo.IndexModel{
			{Keys: asc("type")},
			{Keys: asc("damage_class")},
		}},
		{"users", []mongo.IndexModel{
			{Keys: bson.D{{Key: "provider", Value: 1}, {Key: "provider_user_id", Value: 1}}, Options: options.Index().SetUnique(true)},
		}},
		{"sessions", []mongo.IndexModel{
			{Keys: asc("refresh_token_hash"), Options: options.Index().SetUnique(true)},
			{Keys: asc("family_id")},
			{Keys: asc("expires_at"), Options: options.Index().SetExpireAfterSeconds(0)},
		}},
		{"teams", []mongo.IndexModel{
			{Keys: asc("user_id")},
		}},
	}
	for _, s := range specs {
		if _, err := db.Collection(s.coll).Indexes().CreateMany(ctx, s.idx); err != nil {
			return fmt.Errorf("ensure indexes %s: %w", s.coll, err)
		}
	}
	return nil
}
