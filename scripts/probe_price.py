"""Probe: does Nintendo's unofficial price endpoint answer for Mexico?

No external dependencies. If this works, update_prices.py will use the
same request for every game in the catalog.
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

# Built in parts on purpose: pasted URLs sometimes get mangled into links.
ENDPOINT = "https://" + "api.ec.nintendo.com" + "/v1/price"
BOTW_NSUID = "70010000000025"  # Breath of the Wild, Nintendo of America


def fetch_price(nsuid: str, country: str = "MX", lang: str = "es") -> dict:
    url = f"{ENDPOINT}?country={country}&lang={lang}&ids={nsuid}"
    request = urllib.request.Request(url, headers={"User-Agent": "heartagram-probe"})
    with urllib.request.urlopen(request, timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> int:
    try:
        data = fetch_price(BOTW_NSUID)
    except urllib.error.HTTPError as error:
        print(f"[FAIL] HTTP {error.code}: {error.reason}")
        return 1
    except urllib.error.URLError as error:
        print(f"[FAIL] Sin conexión: {error.reason}")
        return 1

    print("[OK] Respuesta recibida:")
    print(json.dumps(data, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
