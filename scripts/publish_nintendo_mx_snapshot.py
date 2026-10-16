#!/usr/bin/env python3
"""Publish a validated Nintendo Mexico snapshot for HEARTAGRAM preview.

This script does not modify JavaScript and does not delete IGDB data. It copies
validated Nintendo drafts into stable preview filenames under data/ and creates
metadata plus a rollback backup when a prior Nintendo snapshot exists.
"""

from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path.cwd()
PROBE = ROOT / "data" / "nintendo_probe"
VALIDATION = PROBE / "nintendo_catalog_validation.json"
SOURCE_CATALOG = PROBE / "nintendo_catalog_combined.json"
SOURCE_EXTRAS = PROBE / "nintendo_catalog_extras.json"
TARGET_CATALOG = ROOT / "data" / "nintendo_catalog.json"
TARGET_EXTRAS = ROOT / "data" / "nintendo_catalog_extras.json"
TARGET_META = ROOT / "data" / "nintendo_catalog_meta.json"
BACKUP_DIR = ROOT / "data" / "nintendo_catalog_backups"


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def load(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise SystemExit(f"[FAIL] Missing: {path.relative_to(ROOT)}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise SystemExit(f"[FAIL] Invalid JSON envelope: {path.relative_to(ROOT)}")
    return payload


def backup(path: Path, stamp: str) -> Path | None:
    if not path.exists():
        return None
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    destination = BACKUP_DIR / f"{path.stem}.{stamp}{path.suffix}"
    shutil.copy2(path, destination)
    return destination


def main() -> int:
    validation = load(VALIDATION)
    if validation.get("valid") is not True or validation.get("blocker_count") != 0:
        raise SystemExit("[FAIL] Validation is not passing. Snapshot was not published.")

    catalog = load(SOURCE_CATALOG)
    extras = load(SOURCE_EXTRAS)
    products = catalog.get("products")
    extra_products = extras.get("products")
    if not isinstance(products, list) or not products:
        raise SystemExit("[FAIL] Visible catalog is empty.")
    if not isinstance(extra_products, list):
        raise SystemExit("[FAIL] Extras catalog is invalid.")

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backups = [
        result
        for result in (
            backup(TARGET_CATALOG, stamp),
            backup(TARGET_EXTRAS, stamp),
            backup(TARGET_META, stamp),
        )
        if result is not None
    ]

    shutil.copy2(SOURCE_CATALOG, TARGET_CATALOG)
    shutil.copy2(SOURCE_EXTRAS, TARGET_EXTRAS)

    platform_counts: dict[str, int] = {}
    type_counts: dict[str, int] = {}
    for item in products + extra_products:
        product_type = str(item.get("product_type") or "unknown")
        type_counts[product_type] = type_counts.get(product_type, 0) + 1
        for platform in item.get("platforms", []):
            platform_counts[platform] = platform_counts.get(platform, 0) + 1

    meta = {
        "schema_version": "1.0.0",
        "source": "nintendo_mx",
        "region": "MX",
        "locale": "es-MX",
        "published_at": utc_now(),
        "preview_only": True,
        "visible_product_count": len(products),
        "extra_product_count": len(extra_products),
        "all_product_count": len(products) + len(extra_products),
        "platform_counts": platform_counts,
        "product_type_counts": type_counts,
        "validation_report": "data/nintendo_probe/nintendo_catalog_validation.json",
        "catalog_file": "data/nintendo_catalog.json",
        "extras_file": "data/nintendo_catalog_extras.json",
        "rollback_catalog_untouched": "data/catalog_igdb.json",
    }
    TARGET_META.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"[OK] Nintendo preview catalog: {TARGET_CATALOG.relative_to(ROOT)}")
    print(f"[OK] Nintendo extras: {TARGET_EXTRAS.relative_to(ROOT)}")
    print(f"[OK] Nintendo metadata: {TARGET_META.relative_to(ROOT)}")
    print(f"[CHECK] Visible products: {len(products)}")
    print(f"[CHECK] Extras: {len(extra_products)}")
    print(f"[CHECK] Backups created: {len(backups)}")
    print("[SAFE] Existing IGDB files were not modified or deleted.")
    print("[NEXT] Audit catalog.js and catalog-ui.js before enabling Nintendo preview.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
