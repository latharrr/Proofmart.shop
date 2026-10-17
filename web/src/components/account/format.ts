/**
 * Date formatting for the account pages. Server-rendered only, so a fixed
 * locale and UTC keep the output stable regardless of the server's own
 * locale ("17 Aug 2026", never "17/8/2026" on one machine and "8/17/2026"
 * on the next).
 */
const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const DAY_TIME = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" });

export function formatDay(iso: string | Date): string {
  return DAY.format(typeof iso === "string" ? new Date(iso) : iso);
}

export function formatDayTime(iso: string): string {
  return DAY_TIME.format(new Date(iso));
}

/** "just now", "12 min ago", "3 h ago", "yesterday", "5 days ago", then the date. */
export function formatAgo(iso: string, now: number = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 14) return `${d} days ago`;
  return formatDay(iso);
}
