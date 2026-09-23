// Fixed locale + UTC so server-rendered and hydrated output always match.
const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const shortFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function formatDate(iso: string) {
  return dateFmt.format(new Date(iso));
}

export function formatShortDate(ymd: string) {
  return shortFmt.format(new Date(ymd + "T00:00:00Z"));
}
