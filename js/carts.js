// Builds up to three game bundles that fit the eShop gift budget.

export const BUDGET_MXN = 1500;
const MAX_PAID_ITEMS = 3;
const CANDIDATE_POOL = 12;
const FREE_PICKS = 2;

const isPaid = ({ game }) =>
  Number.isInteger(game.price_mxn) && game.price_mxn > 0;
const isFree = ({ game }) => game.free_to_play === true;

/**
 * Exhaustive search over the top candidates.
 * Pool is small (2^12 subsets), so brute force stays instant and exact.
 */
function bestSubset(candidates, budget) {
  let best = { items: [], score: 0, total: 0 };
  const n = candidates.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    const items = candidates.filter((_, i) => mask & (1 << i));
    if (items.length > MAX_PAID_ITEMS) continue;
    const total = items.reduce((sum, { game }) => sum + game.price_mxn, 0);
    if (total > budget) continue;
    const score = items.reduce((sum, { score }) => sum + score, 0);
    if (score > best.score) best = { items, score, total };
  }
  return best;
}

function makeCart(id, name, paid, free) {
  const total = paid.reduce((sum, { game }) => sum + game.price_mxn, 0);
  return {
    id,
    name,
    items: [...paid, ...free],
    total,
    remaining: BUDGET_MXN - total,
  };
}

export function buildCarts(ranked, duo, outOfZone) {
  const paidPool = ranked.filter(isPaid).slice(0, CANDIDATE_POOL);

  /*
   * Free games can accompany a paid selection, but they should not
   * create a misleading $0 budget bundle by themselves.
   */
  if (paidPool.length === 0) {
    return [];
  }

  const carts = [];

  const main = bestSubset(paidPool, BUDGET_MXN);
  carts.push(
    makeCart(
      "main",
      "Tu selección",
      main.items,
      ranked.filter(isFree).slice(0, FREE_PICKS),
    ),
  );

  const duoPaid = duo.filter(isPaid).slice(0, CANDIDATE_POOL);
  const duoPick = bestSubset(duoPaid, BUDGET_MXN);
  carts.push(
    makeCart("duo", "Duo Pack", duoPick.items, duo.filter(isFree).slice(0, 1)),
  );

  if (
    outOfZone &&
    isPaid(outOfZone) &&
    outOfZone.game.price_mxn <= BUDGET_MXN
  ) {
    const rest = paidPool.filter(({ game }) => game.id !== outOfZone.game.id);
    const fill = bestSubset(rest, BUDGET_MXN - outOfZone.game.price_mxn);
    const items = [outOfZone, ...fill.items].slice(0, MAX_PAID_ITEMS);
    carts.push(makeCart("zone", "Sal de tu zona", items, []));
  }

  return carts.filter((cart) => cart.items.length > 0);
}
