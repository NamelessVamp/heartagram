// Adapts Nintendo Store Mexico products to HEARTAGRAM's existing catalog contract.
export const NINTENDO_INDEX_PATH = "data/nintendo_catalog.json";

function numericPrice(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  if (typeof value === "object") {
    for (const key of ["amount", "value", "price", "raw_value", "finalPrice", "regularPrice"]) {
      const parsed = numericPrice(value[key]);
      if (parsed !== null) return parsed;
    }
    return null;
  }

  const normalized = String(value)
    .trim()
    .replace(/[^0-9,.-]/g, "")
    .replace(/,(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");

  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function priceLabel(product) {
  const value = numericPrice(product.sale_price) ?? numericPrice(product.regular_price);
  if (value === null) return null;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: product.price_currency || "MXN",
    maximumFractionDigits: 2,
  }).format(value);
}

function platformDetails(platforms) {
  return (Array.isArray(platforms) ? platforms : []).map((platform) => ({
    name: platform === "SWITCH_2" ? "Nintendo Switch 2" : "Nintendo Switch",
    abbreviation: platform === "SWITCH_2" ? "Switch 2" : "Switch",
  }));
}

// Store titles carry trademark symbols and a redundant "Edición Estándar" prefix.
export function displayTitle(raw) {
  return String(raw ?? "")
    .replace(/[™®©]/g, "")
    .replace(/^Edici[oó]n Est[aá]ndar\s+/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function adaptNintendoProduct(product) {
  const nsuid = String(product.nsuid ?? "").trim();
  if (!/^\d{10,20}$/.test(nsuid)) throw new TypeError("Invalid Nintendo NSUID");
  const title = displayTitle(product.title || product.normalized_title) || nsuid;
  const rawReleaseDate = product.release_date || null;
  const releaseDate = typeof rawReleaseDate === "string"
    ? rawReleaseDate.slice(0, 10)
    : rawReleaseDate;
  const year = releaseDate ? new Date(releaseDate).getUTCFullYear() : null;
  const cover = product.cover_url || "";
  const platforms = Array.isArray(product.platforms) ? product.platforms : [];
  return {
    catalog_source: "nintendo",
    catalog_id: `nintendo:MX:${nsuid}`,
    nsuid,
    name: title,
    title,
    cover,
    release_date: releaseDate,
    first_release_date: releaseDate,
    release_year: Number.isInteger(year) ? year : null,
    platforms,
    platform_details: platformDetails(platforms),
    genres: Array.isArray(product.genres) ? product.genres : [],
    game_modes: [],
    game_type: product.product_type || "game",
    edition_type: product.edition_type || "standard",
    family_id: product.family_id || null,
    regular_price: product.regular_price ?? null,
    sale_price: product.sale_price ?? null,
    price_currency: product.price_currency || "MXN",
    price_label: priceLabel(product),
    summary: product.description || "Producto oficial de Nintendo Store Mexico.",
    storyline: null,
    developers: Array.isArray(product.developers) ? product.developers : [],
    publishers: Array.isArray(product.publishers) ? product.publishers : [],
    screenshots: Array.isArray(product.screenshots) ? product.screenshots : [],
    artworks: [],
    related_products: Array.isArray(product.related_products) ? product.related_products : [],
    store_url: product.store_url || null,
    availability: Array.isArray(product.availability) ? product.availability : [],
    features: Array.isArray(product.features) ? product.features : [],
    ways_to_play: Array.isArray(product.ways_to_play) ? product.ways_to_play : [],
    player_count: product.player_count || null,
    nso_features: Array.isArray(product.nso_features) ? product.nso_features : [],
    content_rating: product.content_rating || null,
    content_descriptors: Array.isArray(product.content_descriptors) ? product.content_descriptors : [],
    demo_nsuid: product.demo_nsuid || null,
    percent_off: Number(product.percent_off || 0),
    sale_end: product.sale_end || null,
    videos: Array.isArray(product.videos) ? product.videos : [],
    sku: product.sku || null,
    edition_label: product.edition_label || null,
    cover_detail: cover ? { url_2x: cover } : null,
  };
}

export function adaptNintendoCatalog(payload) {
  const products = Array.isArray(payload?.products) ? payload.products : payload?.games;
  if (!Array.isArray(products)) throw new TypeError("Nintendo catalog has no products array");
  return {
    meta: { source: "nintendo_mx", region: "MX", locale: "es-MX", static: true },
    games: products.map(adaptNintendoProduct),
  };
}
