export const LAUNCH_TZ = "America/New_York";
export const LAUNCH_CITY = { name: "Boston, MA", lat: 42.3601, lng: -71.0589 };

export function formatEventTime(startsAt: string, endsAt: string, tz = LAUNCH_TZ) {
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  const day = s.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: tz });
  const t = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
  return `${day}, ${t(s)} – ${t(e)}`;
}

/** Offset in minutes between UTC and the given zone at this instant. */
function tzOffsetMinutes(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return (asUtc - date.getTime()) / 60000;
}

/** "2026-12-02T19:00" typed in the given zone -> UTC Date. */
export function zonedInputToDate(value: string, tz = LAUNCH_TZ): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const guess = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
  const first = new Date(guess.getTime() - tzOffsetMinutes(guess, tz) * 60000);
  // Re-check once in case the guess crossed a daylight-saving change.
  return new Date(guess.getTime() - tzOffsetMinutes(first, tz) * 60000);
}
