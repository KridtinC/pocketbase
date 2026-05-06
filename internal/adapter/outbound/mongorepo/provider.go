package mongorepo

import "github.com/google/wire"

// ProviderSet provides the Mongo client, database handle, and all repository
// implementations bound to their outbound ports.
var ProviderSet = wire.NewSet(
	NewClient,
	NewDatabase,
	NewPokemonRepo,
	NewMoveRepo,
	NewAbilityRepo,
	NewTypeRepo,
	NewEggGroupRepo,
	NewEvolutionRepo,
	NewItemRepo,
	NewNatureRepo,
	NewTeamRepo,
)
