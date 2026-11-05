/**
 * Public KidFlix detail badges: aggregate-only, release-gated, consented activity.
 * Reads no visitor identities into the response or browser, performs no mutations.
 */
import { createServiceClient } from '@/lib/supabase/server';
import { getExperience } from '@/angelcare-marketplace/kidflix/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const KEY = /^[a-z0-9][a-z0-9._-]{1,119}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const TTL_MS = 120_000;
const MAX_CACHE = 400;
const okHeaders = {
  'Cache-Control': 'public, max-age=15, s-maxage=120, stale-while-revalidate=120',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
};
const errorHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
};
type Totals = {
  views: number | null;
  clicks: number | null;
  threshold: 5;
  basis: 'consented_unique_visitors';
  viewAction: 'discover';
  clickAction: 'start';
  scope: 'experience_lifetime';
};
const cache = new Map<string, { until: number; promise: Promise<Totals> }>();

async function totalsForActiveRelease(releaseId: string): Promise<Totals> {
  const now = Date.now();
  const cached = cache.get(releaseId);
  if (cached && cached.until > now) return cached.promise;
  if (cache.size >= MAX_CACHE) cache.clear();
  const promise = (async () => {
    const db = await createServiceClient();
    const { data, error } = await db.rpc('ac_kidflix_public_engagement_v1', {
      p_release_id: releaseId,
    });
    if (error || !data || typeof data !== 'object' || Array.isArray(data)) {
      throw Error('AGGREGATE_UNAVAILABLE');
    }
    const value = data as Record<string, unknown>;
    const count = (x: unknown): number | null =>
      x === null ? null : typeof x === 'number' && Number.isSafeInteger(x) && x >= 5 ? x : NaN;
    const views = count(value.views), clicks = count(value.clicks);
    if (Number.isNaN(views) || Number.isNaN(clicks) || value.threshold !== 5 ||
        value.basis !== 'consented_unique_visitors' ||
        value.viewAction !== 'discover' || value.clickAction !== 'start' ||
        value.scope !== 'experience_lifetime') {
      throw Error('INVALID_AGGREGATE_CONTRACT');
    }
    return { views, clicks, threshold: 5, basis: 'consented_unique_visitors',
      viewAction: 'discover', clickAction: 'start', scope: 'experience_lifetime' } as Totals;
  })();
  cache.set(releaseId, { until: now + TTL_MS, promise });
  try {
    return await promise;
  } catch (error) {
    if (cache.get(releaseId)?.promise === promise) cache.delete(releaseId);
    throw error;
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await params;
    const url = new URL(request.url);
    const locale = url.searchParams.get('locale');
    if (!KEY.test(key) || (locale !== 'en' && locale !== 'fr' && locale !== 'ar')) {
      return Response.json({ available: false }, { status: 400, headers: errorHeaders });
    }
    const host = request.headers.get('host') || url.host;
    // This canonical KidFlix lookup enforces the live public host, locale,
    // published experience and currently active release before any stats access.
    const value = await getExperience(host, locale, key);
    if (!value || !UUID.test(value.releaseId)) {
      return Response.json({ available: false }, { status: 404, headers: errorHeaders });
    }
    const totals = await totalsForActiveRelease(value.releaseId);
    return Response.json({ available: true, ...totals }, { headers: okHeaders });
  } catch {
    // Fail closed. Never expose database errors, subjects or private metadata.
    return Response.json({ available: false }, { status: 503, headers: errorHeaders });
  }
}
