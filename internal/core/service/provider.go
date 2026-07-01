package service

import "github.com/google/wire"

// ProviderSet wires up all inbound port implementations.
// SyncService is provided separately because it needs SyncDeps composition.
var ProviderSet = wire.NewSet(
	NewPokemonService,
	NewMoveService,
	NewAbilityService,
	NewTypeService,
	NewEggGroupService,
	NewEvolutionService,
	NewItemService,
	NewNatureService,
	NewTeamService,
	NewAuthService,
)

// SyncProviderSet wires the bulk-sync use case.
var SyncProviderSet = wire.NewSet(
	NewSyncService,
)
