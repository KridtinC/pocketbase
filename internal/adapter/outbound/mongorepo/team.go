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

type statBlockDoc struct {
	HP             int `bson:"hp"`
	Attack         int `bson:"attack"`
	Defense        int `bson:"defense"`
	SpecialAttack  int `bson:"special_attack"`
	SpecialDefense int `bson:"special_defense"`
	Speed          int `bson:"speed"`
}

type teamMemberDoc struct {
	PokemonName string       `bson:"pokemon_name"`
	Nickname    string       `bson:"nickname,omitempty"`
	Level       int          `bson:"level"`
	Nature      string       `bson:"nature"`
	HeldItem    string       `bson:"held_item,omitempty"`
	Moves       []string     `bson:"moves,omitempty"`
	IVs         statBlockDoc `bson:"ivs"`
	EVs         statBlockDoc `bson:"evs"`
}

type teamDoc struct {
	ID        string          `bson:"_id"`
	Name      string          `bson:"name"`
	Members   []teamMemberDoc `bson:"members"`
	CreatedAt time.Time       `bson:"created_at"`
	UpdatedAt time.Time       `bson:"updated_at"`
}

func toStatBlock(d statBlockDoc) domain.StatBlock {
	return domain.StatBlock{HP: d.HP, Attack: d.Attack, Defense: d.Defense,
		SpecialAttack: d.SpecialAttack, SpecialDefense: d.SpecialDefense, Speed: d.Speed}
}

func fromStatBlock(s domain.StatBlock) statBlockDoc {
	return statBlockDoc{HP: s.HP, Attack: s.Attack, Defense: s.Defense,
		SpecialAttack: s.SpecialAttack, SpecialDefense: s.SpecialDefense, Speed: s.Speed}
}

func (d teamDoc) toDomain() domain.Team {
	members := make([]domain.TeamMember, len(d.Members))
	for i, m := range d.Members {
		members[i] = domain.TeamMember{
			PokemonName: m.PokemonName, Nickname: m.Nickname,
			Level: m.Level, Nature: m.Nature,
			HeldItem: m.HeldItem, Moves: m.Moves,
			IVs: toStatBlock(m.IVs), EVs: toStatBlock(m.EVs),
		}
	}
	return domain.Team{ID: d.ID, Name: d.Name, Members: members, CreatedAt: d.CreatedAt, UpdatedAt: d.UpdatedAt}
}

func toDocTeam(t domain.Team) teamDoc {
	members := make([]teamMemberDoc, len(t.Members))
	for i, m := range t.Members {
		members[i] = teamMemberDoc{
			PokemonName: m.PokemonName, Nickname: m.Nickname,
			Level: m.Level, Nature: m.Nature,
			HeldItem: m.HeldItem, Moves: m.Moves,
			IVs: fromStatBlock(m.IVs), EVs: fromStatBlock(m.EVs),
		}
	}
	return teamDoc{ID: t.ID, Name: t.Name, Members: members, CreatedAt: t.CreatedAt, UpdatedAt: t.UpdatedAt}
}

type TeamRepo struct{ coll *mongo.Collection }

func NewTeamRepo(db *mongo.Database) port.TeamRepo {
	return &TeamRepo{coll: db.Collection("teams")}
}

func (r *TeamRepo) List(ctx context.Context) ([]domain.Team, error) {
	cur, err := r.coll.Find(ctx, bson.M{}, options.Find().SetSort(bson.D{{Key: "updated_at", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	var docs []teamDoc
	if err := cur.All(ctx, &docs); err != nil {
		return nil, err
	}
	out := make([]domain.Team, len(docs))
	for i, d := range docs {
		out[i] = d.toDomain()
	}
	return out, nil
}

func (r *TeamRepo) GetByID(ctx context.Context, id string) (domain.Team, error) {
	var d teamDoc
	err := r.coll.FindOne(ctx, bson.M{"_id": id}).Decode(&d)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return domain.Team{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.Team{}, err
	}
	return d.toDomain(), nil
}

func (r *TeamRepo) Create(ctx context.Context, t domain.Team) error {
	_, err := r.coll.InsertOne(ctx, toDocTeam(t))
	return err
}

func (r *TeamRepo) Update(ctx context.Context, t domain.Team) error {
	d := toDocTeam(t)
	res, err := r.coll.ReplaceOne(ctx, bson.M{"_id": d.ID}, d)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *TeamRepo) Delete(ctx context.Context, id string) error {
	res, err := r.coll.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return domain.ErrNotFound
	}
	return nil
}
