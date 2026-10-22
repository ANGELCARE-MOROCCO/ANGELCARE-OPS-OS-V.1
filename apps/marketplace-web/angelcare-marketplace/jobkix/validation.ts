import { JobkixFault, isLocale, type Compensation, type Locale,type ProfileEntry } from './contracts';
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype);
}
export function object(value: unknown): Record<string, unknown> {
  if (!isPlainObject(value)) throw new JobkixFault('INVALID_INPUT');
  return value;
}
export function text(value: unknown, field: string, minimum = 1, maximum = 500): string {
  if (typeof value !== 'string') throw new JobkixFault('INVALID_INPUT', { [field]: 'required' });
  const result = value.normalize('NFC').trim();
  if (result.length < minimum || result.length > maximum || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(result)) throw new JobkixFault('INVALID_INPUT', { [field]: 'length_or_characters' });
  return result;
}
export function uuid(value: unknown, field = 'id'): string {
  const result = text(value, field, 36, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result)) throw new JobkixFault('INVALID_INPUT', { [field]: 'uuid' });
  return result.toLowerCase();
}
export function integer(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new JobkixFault('INVALID_INPUT', { [field]: 'integer' });
  return value;
}
export function countryCode(value: unknown, optional = false): string | null {
  if (optional && (value === null || value === undefined || value === '')) return null;
  if (typeof value !== 'string' || !/^[A-Z]{2}$/.test(value) || ['XX','ZZ'].includes(value)) throw new JobkixFault('INVALID_INPUT', { country: 'country_code' });
  // Region display names reject made-up codes while supporting the packaged ISO flags.
  const name = new Intl.DisplayNames(['en'], { type: 'region' }).of(value);
  if (!name || name === value) throw new JobkixFault('INVALID_INPUT', { country: 'unknown_country' });
  return value;
}
export function timezone(value: unknown): string {
  const result = text(value, 'timezone', 3, 100);
  if (result !== 'UTC' && !/^[A-Za-z_+-]+(?:\/[A-Za-z0-9_+.-]+)+$/.test(result)) throw new JobkixFault('INVALID_INPUT', { timezone: 'iana_timezone' });
  try { new Intl.DateTimeFormat('en', { timeZone: result }).format(); } catch { throw new JobkixFault('INVALID_INPUT', { timezone: 'iana_timezone' }); }
  return result;
}
export function instant(value: unknown, field: string): string {
  const result = text(value, field, 20, 35);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(result) || !Number.isFinite(Date.parse(result))) throw new JobkixFault('INVALID_INPUT', { [field]: 'utc_instant' });
  const normalized = new Date(result).toISOString();
  if (normalized.slice(0, 19) !== result.slice(0, 19)) throw new JobkixFault('INVALID_INPUT', { [field]: 'invalid_calendar_date' });
  return normalized;
}
export function locale(value: unknown): Locale {
  if (typeof value !== 'string' || !isLocale(value)) throw new JobkixFault('INVALID_INPUT', { locale: 'unsupported_locale' });
  return value;
}
export function choice<T extends string>(value: unknown, options: readonly T[], field: string): T {
  const found = options.find(option => option === value);
  if (!found) throw new JobkixFault('INVALID_INPUT', { [field]: 'invalid_option' });
  return found;
}
export function strings(value: unknown, field: string, maxItems = 50, maxLength = 200): string[] {
  if (!Array.isArray(value) || value.length > maxItems) throw new JobkixFault('INVALID_INPUT', { [field]: 'list' });
  const result = value.map(item => text(item, field, 1, maxLength));
  if (new Set(result).size !== result.length) throw new JobkixFault('INVALID_INPUT', { [field]: 'duplicate' });
  return result;
}
export function profileEntries(value:unknown,field:string):ProfileEntry[]{
 if(value===undefined)return [];if(!Array.isArray(value)||value.length>40)throw new JobkixFault('INVALID_INPUT',{[field]:'list'});
 const result=value.map(value=>{const row=object(value);if(Object.keys(row).some(key=>!['id','title','organization','start','end','description'].includes(key)))throw new JobkixFault('INVALID_INPUT',{[field]:'unknown_field'});
  const start=text(row.start,'start',7,7),end=text(row.end??'','end',0,7);if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(start)||end&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(end)||end&&end<start)throw new JobkixFault('INVALID_INPUT',{[field]:'date_range'});
  return {id:uuid(row.id),title:text(row.title,'title',1,240),organization:text(row.organization,'organization',1,240),start,end,description:text(row.description??'','description',0,4000)};
 });if(new Set(result.map(row=>row.id)).size!==result.length)throw new JobkixFault('INVALID_INPUT',{[field]:'duplicate_ids'});return result;
}
export function safeUrl(value: unknown, field: string, allowLocal = true): string {
  const raw = text(value, field, 1, 2048);
  if (/[\\\u0000-\u0020]/.test(raw) || /%(?:00|0a|0d|5c)/i.test(raw)) throw new JobkixFault('INVALID_INPUT', { [field]: 'unsafe_url' });
  if (allowLocal && /^\/(?!\/)/.test(raw)) {
    const url = new URL(raw, 'https://jobkix.invalid');
    if (url.origin === 'https://jobkix.invalid' && !/%2f/i.test(url.pathname)) return url.pathname + url.search + url.hash;
  }
  try {
    const url = new URL(raw);
    if (url.protocol === 'https:' && !url.username && !url.password && !['localhost','127.0.0.1','[::1]'].includes(url.hostname)) return url.href;
  } catch { /* Validation below has one safe result. */ }
  throw new JobkixFault('INVALID_INPUT', { [field]: 'unsafe_url' });
}
export function compensation(value: unknown): Compensation | null {
  if (value === null || value === undefined) return null;
  const row = object(value);
  const currency = text(row.currency, 'currency', 3, 3);
  if (!/^[A-Z]{3}$/.test(currency) || !Intl.supportedValuesOf('currency').includes(currency)) throw new JobkixFault('INVALID_INPUT', { currency: 'currency_code' });
  const amount = (v: unknown) => v === null || v === undefined ? null : typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1e9 ? v : (() => { throw new JobkixFault('INVALID_INPUT', { compensation: 'amount' }); })();
  const minimum = amount(row.minimum), maximum = amount(row.maximum);
  if (minimum === null && maximum === null || minimum !== null && maximum !== null && maximum < minimum) throw new JobkixFault('INVALID_INPUT', { compensation: 'range' });
  return { minimum, maximum, currency, unit: choice(row.unit, ['hour','day','week','month','year'], 'unit') };
}
