#!/usr/bin/env python3
"""Build a draft Nintendo Mexico catalog from the successful probe source.

Read-only with respect to the active HEARTAGRAM catalog. It reads
store_mx_switch_2.raw and writes draft files under data/nintendo_probe/.
"""
from __future__ import annotations
import hashlib, json, re, unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from typing import Any

ROOT=Path.cwd()
PROBE=ROOT/'data'/'nintendo_probe'
RAW_SOURCES = [
    ('nintendo_switch', PROBE / 'store_mx_switch.raw'),
    ('nintendo_switch_2', PROBE / 'store_mx_switch_2.raw'),
]
OUT=PROBE/'nintendo_catalog_draft.json'
REPORT=PROBE/'nintendo_catalog_draft_report.json'
NSUID_RE=re.compile(r'^700\d{11}$')


def now(): return datetime.now(timezone.utc).replace(microsecond=0).isoformat()

def json_scripts(html:str):
    pat=r'<script[^>]+id=["\']__NEXT_DATA__["\'][^>]*>(.*?)</script>'
    found=[]
    for m in re.finditer(pat,html,re.I|re.S):
        try: found.append(json.loads(unescape(m.group(1)).strip()))
        except json.JSONDecodeError: pass
    return found

def get_path(obj:Any,path:list[str]):
    for key in path:
        if not isinstance(obj,dict): return None
        obj=obj.get(key)
    return obj

def s(value:Any):
    return value.strip() if isinstance(value,str) and value.strip() else None

def first(d:dict[str,Any],*keys:str):
    for k in keys:
        v=s(d.get(k))
        if v: return v
    return None

def deep_first(value:Any, keys:set[str]):
    if isinstance(value,dict):
        for k,v in value.items():
            if k in keys:
                if isinstance(v,(str,int,float)) and str(v).strip(): return v
            result=deep_first(v,keys)
            if result is not None: return result
    if isinstance(value,list):
        for item in value:
            result=deep_first(item,keys)
            if result is not None: return result
    return None

def deep_urls(value:Any):
    urls=[]
    if isinstance(value,str) and value.startswith(('http://','https://')): urls.append(value)
    elif isinstance(value,dict):
        for v in value.values(): urls.extend(deep_urls(v))
    elif isinstance(value,list):
        for v in value: urls.extend(deep_urls(v))
    return urls

def ascii_slug(text:str):
    text=unicodedata.normalize('NFKD',text)
    text=''.join(c for c in text if not unicodedata.combining(c))
    text=re.sub(r'[™®©]','',text).casefold()
    return re.sub(r'[^a-z0-9]+','-',text).strip('-')

def edition(title:str):
    t=title.casefold()
    if 'nintendo switch' in t and '2 edition' in t: return 'switch_2'
    if 'digital deluxe' in t: return 'digital_deluxe'
    if 'complete edition' in t: return 'complete'
    if 'ultimate edition' in t: return 'ultimate'
    if 'deluxe edition' in t: return 'deluxe'
    if 'collection' in t or 'colección' in t: return 'collection'
    if 'bundle' in t or 'paquete' in t: return 'bundle'
    return 'standard'

def product_type(title:str,nsuid:str):
    t=title.casefold()
    if nsuid.startswith('7005') or 'paquete de mejora' in t or 'upgrade pack' in t: return 'upgrade_pack'
    if 'pase de expansión' in t or 'expansion pass' in t or nsuid.startswith('7007') and 'juego +' not in t: return 'dlc'
    if 'paquete' in t or 'bundle' in t or 'juego +' in t: return 'bundle'
    if 'demo' in t: return 'demo'
    return 'game'

def family_title(title:str):
    value=re.sub(r'[™®©]','',title)
    patterns=[
      r'\s*[-–—:]?\s*Nintendo Switch\s*2 Edition.*$',
      r'^Paquete de mejora\s+', r'^Paquete\s+', r'\s*\(Juego\s*\+.*$',
      r'\s*[-–—:]?\s*Digital Deluxe Edition.*$', r'\s*[-–—:]?\s*Deluxe Edition.*$',
      r'\s*[-–—:]?\s*Complete Edition.*$', r'\s*[-–—:]?\s*Ultimate Edition.*$'
    ]
    for p in patterns: value=re.sub(p,'',value,flags=re.I).strip()
    return value

def family_id(title:str):
    base=family_title(title)
    return f"{ascii_slug(base)[:72]}-{hashlib.sha1(base.encode('utf-8')).hexdigest()[:8]}"

def price_value(value:Any):
    if isinstance(value,(int,float)): return float(value)
    if isinstance(value,str):
        cleaned=re.sub(r'[^0-9.,]','',value).replace(',','')
        try: return float(cleaned)
        except ValueError: return None
    return None

