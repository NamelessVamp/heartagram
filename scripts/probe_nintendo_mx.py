#!/usr/bin/env python3
"""Probe public Nintendo Mexico storefront sources for HEARTAGRAM.

This script is read-only. It does not replace the current catalog.
It downloads public responses, records their structure, extracts a small sample,
and writes diagnostic JSON files under data/nintendo_probe/.

Run from the HEARTAGRAM repository root:
    python probe_nintendo_mx.py
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

ROOT = Path.cwd()
OUTPUT_DIR = ROOT / "data" / "nintendo_probe"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/129.0 Safari/537.36 HEARTAGRAM-Catalog-Probe/1.0"
)

SOURCES = [
    {
        "key": "store_mx_games",
        "url": "https://www.nintendo.com/es-mx/store/games/",
        "kind": "html",
        "official": True,
    },
    {
        "key": "store_mx_switch_2",
        "url": "https://www.nintendo.com/es-mx/store/games/nintendo-switch-2-games/",
        "kind": "html",
        "official": True,
    },
    {
        "key": "eshop_mx_sales",
        "url": "https://ec.nintendo.com/api/MX/es/search/sales?count=30&offset=0",
        "kind": "json",
        "official": True,
        "note": "Undocumented consumer endpoint. Probe only; do not assume stability.",
    },
]


@dataclass
class NintendoProduct:
    schema_version: str = "1.0.0"
    source: str = "nintendo_mx"
    region: str = "MX"
    locale: str = "es-MX"
    nsuid: str | None = None
    product_code: str | None = None
    slug: str | None = None
    store_url: str | None = None
    title: str = ""
    normalized_title: str = ""
    description: str | None = None
    product_type: str = "unknown"
    edition_type: str = "standard"
    family_id: str = ""
    platforms: list[str] = field(default_factory=list)
    genres: list[str] = field(default_factory=list)
    publishers: list[str] = field(default_factory=list)
    developers: list[str] = field(default_factory=list)
    release_date: str | None = None
    cover_url: str | None = None
    hero_url: str | None = None
    screenshots: list[str] = field(default_factory=list)
    price_currency: str | None = None
    regular_price: float | None = None
    sale_price: float | None = None
    sale_end: str | None = None
    free_to_play: bool = False
    demo_available: bool = False
    availability: str = "unknown"
    related_products: list[str] = field(default_factory=list)
    raw_id: str | None = None
    fetched_at: str = ""


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def fetch(url: str, timeout: int) -> tuple[int, str, bytes]:
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json,text/html;q=0.9,*/*;q=0.8",
            "Accept-Language": "es-MX,es;q=0.9,en;q=0.7",
        },
    )
    with urlopen(request, timeout=timeout) as response:
        body = response.read()
        content_type = response.headers.get("Content-Type", "")
        return response.status, content_type, body


def safe_json(body: bytes) -> Any | None:
    try:
        return json.loads(body.decode("utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None


def describe_json(value: Any, depth: int = 0) -> Any:
    if depth >= 4:
        return type(value).__name__
    if isinstance(value, dict):
        return {
            "type": "object",
            "keys": sorted(value.keys()),
            "sample": {
                str(key): describe_json(value[key], depth + 1)
                for key in list(value.keys())[:8]
            },
        }
    if isinstance(value, list):
        return {
            "type": "array",
            "length": len(value),
            "item": describe_json(value[0], depth + 1) if value else None,
        }
    return {"type": type(value).__name__, "value": value}


def walk(value: Any):
    yield value
    if isinstance(value, dict):
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def candidate_records(payload: Any) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    seen: set[int] = set()
    title_keys = {"title", "name", "formal_name", "productName", "product_name"}
    for value in walk(payload):
        if not isinstance(value, dict) or id(value) in seen:
            continue
        keys = set(value)
        if keys & title_keys and len(keys) >= 3:
            candidates.append(value)
            seen.add(id(value))
    return candidates


def text_value(record: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        value = record.get(key)
        if isinstance(value, str) and value.strip():
            return unescape(value.strip())
    return None


def list_of_strings(record: dict[str, Any], *keys: str) -> list[str]:
    for key in keys:
        value = record.get(key)
        if isinstance(value, list):
            output: list[str] = []
            for item in value:
                if isinstance(item, str) and item.strip():
                    output.append(item.strip())
                elif isinstance(item, dict):
                    label = text_value(item, "name", "label", "title")
                    if label:
                        output.append(label)
            return sorted(set(output))
    return []


def normalize_title(title: str) -> str:
    value = unescape(title)
    value = re.sub(r"[™®©]", "", value)
    value = value.replace("–", "-").replace("—", "-")
    value = re.sub(r"\s+", " ", value).strip()
    return value


def detected_edition(title: str) -> str:
    lowered = title.casefold()
    rules = [
        ("switch_2", "nintendo switch 2 edition"),
        ("digital_deluxe", "digital deluxe"),
        ("deluxe", "deluxe edition"),
        ("complete", "complete edition"),
        ("ultimate", "ultimate edition"),
        ("bundle", "bundle"),
        ("collection", "collection"),
    ]
    for edition, phrase in rules:
        if phrase in lowered:
            return edition
    return "standard"


def family_title(title: str) -> str:
    value = normalize_title(title)
    suffixes = [
        r"\s*[-:]?\s*Nintendo Switch 2 Edition.*$",
        r"\s*[-:]?\s*Digital Deluxe Edition.*$",
        r"\s*[-:]?\s*Deluxe Edition.*$",
        r"\s*[-:]?\s*Complete Edition.*$",
        r"\s*[-:]?\s*Ultimate Edition.*$",
        r"\s*[-:]?\s*Collector'?s Edition.*$",
        r"\s*[-:]?\s*Limited Edition.*$",
    ]
    for pattern in suffixes:
        value = re.sub(pattern, "", value, flags=re.IGNORECASE).strip()
    return value or normalize_title(title)


def family_id(title: str) -> str:
    canonical = family_title(title).casefold()
    canonical = re.sub(r"[^a-z0-9]+", "-", canonical).strip("-")
    digest = hashlib.sha1(family_title(title).encode("utf-8")).hexdigest()[:8]
    return f"{canonical[:72]}-{digest}" if canonical else f"product-{digest}"


def normalize_record(record: dict[str, Any], source_key: str) -> NintendoProduct | None:
    title = text_value(record, "title", "name", "formal_name", "productName", "product_name")
    if not title:
        return None
    nsuid = text_value(record, "nsuid", "id", "title_id")
    url = text_value(record, "url", "store_url", "product_url", "link")
    if url and url.startswith("/"):
        url = urljoin("https://www.nintendo.com", url)
    slug = None
    if url:
        match = re.search(r"/products/([^/]+)/?", url)
        slug = match.group(1) if match else None
    platforms = list_of_strings(record, "platforms", "platform", "target_titles")
    cover = text_value(record, "image_url", "image", "cover_url", "hero_banner_url", "box_art_url")
    description = text_value(record, "description", "short_description", "summary")
    product = NintendoProduct(
        source=source_key,
        nsuid=nsuid,
        product_code=text_value(record, "product_code", "productCode", "hac_code"),
        slug=slug,
        store_url=url,
        title=title,
        normalized_title=normalize_title(title),
        description=description,
        edition_type=detected_edition(title),
        family_id=family_id(title),
        platforms=platforms,
        genres=list_of_strings(record, "genres", "genre", "tags"),
        publishers=list_of_strings(record, "publishers", "publisher", "publisher_names"),
        developers=list_of_strings(record, "developers", "developer", "developer_names"),
        release_date=text_value(record, "release_date", "release_date_on_eshop", "releaseDate"),
        cover_url=cover,
        hero_url=text_value(record, "hero_banner_url", "hero_url"),
        screenshots=list_of_strings(record, "screenshots", "screenshot_urls"),
        raw_id=nsuid,
        fetched_at=utc_now(),
    )
    lowered = title.casefold()
    if "switch 2" in lowered and "SWITCH_2" not in product.platforms:
        product.platforms.append("SWITCH_2")
    return product


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


def inspect_html(html: str) -> dict[str, Any]:
    scripts = extract_json_scripts(html)
    links = sorted(
        set(
            unescape(match)
            for match in re.findall(
                r'href=["\']([^"\']+/store/products/[^"\']+)["\']', html, flags=re.I
            )
        )
    )
    api_urls = sorted(set(re.findall(r'https?://[^"\'\s<>]+(?:api|graphql)[^"\'\s<>]*', html, flags=re.I)))
    return {
        "html_length": len(html),
        "embedded_json_count": len(scripts),
        "embedded_json_labels": [label for label, _ in scripts],
        "product_link_count": len(links),
        "product_links_sample": links[:20],
        "api_url_sample": api_urls[:20],
        "contains_next_data": "__NEXT_DATA__" in html,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Probe Nintendo Mexico public catalog sources.")
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("--sample-limit", type=int, default=20)
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    report: dict[str, Any] = {
        "generated_at": utc_now(),
        "schema_version": "1.0.0",
        "sources": [],
    }
    normalized: list[dict[str, Any]] = []

    print("[INIT] Nintendo Mexico source probe")
    for source in SOURCES:
        entry: dict[str, Any] = {**source, "fetched_at": utc_now()}
        print(f"[PROBE] {source['key']}")
        try:
            status, content_type, body = fetch(source["url"], args.timeout)
            entry.update(
                {
                    "status": status,
                    "content_type": content_type,
                    "bytes": len(body),
                    "sha256": hashlib.sha256(body).hexdigest(),
                }
            )
            raw_path = OUTPUT_DIR / f"{source['key']}.raw"
            raw_path.write_bytes(body)
            payload = safe_json(body)
            records: list[dict[str, Any]] = []
            if payload is not None:
                entry["structure"] = describe_json(payload)
                records = candidate_records(payload)
            else:
                html = body.decode("utf-8", errors="replace")
                entry["html"] = inspect_html(html)
                embedded = extract_json_scripts(html)
                for label, embedded_payload in embedded:
                    entry.setdefault("embedded_structures", {})[label] = describe_json(embedded_payload)
                    records.extend(candidate_records(embedded_payload))
            entry["candidate_record_count"] = len(records)
            entry["candidate_keys"] = sorted(
                set().union(*(record.keys() for record in records[:50]))
            ) if records else []
            for record in records[: args.sample_limit]:
                product = normalize_record(record, source["key"])
                if product:
                    normalized.append(asdict(product))
            print(
                f"[OK] status={status} bytes={len(body)} "
                f"candidates={len(records)}"
            )
        except (HTTPError, URLError, TimeoutError, OSError) as error:
            entry["error"] = f"{type(error).__name__}: {error}"
            print(f"[WARN] {source['key']}: {entry['error']}")
        report["sources"].append(entry)
        time.sleep(0.4)

    unique: dict[str, dict[str, Any]] = {}
    for product in normalized:
        identity = product.get("nsuid") or product.get("store_url") or product.get("title")
        if identity:
            unique[str(identity)] = product

    report_path = OUTPUT_DIR / "probe_report.json"
    sample_path = OUTPUT_DIR / "normalized_sample.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    sample_path.write_text(
        json.dumps(
            {
                "schema_version": "1.0.0",
                "generated_at": utc_now(),
                "products": list(unique.values()),
            },
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )

    print(f"[OK] Report: {report_path.relative_to(ROOT)}")
    print(f"[OK] Sample: {sample_path.relative_to(ROOT)}")
    print(f"[OK] Normalized sample products: {len(unique)}")
    print("[NEXT] Inspect source status, candidate keys, and normalized sample before sync.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
