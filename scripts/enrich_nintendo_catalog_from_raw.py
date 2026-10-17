from __future__ import annotations

import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path.cwd()
PROBE_DIR = ROOT / "data" / "nintendo_probe"
VISIBLE_FILE = ROOT / "data" / "nintendo_catalog.json"
EXTRAS_FILE = ROOT / "data" / "nintendo_catalog_extras.json"
META_FILE = ROOT / "data" / "nintendo_catalog_meta.json"
BACKUP_DIR = ROOT / "data" / "nintendo_catalog_backups"

IMAGE_BASE = "https://assets.nintendo.com/image/upload/q_auto/f_auto/"
VIDEO_BASE = "https://assets.nintendo.com/video/upload/q_auto/"


def load_json_scripts(raw_path: Path) -> list[Any]:
    text = raw_path.read_text(encoding="utf-8", errors="replace")
    patterns = [
        re.compile(r'<script[^>]+id=["\']__NEXT_DATA__["\'][^>]*>(.*?)</script>', re.I | re.S),
        re.compile(r'<script[^>]+type=["\']application/json["\'][^>]*>(.*?)</script>', re.I | re.S),
    ]
    payloads: list[Any] = []
    seen: set[str] = set()
    for pattern in patterns:
        for match in pattern.finditer(text):
            raw = match.group(1).strip()
            if not raw or raw in seen:
                continue
            seen.add(raw)
            try:
                payloads.append(json.loads(raw))
            except json.JSONDecodeError:
                pass
    return payloads


def merchandise_cards(payload: Any) -> list[dict[str, Any]]:
    try:
        grid = payload["props"]["pageProps"]["page"]["content"]["merchandisedGrid"]
    except (KeyError, TypeError):
        return []
    cards: list[dict[str, Any]] = []
    if not isinstance(grid, list):
        return cards
    for group in grid:
        if isinstance(group, list):
            cards.extend(card for card in group if isinstance(card, dict))
    return cards


def labels(values: Any) -> list[str]:
    if not isinstance(values, list):
        return []
    result = []
    for value in values:
        if isinstance(value, str) and value.strip():
            result.append(value.strip())
        elif isinstance(value, dict):
            label = value.get("label") or value.get("name")
            if isinstance(label, str) and label.strip():
                result.append(label.strip())
    return list(dict.fromkeys(result))


def media_url(asset: Any) -> tuple[str, str] | None:
    if not isinstance(asset, dict):
        return None
    public_id = asset.get("publicId")
    resource_type = str(asset.get("resourceType") or "image").lower()
    if not isinstance(public_id, str) or not public_id.strip():
        return None
    clean = public_id.strip().lstrip("/")
    if resource_type == "video":
        return "video", VIDEO_BASE + clean
    return "image", IMAGE_BASE + clean


def platform_code(product: dict[str, Any], card: dict[str, Any]) -> str | None:
    platform = product.get("platform")
    if isinstance(platform, dict):
        code = platform.get("code")
        if code == "NINTENDO_SWITCH_2":
            return "SWITCH_2"
        if code == "NINTENDO_SWITCH":
            return "SWITCH"
    raw = str(card.get("platformCode") or card.get("fullNamePlatform") or "")
    return "SWITCH_2" if "2" in raw else "SWITCH" if "SWITCH" in raw.upper() else None


def build_enrichment_index() -> dict[str, dict[str, Any]]:
    index: dict[str, dict[str, Any]] = {}
    for raw_path in sorted(PROBE_DIR.glob("store_mx_*.raw")):
        for payload in load_json_scripts(raw_path):
            for card in merchandise_cards(payload):
                variations = card.get("variations")
                if not isinstance(variations, list):
                    continue

                gallery_images: list[str] = []
                gallery_videos: list[str] = []
                for asset in card.get("productGallery") or []:
                    resolved = media_url(asset)
                    if not resolved:
                        continue
                    kind, url = resolved
                    (gallery_videos if kind == "video" else gallery_images).append(url)

                tags = card.get("tags") if isinstance(card.get("tags"), dict) else {}
                genres = labels(card.get("gameGenreLabels")) or labels(tags.get("genres"))
                features = labels(card.get("gameFeatureLabels")) or labels(tags.get("features"))
                ways_to_play = labels(card.get("waysToPlayLabels")) or labels(tags.get("waysToPlay"))
                player_count = card.get("playerCount")
                if not player_count:
                    players = card.get("numberOfPlayers")
                    if isinstance(players, dict) and isinstance(players.get("system"), dict):
                        player_count = players["system"].get("label")

                for variation in variations:
                    if not isinstance(variation, dict):
                        continue
                    product = variation.get("product")
                    if not isinstance(product, dict):
                        continue
                    nsuid = str(product.get("nsuid") or "").strip()
                    if not re.fullmatch(r"\d{10,20}", nsuid):
                        continue

                    prices = product.get("prices") if isinstance(product.get("prices"), dict) else {}
                    rating = product.get("contentRating") if isinstance(product.get("contentRating"), dict) else {}
                    descriptors = product.get("contentDescriptors")
                    eshop = product.get("eshopDetails") if isinstance(product.get("eshopDetails"), dict) else {}
                    image = media_url(product.get("productImage"))
                    square = product.get("productImageSquare") if isinstance(product.get("productImageSquare"), dict) else {}
                    platform = platform_code(product, card)

                    entry = {
                        "nsuid": nsuid,
                        "sku": product.get("sku"),
                        "url_key": product.get("urlKey"),
                        "availability": labels(product.get("availability")),
                        "genres": genres,
                        "features": features,
                        "ways_to_play": ways_to_play,
                        "player_count": player_count,
                        "nso_features": labels(card.get("nsoFeatures")),
                        "publisher": product.get("softwarePublisher"),
                        "developer": product.get("softwareDeveloper"),
                        "content_rating": {
                            "code": rating.get("code"),
                            "label": rating.get("label"),
                            "system": rating.get("system"),
                            "requires_age_gate": bool(rating.get("requiresAgeGate")),
                        },
                        "content_descriptors": labels(descriptors),
                        "demo_nsuid": product.get("demoNsuid"),
                        "discount_end": eshop.get("discountPriceEnd"),
                        "regular_price": prices.get("regularPrice"),
                        "sale_price": prices.get("finalPrice") if prices.get("discounted") else None,
                        "price_currency": prices.get("currency") or "MXN",
                        "percent_off": prices.get("percentOff") or 0,
                        "platform": platform,
                        "cover_url": image[1] if image and image[0] == "image" else None,
                        "square_image_url": square.get("url"),
                        "screenshots": list(dict.fromkeys(gallery_images)),
                        "videos": list(dict.fromkeys(gallery_videos)),
                        "edition_label": variation.get("label"),
                        "source_raw": str(raw_path.relative_to(ROOT)),
                    }
                    index[nsuid] = entry
    return index


