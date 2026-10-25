// Shared parsing for the pincode serviceability endpoint, mirroring the rules in
// app/delivery.tsx so the product page and the Delivery screen agree.
import {FREE_SHIPPING_THRESHOLD} from './config';

export type Serviceability = {
  serviceable: boolean;
  message: string;
  eta: string;
  cod: boolean;
  freeShippingThreshold: number;
};

export const isValidPincode = (value: string) => /^[1-9][0-9]{5}$/.test(value);

export function parseFlag(value: any): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && (value === 0 || value === 1)) return value === 1;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['true', 'yes', '1', 'available', 'serviceable'].includes(v)) return true;
    if (['false', 'no', '0', 'unavailable', 'not serviceable', 'not_serviceable'].includes(v)) return false;
  }
  return null;
}

export function formatEta(value: any): string {
  if (value === null || value === undefined || String(value).trim() === '') return '';
  const text = String(value).trim();
  if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text) === 1 ? 'Estimated 1 day' : `Estimated ${text} days`;
  return text;
}

/** Turns the raw API response into a result, or throws a readable error when availability is unclear. */
export function normalizeServiceability(response: any): Serviceability {
  const data: any = response?.data ?? response?.result ?? response;
  const serviceable = parseFlag(data?.serviceable ?? data?.is_serviceable ?? data?.available ?? data?.deliverable);
  if (serviceable === null) {
    throw new Error(data?.message || data?.reason || 'We could not confirm delivery for this pincode right now. Please try again later.');
  }
  const threshold = Number(data?.free_shipping_threshold ?? data?.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD);
  return {
    serviceable,
    message: data?.message || data?.reason || (serviceable ? '' : 'Delivery is not available for this pincode right now.'),
    eta: formatEta(data?.estimated_days ?? data?.estimatedDays ?? data?.eta),
    cod: parseFlag(data?.cod ?? data?.cod_available ?? data?.cash_on_delivery) === true,
    freeShippingThreshold: Number.isFinite(threshold) && threshold >= 0 ? threshold : FREE_SHIPPING_THRESHOLD,
  };
}
