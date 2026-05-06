package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"sync"
	"sync/atomic"
	"time"

	"github.com/KridtinC/pocketbase/internal/core/port"
)

// onlySet converts opts.Only into a set for O(1) lookup.
// An empty set means "sync all".
func onlySet(opts port.SyncOptions) map[string]bool {
	if len(opts.Only) == 0 {
		return nil
	}
	m := make(map[string]bool, len(opts.Only))
	for _, k := range opts.Only {
		m[k] = true
	}
	return m
}

func shouldSync(set map[string]bool, key string) bool {
	return set == nil || set[key]
}

type SyncDeps struct {
	Client      port.PokeAPIClient
	Pokemon     port.PokemonRepo
	Moves       port.MoveRepo
	Abilities   port.AbilityRepo
	Types       port.TypeRepo
	EggGroups   port.EggGroupRepo
	Evolutions  port.EvolutionRepo
	Items       port.ItemRepo
	Natures     port.NatureRepo
	Logger      *slog.Logger
	Concurrency int
}

type syncService struct {
	d SyncDeps
}

func NewSyncService(d SyncDeps) port.SyncService {
	if d.Concurrency <= 0 {
		d.Concurrency = 4
	}
	if d.Logger == nil {
		d.Logger = slog.Default()
	}
	return &syncService{d: d}
}

func (s *syncService) Run(ctx context.Context, opts port.SyncOptions) (port.SyncReport, error) {
	start := time.Now()
	rep := port.SyncReport{}
	log := s.d.Logger
	only := onlySet(opts)

	// Step 1: types (small, sequential).
	if shouldSync(only, "types") {
		typeNames, err := s.d.Client.ListTypeNames(ctx)
		if err != nil {
			return rep, err
		}
		log.Info("syncing types", "count", len(typeNames))
		for _, n := range typeNames {
			if !opts.Force {
				if _, err := s.d.Types.GetByName(ctx, n); err == nil {
					continue // already exists
				}
			}
			t, err := s.d.Client.GetType(ctx, n)
			if err != nil {
				log.Error("fetch type", "name", n, "err", err)
				rep.Errors++
				continue
			}
			t.UpdatedAt = time.Now()
			if err := s.d.Types.Upsert(ctx, t); err != nil {
				log.Error("save type", "name", n, "err", err)
				rep.Errors++
				continue
			}
			rep.Types++
		}
	}

	// Step 2: egg groups (small, sequential).
	if shouldSync(only, "egg-groups") {
		egNames, err := s.d.Client.ListEggGroupNames(ctx)
		if err != nil {
			return rep, err
		}
		log.Info("syncing egg groups", "count", len(egNames))
		for _, n := range egNames {
			if !opts.Force {
				if _, err := s.d.EggGroups.GetByName(ctx, n); err == nil {
					continue
				}
			}
			g, err := s.d.Client.GetEggGroup(ctx, n)
			if err != nil {
				log.Error("fetch egg group", "name", n, "err", err)
				rep.Errors++
				continue
			}
			g.UpdatedAt = time.Now()
			if err := s.d.EggGroups.Upsert(ctx, g); err != nil {
				log.Error("save egg group", "name", n, "err", err)
				rep.Errors++
				continue
			}
			rep.EggGroups++
		}
	}

	// Step 3: natures (small, sequential).
	if shouldSync(only, "natures") {
		natureNames, err := s.d.Client.ListNatureNames(ctx)
		if err != nil {
			return rep, err
		}
		log.Info("syncing natures", "count", len(natureNames))
		for _, n := range natureNames {
			if !opts.Force {
				if _, err := s.d.Natures.GetByName(ctx, n); err == nil {
					continue
				}
			}
			nat, err := s.d.Client.GetNature(ctx, n)
			if err != nil {
				log.Error("fetch nature", "name", n, "err", err)
				rep.Errors++
				continue
			}
			nat.UpdatedAt = time.Now()
			if err := s.d.Natures.Upsert(ctx, nat); err != nil {
				log.Error("save nature", "name", n, "err", err)
				rep.Errors++
				continue
			}
			rep.Natures++
		}
	}

	// Step 4: abilities (medium, concurrent).
	if shouldSync(only, "abilities") {
		abilityNames, err := s.d.Client.ListAbilityNames(ctx)
		if err != nil {
			return rep, err
		}
		log.Info("syncing abilities", "count", len(abilityNames))
		rep.Abilities = s.runStrings(ctx, abilityNames, &rep.Errors, func(ctx context.Context, name string) error {
			if !opts.Force {
				if _, err := s.d.Abilities.GetByName(ctx, name); err == nil {
					return nil
				}
			}
			a, err := s.d.Client.GetAbility(ctx, name)
			if err != nil {
				return err
			}
			a.UpdatedAt = time.Now()
			return s.d.Abilities.Upsert(ctx, a)
		})
	}

	// Step 5: moves (large, concurrent).
	if shouldSync(only, "moves") {
		moveNames, err := s.d.Client.ListMoveNames(ctx)
		if err != nil {
			return rep, err
		}
		log.Info("syncing moves", "count", len(moveNames))
		rep.Moves = s.runStrings(ctx, moveNames, &rep.Errors, func(ctx context.Context, name string) error {
			if !opts.Force {
				if _, err := s.d.Moves.GetByName(ctx, name); err == nil {
					return nil
				}
			}
			m, err := s.d.Client.GetMove(ctx, name)
			if err != nil {
				return err
			}
			m.UpdatedAt = time.Now()
			return s.d.Moves.Upsert(ctx, m)
		})
	}

	// Step 6: items (large, concurrent).
	if shouldSync(only, "items") {
		itemNames, err := s.d.Client.ListItemNames(ctx)
		if err != nil {
			return rep, err
		}
		log.Info("syncing items", "count", len(itemNames))
		rep.Items = s.runStrings(ctx, itemNames, &rep.Errors, func(ctx context.Context, name string) error {
			if !opts.Force {
				if _, err := s.d.Items.GetByName(ctx, name); err == nil {
					return nil
				}
			}
			i, err := s.d.Client.GetItem(ctx, name)
			if err != nil {
				return err
			}
			i.UpdatedAt = time.Now()
			return s.d.Items.Upsert(ctx, i)
		})
	}

	// Step 7: pokémon (largest, concurrent).
	if shouldSync(only, "pokemon") {
		max := opts.MaxPokemon
		if max <= 0 {
			max = 1025
		}
		pokeIDs, err := s.d.Client.ListPokemonIDs(ctx, max)
		if err != nil {
			return rep, err
		}
		log.Info("syncing pokemon", "count", len(pokeIDs))

		var seenChain sync.Map
		var evoCount int32

		rep.Pokemon = s.runInts(ctx, pokeIDs, &rep.Errors, func(ctx context.Context, id int) error {
			if !opts.Force {
				if _, err := s.d.Pokemon.GetByIDOrName(ctx, fmt.Sprintf("%d", id)); err == nil {
					return nil
				}
			}
			p, err := s.d.Client.GetPokemon(ctx, id)
			if err != nil {
				return err
			}
			p.UpdatedAt = time.Now()
			if err := s.d.Pokemon.Upsert(ctx, p); err != nil {
				return err
			}
			if p.EvolutionChainID > 0 {
				if _, loaded := seenChain.LoadOrStore(p.EvolutionChainID, true); !loaded {
					chain, err := s.d.Client.GetEvolutionChain(ctx, p.EvolutionChainID)
					if err != nil {
						return err
					}
					chain.UpdatedAt = time.Now()
					if err := s.d.Evolutions.Upsert(ctx, chain); err != nil {
						return err
					}
					atomic.AddInt32(&evoCount, 1)
				}
			}
			return nil
		})

		rep.Evolutions = int(atomic.LoadInt32(&evoCount))
	}

	// Step 8: pokedexes — build species→dex map and tag each Pokémon.
	if shouldSync(only, "pokedexes") || shouldSync(only, "pokemon") {
		dexNames, err := s.d.Client.ListPokedexNames(ctx)
		if err != nil {
			log.Error("list pokedexes", "err", err)
		} else {
			log.Info("syncing pokedexes", "count", len(dexNames))
			// Build species→set-of-dex-names map by iterating all pokedexes.
			speciesDex := make(map[string]map[string]bool, 2048)
			for _, dexName := range dexNames {
				species, err := s.d.Client.GetPokedex(ctx, dexName)
				if err != nil {
					log.Error("fetch pokedex", "name", dexName, "err", err)
					rep.Errors++
					continue
				}
				for _, sp := range species {
					if speciesDex[sp] == nil {
						speciesDex[sp] = make(map[string]bool)
					}
					speciesDex[sp][dexName] = true
				}
				rep.Pokedexes++
			}
			// Write pokedexes to each Pokémon document.
			for speciesName, dexMap := range speciesDex {
				dexes := make([]string, 0, len(dexMap))
				for d := range dexMap {
					dexes = append(dexes, d)
				}
				if err := s.d.Pokemon.SetPokedexes(ctx, speciesName, dexes); err != nil {
					log.Error("set pokedexes", "species", speciesName, "err", err)
					rep.Errors++
				}
			}
		}
	}

	rep.DurationMs = time.Since(start).Milliseconds()
	log.Info("sync complete",
		"pokemon", rep.Pokemon, "moves", rep.Moves, "abilities", rep.Abilities,
		"types", rep.Types, "egg_groups", rep.EggGroups, "evolutions", rep.Evolutions,
		"items", rep.Items, "natures", rep.Natures, "pokedexes", rep.Pokedexes,
		"errors", rep.Errors, "duration_ms", rep.DurationMs)

	if rep.Errors > 0 && rep.Pokemon == 0 && rep.Items == 0 && rep.Natures == 0 {
		return rep, errors.New("sync failed entirely")
	}
	return rep, nil
}

