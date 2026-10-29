export type Suggestion = {kind: 'category' | 'product'; label: string; sub?: string};

const norm = (v: any) => String(v ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

// Suggestions as you type: matching categories first, then products whose name starts with,
// or contains every word of, what was typed. Works on the catalogue already loaded in the app.
export function suggest(query: string, products: any[], limit = 6): Suggestion[] {
  const q = norm(query);
  if (q.length < 2 || !Array.isArray(products)) return [];
  const words = q.split(' ');
  const out: Suggestion[] = [];

  const seenCats = new Set<string>();
  for (const p of products) {
    const cat = String(p?.category ?? '').trim();
    const key = cat.toLowerCase();
    if (cat && !seenCats.has(key) && norm(cat).includes(q)) {
      seenCats.add(key);
      out.push({kind: 'category', label: cat});
      if (out.length >= 2) break;
    }
  }

  const scored: Array<{s: number; p: any}> = [];
  for (const p of products) {
    const name = norm(p?.name);
    if (!name) continue;
    const startsWith = name.startsWith(q);
    const allWords = words.every(w => name.includes(w));
    if (startsWith || allWords) scored.push({s: startsWith ? 0 : 1, p});
  }
  scored.sort((a, b) => a.s - b.s || String(a.p.name).length - String(b.p.name).length);
  const seen = new Set<string>();
  for (const {p} of scored) {
    const label = String(p.name).trim();
    if (seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    out.push({kind: 'product', label, sub: p.category ? String(p.category) : undefined});
    if (out.length >= limit) break;
  }
  return out.slice(0, limit);
}
