# Pokédex — Full-Stack App

A full-featured Pokédex webapp with 1025 Pokémon, moves, abilities, items, natures, a type matchup calculator, and a competitive team builder.

**Live demo:** [pocketbase.pages.dev](https://pocketbase.pages.dev)

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui |
| Backend | Go 1.22 · chi · hexagonal architecture |
| Database | MongoDB Atlas |
| Data | Bulk import from [PokéAPI](https://pokeapi.co) |
| Hosting | Cloudflare Pages (frontend) · Fly.io (API) |

---

## Features

### Pokédex
- Browse **1025 Pokémon** with infinite scroll
- Filter by **type**, **pokedex** (35 regional/national dexes), **name search**
- Sort by number, name, type, egg group, or ability
- Glassmorphism card design with dual-type gradients

### Pokémon Detail Page
- **About tab** — height, weight, category, base experience, catch rate, gender ratio (♂/♀), EV yield (all 6 stats), egg groups
- **Stats tab** — base stats with animated bars + total
- **Matchups tab** — type effectiveness chart (0×/¼×/½×/1×/2×/4×) computed from the Pokémon's type combination
- **Evolution tab** — full evolution chain with sprites and trigger conditions
- **Moves tab** — level-up moves and other moves (TM/egg/tutor)
- **Shiny toggle** — switch between normal and shiny official artwork
- **Ability cards** — each ability shown with its description and hidden ability badge

### Items
- Browse **2000+ items** with infinite scroll
- Filter by name or category
- Item sprites, cost, category, and effect description

### Abilities
- Browse **307 abilities** with search
- Effect descriptions

### Moves
- Browse **900+ moves** with search
- Filter by type and damage class (physical/special/status)
- Power, accuracy, PP, priority

### Natures
- All 25 natures with stat modifiers and flavor preferences

### Team Builder
- 6 Pokémon slots
- **Held item** search (from synced item database)
- **Moveset** — 4 move slots filtered to the Pokémon's actual learnset (all learn methods)
- **IV/EV** sliders + number inputs with 510 EV cap enforcement
- **Nature** selector with live stat modifier preview
- **Final stat calculator** — real Gen 8/9 formula with nature bonuses
- Save/load/delete teams (persisted to MongoDB)

---

## Quick start

### Prerequisites
- Docker + Docker Compose

### 1. Start services

```bash
docker compose up -d mongo api web
```

### 2. Run the bulk sync (one-time, ~10 minutes)

```bash
# Sync everything: 1025 Pokémon, 900+ moves, 307 abilities, 2176 items, 25 natures, 35 pokedexes
docker compose run --rm sync

# Sync only specific entities (skip what's already in DB):
docker compose run --rm sync sh -c '/usr/local/bin/sync -only items,natures'

# Force re-sync Pokémon (re-fetches all 1025 + pokedex tagging):
docker compose run --rm sync sh -c '/usr/local/bin/sync -only pokemon -force'
```

### 3. Open the app

[http://localhost:3000](http://localhost:3000)

API: [http://localhost:8080](http://localhost:8080)

---

## Project structure

```
.
├── cmd/
│   ├── api/            # HTTP server entry point + Wire DI wiring
│   └── sync/           # Bulk PokéAPI → MongoDB importer
├── internal/
│   ├── core/
│   │   ├── domain/     # Pure entities (no infra imports)
│   │   ├── port/       # Inbound + outbound interface definitions
│   │   └── service/    # Use-case implementations
│   └── adapter/
│       ├── inbound/http/           # chi router + request handlers
│       └── outbound/
│           ├── mongorepo/          # MongoDB persistence (own DTOs + mappers)
│           └── pokeapi/            # Rate-limited PokéAPI HTTP client
├── web/                # Next.js 14 frontend
│   ├── app/            # App Router pages
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   └── lib/            # API client, types, utilities
├── Dockerfile          # Multi-stage: builds api + sync binaries
└── docker-compose.yml
```

---

## API reference

Base URL: `http://localhost:8080`

### Pokémon

| Method | Path | Query params |
|--------|------|-------------|
| GET | `/api/pokemon` | `search`, `type`, `egg_group`, `ability`, `move`, `pokedex`, `sort`, `order`, `page`, `limit` |
| GET | `/api/pokemon/:idOrName` | — |
| GET | `/api/pokedexes` | — (returns all available pokedex slugs) |

### Moves

| Method | Path | Query params |
|--------|------|-------------|
| GET | `/api/moves` | `search`, `type`, `damage_class`, `order`, `page`, `limit` |
| GET | `/api/moves/:name` | — |

### Abilities

| Method | Path | Query params |
|--------|------|-------------|
| GET | `/api/abilities` | `search`, `order`, `page`, `limit` |
| GET | `/api/abilities/:name` | — |

### Items

| Method | Path | Query params |
|--------|------|-------------|
| GET | `/api/items` | `search`, `category`, `order`, `page`, `limit` |
| GET | `/api/items/categories` | — |
| GET | `/api/items/:name` | — |

### Types

| Method | Path |
|--------|------|
| GET | `/api/types` |
| GET | `/api/types/:name` |

### Egg Groups

| Method | Path | Query params |
|--------|------|-------------|
| GET | `/api/egg-groups` | `search`, `page`, `limit` |
| GET | `/api/egg-groups/:name` | — |

### Evolution Chains

| Method | Path |
|--------|------|
| GET | `/api/evolution-chains/:id` |

### Natures

| Method | Path |
|--------|------|
| GET | `/api/natures` |
| GET | `/api/natures/:name` |

### Teams

| Method | Path |
|--------|------|
| GET | `/api/teams` |
| POST | `/api/teams` |
| GET | `/api/teams/:id` |
| PUT | `/api/teams/:id` |
| DELETE | `/api/teams/:id` |

---

## Environment variables

### API / Sync shared

| Var | Default | Description |
|-----|---------|-------------|
| `MONGO_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGO_DB` | `pocketbase` | Database name |

### API only

| Var | Default |
|-----|---------|
| `HTTP_ADDR` | `:8080` |
| `CORS_ORIGIN` | `http://localhost:3000` |

### Sync only

| Var | Default | Description |
|-----|---------|-------------|
| `POKEAPI_BASE_URL` | `https://pokeapi.co/api/v2` | Override for testing |
| `POKEAPI_REQ_PER_SEC` | `8` | Sustained rate limit |
| `POKEAPI_BURST` | `4` | Burst capacity |
| `POKEAPI_CONCURRENCY` | `4` | Worker goroutines |

---

## Local development

```bash
# Run API locally (requires Mongo on :27017)
MONGO_URI=mongodb://localhost:27017 go run ./cmd/api

# Run sync locally
MONGO_URI=mongodb://localhost:27017 go run ./cmd/sync -- -max 20

# Frontend dev server
cd web && npm install && npm run dev
```

---

## Architecture notes

- **Hexagonal (ports & adapters)** — `internal/core/` has zero infra imports. Adapters wire in `cmd/` only.
- **Domain purity** — domain types use only `json` tags; BSON mapping lives in `mongorepo` DTOs.
- **Sync flags** — `-only a,b,c` syncs specific entity types; `-force` re-fetches docs that already exist; `-max N` limits Pokémon count for testing.
- **Pokedex tagging** — after Pokémon sync, all 35 PokeAPI pokedexes are fetched and each species is tagged with which dexes it belongs to, enabling regional filtering.
- **Rate limiting** — `golang.org/x/time/rate` token bucket in the PokéAPI adapter with exponential backoff on 429/5xx.

---

## Type icons

Place SVG files from [pokemon-type-icons](https://github.com/partywhale/pokemon-type-icons/tree/main/icons) into `web/public/types/`.

```bash
for t in normal fire water electric grass ice fighting poison ground flying psychic bug rock ghost dragon dark steel fairy; do
  curl -sL "https://raw.githubusercontent.com/partywhale/pokemon-type-icons/main/icons/${t}.svg" \
       -o "web/public/types/${t}.svg"
done
```
