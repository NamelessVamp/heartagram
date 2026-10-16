#!/usr/bin/env python3
"""Inspect Nintendo MX probe output and locate real product-record paths.

Read-only diagnostic. It does not modify the active HEARTAGRAM catalog.
Run from repository root:
    python inspect_nintendo_mx_records.py
"""

from __future__ import annotations

import json
import re
from collections import Counter
from html import unescape
from pathlib import Path
from typing import Any, Iterator

ROOT = Path.cwd()
PROBE_DIR = ROOT / "data" / "nintendo_probe"
RAW_FILES = [
    PROBE_DIR / "store_mx_games.raw",
    PROBE_DIR / "store_mx_switch_2.raw",
]
OUTPUT = PROBE_DIR / "record_inspection.json"

NSUID_RE = re.compile(r"^700[0-9]{11}$")


def extract_json_scripts(html: str) -> list[tuple[str, Any]]:
    outputs: list[tuple[str, Any]] = []
    patterns = [
        ("next_data", r'<script[^>]+id=["\']__NEXT_DATA__["\'][^>]*>(.*?)</script>'),
        ("json_script", r'<script[^>]+type=["\']application/json["\'][^>]*>(.*?)</script>'),
    ]
    for label, pattern in patterns:
        for index, match in enumerate(re.finditer(pattern, html, flags=re.I | re.S)):
            raw = unescape(match.group(1)).strip()
            try:
                outputs.append((f"{label}_{index}", json.loads(raw)))
            except json.JSONDecodeError:
                continue
    return outputs


def walk(value: Any, path: str = "$") -> Iterator[tuple[str, Any]]:
    yield path, value
    if isinstance(value, dict):
        for key, child in value.items():
            yield from walk(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from walk(child, f"{path}[{index}]")


def scalar_strings(value: Any) -> Iterator[str]:
    if isinstance(value, str):
        yield value
    elif isinstance(value, (int, float)):
        yield str(value)
    elif isinstance(value, dict):
        for child in value.values():
            yield from scalar_strings(child)
    elif isinstance(value, list):
        for child in value:
            yield from scalar_strings(child)


def find_nsuid(record: dict[str, Any]) -> str | None:
    preferred = ("nsuid", "id", "title_id", "titleId", "productId")
    for key in preferred:
        value = record.get(key)
        if isinstance(value, (str, int)) and NSUID_RE.fullmatch(str(value)):
            return str(value)
    for value in scalar_strings(record):
        if NSUID_RE.fullmatch(value):
            return value
    return None


def title_of(record: dict[str, Any]) -> str | None:
    for key in ("title", "name", "formal_name", "productName", "product_name"):
        value = record.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def interesting_fields(record: dict[str, Any]) -> dict[str, Any]:
    terms = (
        "id", "title", "name", "url", "slug", "image", "cover", "hero",
        "price", "currency", "release", "platform", "genre", "publisher",
        "developer", "demo", "type", "product", "availability", "sale",
    )
    selected: dict[str, Any] = {}
    for key, value in record.items():
        if any(term in key.casefold() for term in terms):
            if isinstance(value, (str, int, float, bool)) or value is None:
                selected[key] = value
            elif isinstance(value, list):
                selected[key] = value[:5]
            elif isinstance(value, dict):
                selected[key] = {
                    child_key: child_value
                    for child_key, child_value in list(value.items())[:12]
                    if isinstance(child_value, (str, int, float, bool)) or child_value is None
                }
    return selected


def main() -> int:
    if not PROBE_DIR.exists():
        raise SystemExit("[FAIL] Run probe_nintendo_mx.py first.")

    report: dict[str, Any] = {"sources": []}
    total_products = 0

    for raw_file in RAW_FILES:
        if not raw_file.exists():
            report["sources"].append({"file": str(raw_file), "error": "missing"})
            continue

        html = raw_file.read_text(encoding="utf-8", errors="replace")
        scripts = extract_json_scripts(html)
        source_entry: dict[str, Any] = {
            "file": str(raw_file.relative_to(ROOT)),
            "embedded_json_documents": len(scripts),
            "record_paths": [],
            "product_samples": [],
        }
        path_counts: Counter[str] = Counter()
        seen_ids: set[str] = set()

        for script_label, payload in scripts:
            for path, value in walk(payload, f"$.{script_label}"):
                if not isinstance(value, dict):
                    continue
                nsuid = find_nsuid(value)
                title = title_of(value)
                if not nsuid or not title:
                    continue

                generic_path = re.sub(r"\[\d+\]", "[]", path)
                path_counts[generic_path] += 1
                if nsuid in seen_ids:
                    continue
                seen_ids.add(nsuid)
                if len(source_entry["product_samples"]) < 30:
                    source_entry["product_samples"].append(
                        {
                            "path": path,
                            "nsuid": nsuid,
                            "title": title,
                            "keys": sorted(value.keys()),
                            "interesting_fields": interesting_fields(value),
                        }
                    )

        source_entry["record_paths"] = [
            {"path": path, "count": count}
            for path, count in path_counts.most_common(20)
        ]
        source_entry["unique_product_ids"] = len(seen_ids)
        total_products += len(seen_ids)
        report["sources"].append(source_entry)

        print(
            f"[OK] {raw_file.name}: scripts={len(scripts)} "
            f"products={len(seen_ids)} paths={len(path_counts)}"
        )
        for item in source_entry["record_paths"][:5]:
            print(f"[PATH] {item['count']} x {item['path']}")

    report["total_unique_products_across_sources"] = total_products
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[OK] Inspection: {OUTPUT.relative_to(ROOT)}")
    print("[NEXT] Share record_paths and one product sample from each successful source.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
