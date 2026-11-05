/** ANGELCARE-COMPLIANCE-MAX-R1: shared logic, never shared visual identity. */
export type ComplianceWorld = 'angelcare' | 'kidflix' | 'jobkix';
export type ConsentChoice = { version: 2; necessary: true; analytics: boolean; functional: boolean; changedAt: string };
export const CONSENT_VERSION = 2;
export const CONSENT_EVENT = 'angelcare:consent-changed';
const KEYS: Record<ComplianceWorld, string> = {
  angelcare: 'angelcare_compliance_consent_v2',
  kidflix: 'kidflix_compliance_consent_v2',
  jobkix: 'jobkix_compliance_consent_v2',
};
const LANGUAGES = new Set(['fr', 'en', 'ar']);
const JOBKIX_LANGUAGES = new Set(['en','fr','es','hi','tl','id','ar']);
const FORBIDDEN = new Set([
  'api','admin','auth','account','accounts','dashboard','workspace','profile','profiles',
  'candidate','candidates','hirer','hirers','hiring','career','onboarding','login','logout',
  'checkout','basket','cart','payment','payments','order','orders','booking','bookings',
  'application','applications','apply','inbox','messages','documents','downloads','family',
  'provider','providers','staff','customer','customers','partner-os','my-angelcare',
  'settings','billing','subscriptions','subscription','quotation','quote-basket',
  'preview','private','saved','enrollment',
]);
/** The banner is limited to existing public world prefixes, not admin/API. */
export function worldForPath(pathname: string): ComplianceWorld | null {
  if (!pathname || /[?#%\\]/.test(pathname)) return null;
  const parts = pathname.toLowerCase().split('/').filter(Boolean);
  if (parts.length < 2) return null;
  if (parts[0] === 'angelcare-marketplace' && LANGUAGES.has(parts[1])) return 'angelcare';
  if (parts[0] === 'kidflix' && LANGUAGES.has(parts[1])) return 'kidflix';
  if (parts[0] === 'jobkix' && JOBKIX_LANGUAGES.has(parts[1])) return 'jobkix';
  return null;
}
export function trackingAllowedOnPath(pathname: string): boolean {
  const world = worldForPath(pathname);
  if (!world || world === 'kidflix') return false;
  const parts = pathname.toLowerCase().split('/').filter(Boolean);
  if (parts.slice(2).some(p => FORBIDDEN.has(p))) return false;
  return true;
}
export function analyticsSupported(world: ComplianceWorld): boolean { return world !== 'kidflix'; }
export function readConsent(world: ComplianceWorld): ConsentChoice | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = JSON.parse(window.localStorage.getItem(KEYS[world]) || 'null') as Partial<ConsentChoice> | null;
    if (data?.version !== 2 || data.necessary !== true || typeof data.analytics !== 'boolean' || typeof data.functional !== 'boolean' || typeof data.changedAt !== 'string') return null;
    if (!Number.isFinite(Date.parse(data.changedAt))) return null;
    return {version: 2, necessary: true, analytics: analyticsSupported(world) && data.analytics, functional: data.functional, changedAt: data.changedAt};
  } catch { return null; }
}
export function consentAnalyticsAllowed(world: ComplianceWorld): boolean {return readConsent(world)?.analytics === true;}
export function saveConsent(world: ComplianceWorld, values: {analytics:boolean; functional:boolean}): ConsentChoice | null {
  if (typeof window === 'undefined') return null;
  const record: ConsentChoice = {version: 2, necessary: true, analytics: analyticsSupported(world) && values.analytics, functional: values.functional, changedAt: new Date().toISOString()};
  try {window.localStorage.setItem(KEYS[world], JSON.stringify(record));} catch {return null;}
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, {detail: {world}}));
  return record;
}
export function subscribeConsent(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onLocal = () => listener();
  const onStorage = (event: StorageEvent) => { if (event.key === null || Object.values(KEYS).includes(event.key)) listener(); };
  window.addEventListener(CONSENT_EVENT, onLocal);
  window.addEventListener('storage', onStorage);
  return () => {window.removeEventListener(CONSENT_EVENT, onLocal);window.removeEventListener('storage', onStorage);};
}
export function consentStorageKey(world: ComplianceWorld): string {return KEYS[world];}
