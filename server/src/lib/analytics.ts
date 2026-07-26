import { accessSync, constants } from "node:fs";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

/** Visitor numbers shown on the admin Dashboard, across three windows. */
export interface VisitorStats {
  active30min: number; // GA4 Realtime activeUsers — visitors in the last 30 min
  today: number; // GA4 totalUsers since midnight (property time zone)
  total: number; // GA4 totalUsers since the tag went live
}

// GA4 cannot report traffic from before the tracking tag existed, so the
// "total" range starts at the site's analytics launch date, not all of time.
const LAUNCH_DATE = "2026-07-25";

// The Data API has per-property quotas and this number needn't be fresher than
// a few minutes, so cache the whole result in-memory.
const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { at: number; value: VisitorStats } | null = null;

// Built lazily (like lib/oauth.ts) so importing this module never constructs a
// client when GA is unconfigured — e.g. in tests.
let client: BetaAnalyticsDataClient | null = null;
function gaClient(): BetaAnalyticsDataClient {
  // Credentials are read from GOOGLE_APPLICATION_CREDENTIALS (a key-file path)
  // via Google's Application Default Credentials — the client finds them itself.
  if (!client) client = new BetaAnalyticsDataClient();
  return client;
}

// google-auth-library reads the service-account key from
// GOOGLE_APPLICATION_CREDENTIALS. When that path is missing or unreadable, the
// error is thrown from a lazy gRPC stub-creation promise that ESCAPES the
// try/catch below and crashes the whole process (an EACCES crash-loop took the
// prod API down once — the file was under /root, unreadable by the app user).
// So we pre-flight the key ourselves and degrade to null instead.
function credentialsReadable(): boolean {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyPath) return false;
  try {
    accessSync(keyPath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/** Run one totalUsers report over [startDate, endDate] and return the number. */
async function runReport(startDate: string, endDate = "today"): Promise<number> {
  const [report] = await gaClient().runReport({
    property: `properties/${process.env.GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [{ name: "totalUsers" }],
  });
  const raw = report.rows?.[0]?.metricValues?.[0]?.value ?? "0";
  return Number(raw) || 0;
}

/** Active users in the last 30 minutes, via the separate Realtime API (standard
    reports can't express a "last N minutes" window). */
async function runRealtime(): Promise<number> {
  const [report] = await gaClient().runRealtimeReport({
    property: `properties/${process.env.GA4_PROPERTY_ID}`,
    metrics: [{ name: "activeUsers" }],
  });
  const raw = report.rows?.[0]?.metricValues?.[0]?.value ?? "0";
  return Number(raw) || 0;
}

/** Visitor totals from GA4, or null when GA isn't configured / the API fails
    (the dashboard then shows "—" instead of erroring). */
export async function getVisitorStats(): Promise<VisitorStats | null> {
  if (!process.env.GA4_PROPERTY_ID) return null;
  // Bail before constructing the client if the key file isn't readable — a bad
  // path must show "—", never crash the API (see credentialsReadable).
  if (!credentialsReadable()) return null;
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.value;
  try {
    const [active30min, today, total] = await Promise.all([
      runRealtime(),
      runReport("today", "today"),
      runReport(LAUNCH_DATE),
    ]);
    const value: VisitorStats = { active30min, today, total };
    cache = { at: Date.now(), value };
    return value;
  } catch {
    // Network/permission/quota errors must never take down the dashboard.
    return null;
  }
}
