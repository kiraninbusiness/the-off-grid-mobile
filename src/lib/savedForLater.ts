import {useCallback, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SavedItem = {product_id: number; name?: string; price?: number; image?: string; selected_size?: string; selected_color?: string};

const KEY = 'offgrid_saved_for_later';
const MAX_SAVED = 20;

export const savedKey = (x: SavedItem) => `${x.product_id}|${x.selected_size || ''}|${x.selected_color || ''}`;

// Newest first, no duplicates (same product, size and colour), capped.
export function addSaved(list: SavedItem[], item: SavedItem): SavedItem[] {
  return [item, ...list.filter(x => savedKey(x) !== savedKey(item))].slice(0, MAX_SAVED);
}
export function removeSaved(list: SavedItem[], key: string): SavedItem[] {
  return list.filter(x => savedKey(x) !== key);
}

const clean = (v: any): SavedItem[] =>
  Array.isArray(v) ? v.filter(x => x && Number.isFinite(Number(x.product_id)) && Number(x.product_id) > 0).map(x => ({...x, product_id: Number(x.product_id)})).slice(0, MAX_SAVED) : [];

// Saved-for-later items live on this device, so they work for guests and signed-in customers alike.
export function useSavedForLater() {
  const [saved, setSaved] = useState<SavedItem[]>([]);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then(raw => { if (alive && raw) setSaved(clean(JSON.parse(raw))); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const persist = (next: SavedItem[]) => {
    setSaved(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  };
  const save = useCallback((item: SavedItem) => persist(addSaved(saved, item)), [saved]);
  const discard = useCallback((key: string) => persist(removeSaved(saved, key)), [saved]);
  return {saved, save, discard};
}
