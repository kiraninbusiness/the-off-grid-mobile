// Mirrors the server's bundle maths (routes/orders.js) so the bag can preview savings.
// The server stays the source of truth: the final discount is confirmed at checkout.
export type Combo = {id: number | string; title: string; category: string; quantity: number; bundle_price: number};
export type BagLine = {category?: string; price: number; quantity: number};

export type BundleResult = {
  deal: Combo | null;
  saving: number;
  // The closest deal the bag has not completed yet, for an "add N more" nudge.
  next: {deal: Combo; needed: number} | null;
};

const same = (a?: string, b?: string) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

export function computeBundles(lines: BagLine[], combos: Combo[]): BundleResult {
  let best: {deal: Combo; saving: number} | null = null;
  let next: {deal: Combo; needed: number} | null = null;
  for (const raw of combos) {
    const deal = {...raw, quantity: Number(raw.quantity), bundle_price: Number(raw.bundle_price)};
    if (!(deal.quantity >= 2) || !(deal.bundle_price > 0)) continue;
    const match = lines.filter(l => same(l.category, deal.category));
    const qty = match.reduce((n, l) => n + l.quantity, 0);
    if (qty === 0) continue;
    const value = match.reduce((n, l) => n + l.price * l.quantity, 0);
    const bundles = Math.floor(qty / deal.quantity);
    if (bundles > 0) {
      const saving = Math.round(Math.max(0, bundles * ((value / qty) * deal.quantity - deal.bundle_price)));
      if (saving > 0 && (!best || saving > best.saving)) best = {deal, saving};
    }
    const needed = deal.quantity - (qty % deal.quantity);
    if (needed < deal.quantity && (!next || needed < next.needed)) next = {deal, needed};
  }
  return {deal: best?.deal ?? null, saving: best?.saving ?? 0, next};
}
