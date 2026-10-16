#!/usr/bin/env python3
"""Probe the missing official Nintendo Switch catalog page for Mexico.

This is read-only. It downloads the official page and stores the raw response
under data/nintendo_probe/store_mx_switch.raw for the combined draft builder.
"""
from __future__ import annotations
import hashlib
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path.cwd()
OUT=ROOT/'data'/'nintendo_probe'/'store_mx_switch.raw'
URL='https://www.nintendo.com/es-mx/store/games/nintendo-switch-games/'
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0 Safari/537.36 HEARTAGRAM-Catalog-Probe/1.1'

def main():
    OUT.parent.mkdir(parents=True,exist_ok=True)
    req=Request(URL,headers={'User-Agent':UA,'Accept':'text/html,*/*;q=0.8','Accept-Language':'es-MX,es;q=0.9'})
    with urlopen(req,timeout=60) as response:
        body=response.read(); status=response.status; content_type=response.headers.get('Content-Type','')
    if status!=200 or len(body)<10000:
        raise SystemExit(f'[FAIL] Invalid response: status={status} bytes={len(body)}')
    OUT.write_bytes(body)
    print(f'[OK] Status: {status}')
    print(f'[OK] Content-Type: {content_type}')
    print(f'[OK] Bytes: {len(body)}')
    print(f'[OK] SHA256: {hashlib.sha256(body).hexdigest()}')
    print(f'[OK] Raw: {OUT.relative_to(ROOT)}')
    return 0

if __name__=='__main__': raise SystemExit(main())