def extract_source(source_name: str, raw_path: Path):
    if not raw_path.exists():
        return {}, [], Counter(), Counter(), Counter(), {"source": source_name, "error": "missing raw"}
    docs = json_scripts(raw_path.read_text(encoding='utf-8', errors='replace'))
    if not docs:
        return {}, [], Counter(), Counter(), Counter(), {"source": source_name, "error": "__NEXT_DATA__ not found"}
    grid = get_path(docs[0], ['props', 'pageProps', 'page', 'content', 'merchandisedGrid'])
    if not isinstance(grid, list):
        return {}, [], Counter(), Counter(), Counter(), {"source": source_name, "error": "merchandisedGrid not found"}

    products = {}
    excluded = []
    field_counts = Counter()
    types = Counter()
    editions = Counter()
    variation_count = 0

    for group in grid:
        if not isinstance(group, list):
            continue
        for card in group:
            if not isinstance(card, dict):
                continue
            variations = card.get('variations')
            if not isinstance(variations, list):
                continue
            for variation in variations:
                if not isinstance(variation, dict):
                    continue
                product = variation.get('product')
                if not isinstance(product, dict):
                    continue
                variation_count += 1

                nsuid = None
                for identity_key in ('nsuid', 'title_id', 'titleId', 'productId', 'id'):
                    candidate = product.get(identity_key)
                    if candidate is not None and NSUID_RE.fullmatch(str(candidate)):
                        nsuid = str(candidate)
                        break
                if nsuid is None:
                    for identity_key in ('nsuid', 'title_id', 'titleId', 'productId'):
                        candidate = deep_first(product, {identity_key})
                        if candidate is not None and NSUID_RE.fullmatch(str(candidate)):
                            nsuid = str(candidate)
                            break
                nsuid = nsuid or ''

                title = None
                for title_key in ('title', 'formal_name', 'productName', 'product_name', 'name'):
                    candidate = product.get(title_key)
                    if isinstance(candidate, str) and candidate.strip():
                        title = candidate.strip()
                        break
                if title is None:
                    title = deep_first(product, {'title', 'formal_name', 'productName', 'product_name', 'name'})
                    title = str(title).strip() if title is not None else ''

                if not NSUID_RE.fullmatch(nsuid) or not title:
                    excluded.append({'source': source_name, 'reason': 'invalid_identity', 'nsuid': nsuid, 'title': title})
                    continue

                context = {'card': card, 'variation': variation, 'product': product}
                urls = list(dict.fromkeys(deep_urls(context)))
                image_urls = [u for u in urls if re.search(r'\.(?:jpg|jpeg|png|webp)(?:\?|$)', u, re.I) or 'image' in u.casefold()]
                store_urls = [u for u in urls if '/store/products/' in u]
                release = deep_first(context, {'releaseDate', 'release_date', 'release_date_on_eshop'})
                regular = deep_first(context, {'regularPrice', 'regular_price', 'price', 'msrp'})
                sale = deep_first(context, {'salePrice', 'sale_price', 'discountPrice', 'discount_price'})
                platforms = []
                blob = json.dumps(context, ensure_ascii=False).casefold()
                if source_name == 'nintendo_switch_2' or 'switch 2' in blob:
                    platforms.append('SWITCH_2')
                if source_name == 'nintendo_switch' or ('nintendo switch' in blob and 'switch 2' not in blob):
                    platforms.append('SWITCH')

                ptype = product_type(title, nsuid)
                ed = edition(title)
                record = {
                    'schema_version': '1.0.0',
                    'id': f'nintendo:MX:{nsuid}',
                    'source': 'nintendo_mx',
                    'source_catalog': source_name,
                    'region': 'MX',
                    'locale': 'es-MX',
                    'nsuid': nsuid,
                    'product_code': deep_first(context, {'productCode', 'product_code', 'hacCode', 'hac_code'}),
                    'slug': None,
                    'store_url': store_urls[0] if store_urls else None,
                    'title': title,
                    'normalized_title': re.sub(r'\s+', ' ', re.sub(r'[™®©]', '', title)).strip(),
                    'description': deep_first(context, {'description', 'shortDescription', 'short_description', 'summary'}),
                    'product_type': ptype,
                    'edition_type': ed,
                    'family_id': family_id(title),
                    'platforms': sorted(set(platforms)),
                    'genres': [],
                    'publishers': [],
                    'developers': [],
                    'release_date': release,
                    'cover_url': image_urls[0] if image_urls else None,
                    'hero_url': image_urls[1] if len(image_urls) > 1 else None,
                    'screenshots': image_urls[2:12],
                    'price_currency': 'MXN',
                    'regular_price': price_value(regular),
                    'sale_price': price_value(sale),
                    'sale_end': deep_first(context, {'saleEnd', 'sale_end'}),
                    'free_to_play': price_value(regular) == 0,
                    'demo_available': 'demo' in blob,
                    'availability': 'preorder' if re.search(r'reserv|pre.?order', blob) else 'available',
                    'related_products': [],
                    'raw_id': nsuid,
                    'fetched_at': now(),
                }
                if record['store_url']:
                    match = re.search(r'/products/([^/]+)/?', record['store_url'])
                    record['slug'] = match.group(1) if match else None
                products[nsuid] = record
                types[ptype] += 1
                editions[ed] += 1
                for key, value in product.items():
                    if value not in (None, '', [], {}):
                        field_counts[key] += 1

    source_report = {
        'source': source_name,
        'raw_file': str(raw_path.relative_to(ROOT)),
        'grid_groups': len(grid),
        'variation_count': variation_count,
        'unique_products': len(products),
        'excluded_count': len(excluded),
    }
    return products, excluded, field_counts, types, editions, source_report


