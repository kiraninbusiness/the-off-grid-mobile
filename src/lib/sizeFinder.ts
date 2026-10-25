// Rule-based size finder, ported from the website's sizeFinder.js so web and
// app give the same answer. It is general guidance from height, weight and
// fit preference, not precise sizing.

export const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
export type FitPref = 'slim' | 'regular' | 'oversized';

function baseSizeFromWeight(kg: number) {
  if (kg <= 55) return 'S';
  if (kg <= 65) return 'M';
  if (kg <= 75) return 'L';
  if (kg <= 85) return 'XL';
  return 'XXL';
}

function shift(size: string, steps: number) {
  const i = SIZE_ORDER.indexOf(size);
  if (i === -1) return size;
  return SIZE_ORDER[Math.min(SIZE_ORDER.length - 1, Math.max(0, i + steps))];
}

/** Returns a size from `available`, or null when the product uses sizes this tool cannot rank (28, 30, ONE SIZE...). */
export function recommendSize(
  input: {heightCm: number; weightKg: number; fit: FitPref},
  available: string[],
): string | null {
  const options = available.map(s => String(s).trim().toUpperCase());
  const rankable = options.filter(s => SIZE_ORDER.includes(s));
  if (!rankable.length) return null;

  let size = baseSizeFromWeight(input.weightKg);
  if (input.heightCm >= 183) size = shift(size, 1);
  else if (input.heightCm <= 160) size = shift(size, -1);
  if (input.fit === 'slim') size = shift(size, -1);
  if (input.fit === 'oversized') size = shift(size, 1);

  if (rankable.includes(size)) return size;
  const target = SIZE_ORDER.indexOf(size);
  return rankable.reduce((best, s) =>
    Math.abs(SIZE_ORDER.indexOf(s) - target) < Math.abs(SIZE_ORDER.indexOf(best) - target) ? s : best,
  );
}
