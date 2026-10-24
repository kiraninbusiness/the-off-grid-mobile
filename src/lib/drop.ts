// Next-drop schedule used by the DropCountdown strip on Home.
//
// By default a drop lands every Friday at 6:00 PM IST. To announce a specific
// drop instead, set EXPO_PUBLIC_NEXT_DROP_AT to an ISO timestamp, for example
// 2026-11-07T18:00:00+05:30. Once that time has passed the schedule falls back
// to the weekly default.

const IST_OFFSET_MIN = 330;
const DROP_WEEKDAY = 5; // Friday (0 = Sunday)
const DROP_HOUR = 18;

export function nextDropAt(now: number = Date.now()): Date {
  const override = process.env.EXPO_PUBLIC_NEXT_DROP_AT;
  if (override) {
    const t = Date.parse(override);
    if (Number.isFinite(t) && t > now) return new Date(t);
  }

  // Work in IST by shifting the clock, then read it with UTC getters.
  const ist = new Date(now + IST_OFFSET_MIN * 60000);
  let daysAhead = (DROP_WEEKDAY - ist.getUTCDay() + 7) % 7;
  const minutesToday = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  if (daysAhead === 0 && minutesToday >= DROP_HOUR * 60) daysAhead = 7;

  const target = Date.UTC(
    ist.getUTCFullYear(),
    ist.getUTCMonth(),
    ist.getUTCDate() + daysAhead,
    DROP_HOUR,
    0,
    0,
  );
  return new Date(target - IST_OFFSET_MIN * 60000);
}

export function countdownParts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}
