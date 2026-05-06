package pokeapi

import (
	"github.com/google/wire"

	"github.com/KridtinC/pocketbase/internal/core/port"
)

// asPort upcasts the concrete *Client to the outbound port. Wire requires a
// dedicated provider function to express the interface binding.
func asPort(c *Client) port.PokeAPIClient { return c }

var ProviderSet = wire.NewSet(
	NewClient,
	asPort,
)
