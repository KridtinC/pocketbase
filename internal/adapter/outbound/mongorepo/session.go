package mongorepo

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/KridtinC/pocketbase/internal/core/domain"
	"github.com/KridtinC/pocketbase/internal/core/port"
)

type sessionDoc struct {
	ID                string    `bson:"_id"`
	UserID            string    `bson:"user_id"`
	FamilyID          string    `bson:"family_id"`
	RefreshTokenHash  string    `bson:"refresh_token_hash"`
	Revoked           bool      `bson:"revoked"`
	ReplacedBySession string    `bson:"replaced_by,omitempty"`
	ExpiresAt         time.Time `bson:"expires_at"`
	CreatedAt         time.Time `bson:"created_at"`
}

func (d sessionDoc) toDomain() domain.Session {
	return domain.Session{
		ID: d.ID, UserID: d.UserID, FamilyID: d.FamilyID,
		RefreshTokenHash: d.RefreshTokenHash, Revoked: d.Revoked,
		ReplacedBySession: d.ReplacedBySession, ExpiresAt: d.ExpiresAt, CreatedAt: d.CreatedAt,
	}
}

func fromSessionDomain(s domain.Session) sessionDoc {
	return sessionDoc{
		ID: s.ID, UserID: s.UserID, FamilyID: s.FamilyID,
		RefreshTokenHash: s.RefreshTokenHash, Revoked: s.Revoked,
		ReplacedBySession: s.ReplacedBySession, ExpiresAt: s.ExpiresAt, CreatedAt: s.CreatedAt,
	}
}

type SessionRepo struct{ coll *mongo.Collection }

func NewSessionRepo(db *mongo.Database) port.SessionRepo {
	return &SessionRepo{coll: db.Collection("sessions")}
}

func (r *SessionRepo) Create(ctx context.Context, s domain.Session) error {
	_, err := r.coll.InsertOne(ctx, fromSessionDomain(s))
	return err
}

func (r *SessionRepo) GetByHash(ctx context.Context, refreshTokenHash string) (domain.Session, error) {
	var d sessionDoc
	err := r.coll.FindOne(ctx, bson.M{"refresh_token_hash": refreshTokenHash}).Decode(&d)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return domain.Session{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.Session{}, err
	}
	return d.toDomain(), nil
}

func (r *SessionRepo) Revoke(ctx context.Context, id, replacedBy string) error {
	set := bson.M{"revoked": true}
	if replacedBy != "" {
		set["replaced_by"] = replacedBy
	}
	_, err := r.coll.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": set})
	return err
}

func (r *SessionRepo) RevokeFamily(ctx context.Context, familyID string) error {
	_, err := r.coll.UpdateMany(ctx, bson.M{"family_id": familyID}, bson.M{"$set": bson.M{"revoked": true}})
	return err
}