def get_products(payload: dict[str, Any]) -> list[dict[str, Any]]:
    products = payload.get("products")
    if isinstance(products, list):
        return products
    games = payload.get("games")
    if isinstance(games, list):
        return games
    raise TypeError("Catalog payload has no products list")


def enrich_file(path: Path, index: dict[str, dict[str, Any]]) -> tuple[int, int]:
    payload = json.loads(path.read_text(encoding="utf-8-sig"))
    products = get_products(payload)
    matched = 0
    for product in products:
        nsuid = str(product.get("nsuid") or "")
        detail = index.get(nsuid)
        if not detail:
            continue
        matched += 1
        product["sku"] = detail["sku"]
        product["url_key"] = detail["url_key"]
        product["availability"] = detail["availability"]
        product["genres"] = detail["genres"]
        product["features"] = detail["features"]
        product["ways_to_play"] = detail["ways_to_play"]
        product["player_count"] = detail["player_count"]
        product["nso_features"] = detail["nso_features"]
        product["publishers"] = [detail["publisher"]] if detail["publisher"] else []
        product["developers"] = [detail["developer"]] if detail["developer"] else []
        product["content_rating"] = detail["content_rating"]
        product["content_descriptors"] = detail["content_descriptors"]
        product["demo_nsuid"] = detail["demo_nsuid"]
        product["sale_end"] = detail["discount_end"]
        product["regular_price"] = detail["regular_price"]
        product["sale_price"] = detail["sale_price"]
        product["price_currency"] = detail["price_currency"]
        product["percent_off"] = detail["percent_off"]
        product["screenshots"] = detail["screenshots"]
        product["videos"] = detail["videos"]
        product["edition_label"] = detail["edition_label"]
        if detail["cover_url"]:
            product["cover_url"] = detail["cover_url"]
        if detail["square_image_url"]:
            product["square_image_url"] = detail["square_image_url"]
        if detail["platform"]:
            product["platforms"] = [detail["platform"]]

    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return matched, len(products)


def main() -> int:
    for path in (VISIBLE_FILE, EXTRAS_FILE):
        if not path.is_file():
            print(f"[FAIL] Missing {path.relative_to(ROOT)}")
            return 1
    raw_files = sorted(PROBE_DIR.glob("store_mx_*.raw"))
    if not raw_files:
        print("[FAIL] No Nintendo raw files found in data/nintendo_probe")
        return 1

    index = build_enrichment_index()
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = BACKUP_DIR / stamp
    backup.mkdir(parents=True, exist_ok=True)
    for path in (VISIBLE_FILE, EXTRAS_FILE, META_FILE):
        if path.is_file():
            shutil.copy2(path, backup / path.name)

    visible_matched, visible_total = enrich_file(VISIBLE_FILE, index)
    extras_matched, extras_total = enrich_file(EXTRAS_FILE, index)

    if META_FILE.is_file():
        meta = json.loads(META_FILE.read_text(encoding="utf-8-sig"))
    else:
        meta = {}
    meta["enriched_at"] = datetime.now(timezone.utc).isoformat()
    meta["enrichment_source"] = "Nintendo Store Mexico merchandisedGrid"
    meta["enrichment_coverage"] = {
        "visible": {"matched": visible_matched, "total": visible_total},
        "extras": {"matched": extras_matched, "total": extras_total},
        "raw_products": len(index),
    }
    META_FILE.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"[OK] Raw Nintendo products indexed: {len(index)}")
    print(f"[OK] Visible enriched: {visible_matched} / {visible_total}")
    print(f"[OK] Extras enriched: {extras_matched} / {extras_total}")
    print(f"[OK] Backup: {backup.relative_to(ROOT)}")
    print("[OK] Added genres, features, ways to play, publisher, developer, ratings, media, prices, availability, demo and SKU")
    print("[NOTE] Description and public product URL remain unavailable in the listing snapshot")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
