import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'offgrid_compare';
export const MAX_COMPARE = 3;

export async function getCompareIds(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(Number).filter(n => Number.isSafeInteger(n) && n > 0).slice(0, MAX_COMPARE) : [];
  } catch { return []; }
}

async function save(ids: number[]) { try { await AsyncStorage.setItem(KEY, JSON.stringify(ids)); } catch {} }

/** Adds a product; returns false when the list is already full. */
export async function addToCompare(id: number): Promise<boolean> {
  const ids = await getCompareIds();
  if (ids.includes(id)) return true;
  if (ids.length >= MAX_COMPARE) return false;
  await save([...ids, id]);
  return true;
}

export async function removeFromCompare(id: number): Promise<number[]> {
  const next = (await getCompareIds()).filter(x => x !== id);
  await save(next);
  return next;
}
