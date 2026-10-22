import {API_URL} from './api';

// Lightweight analytics hooks. They are intentionally fire-and-forget and
// never block shopping if the analytics endpoint is unavailable.
export async function track(event:string, properties:Record<string,any>={}) {
  try {
    await fetch(`${API_URL}/analytics/events`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({event,properties,occurred_at:new Date().toISOString()})
    });
  } catch {}
}
