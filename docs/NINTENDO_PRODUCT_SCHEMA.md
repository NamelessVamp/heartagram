# NintendoProduct Schema

Version: `1.0.0`

## Purpose

`NintendoProduct` is HEARTAGRAM's normalized representation of an official Nintendo Store product. It intentionally models products, not abstract game records. A standard game, a Nintendo Switch 2 Edition, and a digital deluxe edition may be separate products while sharing the same `family_id`.

## Identity rules

1. `nsuid` is the preferred product identifier when the source provides it.
2. `product_code` may be used to relate regional products when available.
3. `slug` comes from the official Nintendo product URL.
4. `family_id` groups editions or platform variants without merging the products themselves.
5. HEARTAGRAM IDs should use `nintendo:<region>:<nsuid>` when `nsuid` exists.
6. If `nsuid` is absent, use `nintendo:<region>:slug:<slug>`.

## JSON shape

```json
{
  "schema_version": "1.0.0",
  "source": "nintendo_mx",
  "region": "MX",
  "locale": "es-MX",
  "nsuid": "70010000000025",
  "product_code": "HACAAAAAA",
  "slug": "example-game-switch",
  "store_url": "https://www.nintendo.com/es-mx/store/products/example-game-switch/",
  "title": "Example Game",
  "normalized_title": "Example Game",
  "description": "Official product description.",
  "product_type": "game",
  "edition_type": "standard",
  "family_id": "example-game-1234abcd",
  "platforms": ["SWITCH"],
  "genres": ["ADVENTURE"],
  "publishers": ["Example Publisher"],
  "developers": ["Example Studio"],
  "release_date": "2026-10-09",
  "cover_url": "https://assets.nintendo.com/image.jpg",
  "hero_url": null,
  "screenshots": [],
  "price_currency": "MXN",
  "regular_price": 1199.0,
  "sale_price": null,
  "sale_end": null,
  "free_to_play": false,
  "demo_available": false,
  "availability": "available",
  "related_products": [],
  "raw_id": "70010000000025",
  "fetched_at": "2026-10-09T18:00:00+00:00"
}
```

## Required fields

- `schema_version`
- `source`
- `region`
- `locale`
- `title`
- `normalized_title`
- `product_type`
- `edition_type`
- `family_id`
- `platforms`
- `availability`
- `fetched_at`

At least one stable locator is required:

- `nsuid`, or
- `store_url`, or
- `slug`

## Enumerations

### `product_type`

- `game`
- `bundle`
- `dlc`
- `upgrade_pack`
- `demo`
- `subscription`
- `unknown`

### `edition_type`

- `standard`
- `switch_2`
- `digital_deluxe`
- `deluxe`
- `complete`
- `ultimate`
- `collection`
- `bundle`
- `unknown`

### `platforms`

- `SWITCH`
- `SWITCH_2`

### `availability`

- `available`
- `preorder`
- `coming_soon`
- `delisted`
- `unknown`

## Publishing policy

The catalog publisher should include:

- Official digital games.
- Official digital bundles when the bundle is a distinct purchasable product.
- Nintendo Switch 2 Editions as distinct products connected by `family_id`.

The main catalog should exclude by default:

- Merchandise.
- Physical-only collector extras.
- Artbooks without a playable game.
- Soundtracks without a playable game.
- Guides.
- Currency packs.
- DLC-only products, unless the user enables an explicit DLC view.

## Snapshot envelope

```json
{
  "schema_version": "1.0.0",
  "source": "nintendo_mx",
  "region": "MX",
  "locale": "es-MX",
  "generated_at": "2026-10-09T18:00:00+00:00",
  "product_count": 0,
  "products": []
}
```

## Validation gates

A publishable snapshot must satisfy all of these conditions:

1. The source request completed successfully.
2. The snapshot contains at least one product.
3. Every product has a title and stable locator.
4. Duplicate NSUIDs are rejected.
5. Invalid product URLs are reported.
6. The previous valid snapshot is preserved if validation fails.
7. A sync report records added, updated, removed, excluded, and invalid products.

## Migration mapping

Old IDs should not be deleted automatically.

```text
Legacy catalog IDs -> ignored by the Nintendo-only static runtime
curated-id -> preserve until a confident Nintendo product match exists
nintendo:MX:<nsuid> -> final preferred ID
```

Ambiguous title matches belong in `data/nintendo_migration_review.json`.
