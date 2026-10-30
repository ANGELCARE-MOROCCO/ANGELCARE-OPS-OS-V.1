/** A defensive final parser for links previously validated against the source's
 * approved official Apply hosts by the database publication gate. */
import {publicHttpsUrl} from './native-gate';
export function verifiedExternalApplicationUrl(value:unknown):string|null{
 return publicHttpsUrl(value);
}
