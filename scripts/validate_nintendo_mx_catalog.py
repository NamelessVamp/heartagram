#!/usr/bin/env python3
"""Validate the combined Nintendo Mexico draft before HEARTAGRAM integration.

The script is read-only. It never modifies the active catalog or draft files.
Run from the HEARTAGRAM repository root:
    python validate_nintendo_mx_catalog.py
"""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path.cwd()
PROBE = ROOT / "data" / "nintendo_probe"
CATALOG = PROBE / "nintendo_catalog_combined.json"
EXTRAS = PROBE / "nintendo_catalog_extras.json"
REPORT = PROBE / "nintendo_catalog_validation.json"

NSUID_RE = re.compile(r"^700\d{11}$")
VISIBLE_TYPES = {"game", "bundle"}
EXTRA_TYPES = {"dlc", "upgrade_pack", "demo"}
REQUIRED_TITLES = (
    "Bayonetta 3",
    "The Legend of Zelda: Tears of the Kingdom",
    "Persona 5 Tactica",
    "Stardew Valley",
    "Pokémon Pokopia",
)


def load(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise SystemExit(f"[FAIL] Missing file: {path.relative_to(ROOT)}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict) or not isinstance(payload.get("products"), list):
        raise SystemExit(f"[FAIL] Invalid envelope: {path.relative_to(ROOT)}")
    return payload


def present(product: dict[str, Any], key: str) -> bool:
    return product.get(key) not in (None, "", [], {})


def validate_collection(
    products: list[dict[str, Any]],
    allowed_types: set[str],
    label: str,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    issues: list[dict[str, Any]] = []
    ids: list[str] = []
    nsuids: list[str] = []

    for index, product in enumerate(products):
        identity = product.get("id")
        nsuid = str(product.get("nsuid") or "")
        title = product.get("title")
        product_type = product.get("product_type")

        if not isinstance(identity, str) or not identity.startswith("nintendo:MX:"):
            issues.append({"index": index, "title": title, "issue": "invalid_id"})
        else:
            ids.append(identity)

        if not NSUID_RE.fullmatch(nsuid):
            issues.append({"index": index, "title": title, "issue": "invalid_nsuid", "value": nsuid})
        else:
            nsuids.append(nsuid)

        if not isinstance(title, str) or not title.strip():
            issues.append({"index": index, "issue": "missing_title"})

        if product_type not in allowed_types:
            issues.append(
                {
                    "index": index,
                    "title": title,
                    "issue": "unexpected_product_type",
                    "value": product_type,
                }
            )

        if not product.get("platforms"):
            issues.append({"index": index, "title": title, "issue": "missing_platform"})

        if not present(product, "release_date"):
            issues.append({"index": index, "title": title, "issue": "missing_release_date"})

        if not present(product, "regular_price"):
            issues.append({"index": index, "title": title, "issue": "missing_regular_price"})

    duplicate_ids = sorted(key for key, count in Counter(ids).items() if count > 1)
    duplicate_nsuids = sorted(key for key, count in Counter(nsuids).items() if count > 1)
    for value in duplicate_ids:
        issues.append({"issue": "duplicate_id", "value": value})
    for value in duplicate_nsuids:
        issues.append({"issue": "duplicate_nsuid", "value": value})

    summary = {
        "label": label,
        "count": len(products),
        "issue_count": len(issues),
        "type_counts": dict(Counter(str(item.get("product_type")) for item in products)),
        "platform_counts": dict(
            Counter(platform for item in products for platform in item.get("platforms", []))
        ),
        "coverage": {
            key: sum(1 for item in products if present(item, key))
            for key in (
                "cover_url",
                "release_date",
                "regular_price",
                "platforms",
                "store_url",
                "description",
                "product_code",
                "related_products",
            )
        },
    }
    return issues, summary


def main() -> int:
    catalog_payload = load(CATALOG)
    extras_payload = load(EXTRAS)
    visible = catalog_payload["products"]
    extras = extras_payload["products"]

    visible_issues, visible_summary = validate_collection(visible, VISIBLE_TYPES, "visible")
    extra_issues, extra_summary = validate_collection(extras, EXTRA_TYPES, "extras")

    all_products = visible + extras
    all_ids = [item.get("id") for item in all_products]
    cross_duplicates = sorted(
        key for key, count in Counter(all_ids).items() if key and count > 1
    )

    normalized_lookup = {
        str(item.get("normalized_title") or item.get("title") or "").casefold(): item
        for item in all_products
    }
    title_checks = {}
    for expected in REQUIRED_TITLES:
        exact = normalized_lookup.get(expected.casefold())
        title_checks[expected] = {
            "found": exact is not None,
            "id": exact.get("id") if exact else None,
            "type": exact.get("product_type") if exact else None,
            "platforms": exact.get("platforms") if exact else [],
        }

    family_counts = Counter(item.get("family_id") for item in all_products if item.get("family_id"))
    families_with_variants = sum(1 for count in family_counts.values() if count > 1)

    blockers = list(visible_issues) + list(extra_issues)
    blockers.extend({"issue": "cross_file_duplicate_id", "value": value} for value in cross_duplicates)
    blockers.extend(
        {"issue": "required_title_missing", "value": title}
        for title, result in title_checks.items()
        if not result["found"]
    )

    validation = {
        "valid": len(blockers) == 0,
        "visible": visible_summary,
        "extras": extra_summary,
        "all_unique_products": len(all_products),
        "families_with_variants": families_with_variants,
        "cross_file_duplicate_ids": cross_duplicates,
        "required_title_checks": title_checks,
        "blocker_count": len(blockers),
        "blockers": blockers[:200],
        "notes": [
            "store_url, description, and product_code are enrichment gaps, not publication blockers.",
            "The validator does not modify the active HEARTAGRAM catalog.",
        ],
    }

    REPORT.write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"[CHECK] Visible products: {visible_summary['count']}")
    print(f"[CHECK] Extras: {extra_summary['count']}")
    print(f"[CHECK] All products: {len(all_products)}")
    print(f"[CHECK] Families with variants: {families_with_variants}")
    print(f"[CHECK] Visible coverage: {visible_summary['coverage']}")
    for title, result in title_checks.items():
        state = "FOUND" if result["found"] else "MISSING"
        print(f"[TITLE] {state}: {title}")
    print(f"[CHECK] Blockers: {len(blockers)}")
    print(f"[OK] Validation report: {REPORT.relative_to(ROOT)}")

    if blockers:
        print("[FAIL] Draft is not ready for preview integration.")
        return 1

    print("[PASS] Draft is structurally ready for isolated preview integration.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