func (s *syncService) runStrings(ctx context.Context, names []string, errCount *int, fn func(context.Context, string) error) int {
	return s.runWorkers(ctx, len(names), errCount, func(i int) error {
		return fn(ctx, names[i])
	})
}

func (s *syncService) runInts(ctx context.Context, ids []int, errCount *int, fn func(context.Context, int) error) int {
	return s.runWorkers(ctx, len(ids), errCount, func(i int) error {
		return fn(ctx, ids[i])
	})
}

func (s *syncService) runWorkers(ctx context.Context, n int, errCount *int, fn func(int) error) int {
	if n == 0 {
		return 0
	}
	jobs := make(chan int)
	var wg sync.WaitGroup
	var ok int32
	var errs int32

	for w := 0; w < s.d.Concurrency; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i := range jobs {
				if ctx.Err() != nil {
					return
				}
				if err := fn(i); err != nil {
					s.d.Logger.Error("worker error", "err", err)
					atomic.AddInt32(&errs, 1)
					continue
				}
				atomic.AddInt32(&ok, 1)
			}
		}()
	}

	for i := 0; i < n; i++ {
		select {
		case <-ctx.Done():
			close(jobs)
			wg.Wait()
			*errCount += int(atomic.LoadInt32(&errs))
			return int(atomic.LoadInt32(&ok))
		case jobs <- i:
		}
	}
	close(jobs)
	wg.Wait()
	*errCount += int(atomic.LoadInt32(&errs))
	return int(atomic.LoadInt32(&ok))
}