def main():
    combined = {}
    excluded = []
    field_counts = Counter()
    source_reports = []

    for source_name, raw_path in RAW_SOURCES:
        products, source_excluded, source_fields, _, _, source_report = extract_source(source_name, raw_path)
        source_reports.append(source_report)
        excluded.extend(source_excluded)
        field_counts.update(source_fields)
        for nsuid, record in products.items():
            if nsuid in combined:
                existing = combined[nsuid]
                existing['platforms'] = sorted(set(existing.get('platforms', []) + record.get('platforms', [])))
                for key in ('cover_url', 'hero_url', 'store_url', 'description', 'product_code', 'regular_price', 'sale_price'):
                    if existing.get(key) in (None, '', [], {}) and record.get(key) not in (None, '', [], {}):
                        existing[key] = record[key]
            else:
                combined[nsuid] = record
        print(f"[OK] {source_name}: products={len(products)} excluded={len(source_excluded)}")

    family_members = defaultdict(list)
    for record in combined.values():
        family_members[record['family_id']].append(record['id'])
    for record in combined.values():
        record['related_products'] = [item for item in family_members[record['family_id']] if item != record['id']]

    visible = [record for record in combined.values() if record['product_type'] in {'game', 'bundle'}]
    extras = [record for record in combined.values() if record['product_type'] not in {'game', 'bundle'}]
    visible.sort(key=lambda item: item['normalized_title'].casefold())
    extras.sort(key=lambda item: item['normalized_title'].casefold())

    type_counts = Counter(record['product_type'] for record in combined.values())
    edition_counts = Counter(record['edition_type'] for record in combined.values())
    coverage_keys = ['store_url', 'cover_url', 'release_date', 'regular_price', 'platforms', 'description', 'product_code']
    coverage = {key: sum(1 for record in combined.values() if record.get(key) not in (None, '', [], {})) for key in coverage_keys}

    envelope = {
        'schema_version': '1.0.0',
        'source': 'nintendo_mx',
        'region': 'MX',
        'locale': 'es-MX',
        'generated_at': now(),
        'product_count': len(visible),
        'products': visible,
    }
    extras_envelope = {
        'schema_version': '1.0.0',
        'source': 'nintendo_mx',
        'generated_at': now(),
        'product_count': len(extras),
        'products': extras,
    }
    report = {
        'generated_at': now(),
        'sources': source_reports,
        'all_unique_products': len(combined),
        'visible_products': len(visible),
        'extra_products': len(extras),
        'excluded_count': len(excluded),
        'product_types': dict(type_counts),
        'edition_types': dict(edition_counts),
        'coverage': coverage,
        'top_source_fields': field_counts.most_common(50),
        'families_with_variants': sum(1 for members in family_members.values() if len(members) > 1),
        'excluded_sample': excluded[:30],
    }

    visible_path = PROBE / 'nintendo_catalog_combined.json'
    extras_path = PROBE / 'nintendo_catalog_extras.json'
    report_path = PROBE / 'nintendo_catalog_combined_report.json'
    visible_path.write_text(json.dumps(envelope, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    extras_path.write_text(json.dumps(extras_envelope, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    print(f"[OK] All unique products: {len(combined)}")
    print(f"[OK] Visible products: {len(visible)}")
    print(f"[OK] Extras: {len(extras)}")
    print(f"[CHECK] Product types: {dict(type_counts)}")
    print(f"[CHECK] Coverage: {coverage}")
    print(f"[CHECK] Families with variants: {report['families_with_variants']}")
    print(f"[OK] Catalog: {visible_path.relative_to(ROOT)}")
    print(f"[OK] Extras: {extras_path.relative_to(ROOT)}")
    print(f"[OK] Report: {report_path.relative_to(ROOT)}")
    return 0

if __name__=='__main__': raise SystemExit(main())
