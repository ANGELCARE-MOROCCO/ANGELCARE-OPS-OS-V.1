import { JobkixFault, type ApplicationSnapshot, type CandidateProfile, type Interview, type Offer, type Organization, type Principal, type PrivateFile, type Vacancy } from './contracts';
import { expectedVersion, requirePrincipal, vacancyEligible } from './policy';
import * as v from './validation';

export const APPLICATION_CONSENT_REVISION = 'jobkix-application-2026-10-20';
export interface SubmissionInput {
  vacancyId: string; vacancyVersion: number; profileVersion: number;
  documentId: string | null; answers: Record<string, string>;
  sharingConsent: boolean; consentRevision: string;
}
/** Pure submission preparation; the canonical SQL command repeats its transaction guards under locks. */
export function prepareSubmission(actor: Principal, profile: CandidateProfile, vacancy: Vacancy, organization: Organization, file: PrivateFile | null, input: SubmissionInput, now = Date.now()): ApplicationSnapshot {
  requirePrincipal(actor);
  if (profile.userId !== actor.userId || input.vacancyId !== vacancy.id) throw new JobkixFault('FORBIDDEN');
  if (!profile.adultConfirmedAt || !profile.displayName.trim()) throw new JobkixFault('INVALID_INPUT', { profile: 'adult_profile_required' });
  if (profile.blockedOrganizationIds.includes(organization.id)) throw new JobkixFault('FORBIDDEN');
  if (!vacancyEligible(vacancy, organization, now)) throw new JobkixFault('VACANCY_UNAVAILABLE');
  expectedVersion(vacancy.version, input.vacancyVersion);
  expectedVersion(profile.version, input.profileVersion);
  if (input.sharingConsent !== true || input.consentRevision !== APPLICATION_CONSENT_REVISION) throw new JobkixFault('INVALID_INPUT', { sharingConsent: 'consent_required' });
  if (input.documentId !== null && (!file || file.id !== input.documentId)) throw new JobkixFault('DOCUMENT_NOT_READY');
  if (vacancy.requiredDocument && !file) throw new JobkixFault('DOCUMENT_NOT_READY');
  if (file && (file.ownerUserId !== actor.userId || file.status !== 'ready' || file.purpose !== 'cv' || !file.sha256 || input.documentId !== file.id)) throw new JobkixFault('DOCUMENT_NOT_READY');
  const answers: Record<string, string> = {};
  for (const key of Object.keys(input.answers)) if (!vacancy.questions.some(q => q.id === key)) throw new JobkixFault('INVALID_INPUT', { answers: 'unknown_question' });
  const ids = new Set<string>();
  for (const question of vacancy.questions) {
    if (ids.has(question.id)) throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
    ids.add(question.id);
    const answer = v.text(input.answers[question.id] ?? '', question.id, question.required ? 1 : 0, question.maxLength);
    if (question.kind === 'yes_no' && answer && !['yes','no'].includes(answer)) throw new JobkixFault('INVALID_INPUT', { [question.id]: 'yes_or_no' });
    answers[question.id] = answer;
  }
  return structuredClone({
    vacancyId: vacancy.id, vacancyVersion: vacancy.version, profileVersion: profile.version,
    profile: { displayName: profile.displayName, headline: profile.headline, country: profile.country, summary: profile.summary, skills: profile.skills, occupations: profile.occupations, languages: profile.languages,experience:v.profileEntries(profile.experience,'experience'),education:v.profileEntries(profile.education,'education') },
    answers, file: file ? { id: file.id, revision: file.revision, sha256: file.sha256 } : null,
    sharedAt: new Date(now).toISOString(), consentRevision: APPLICATION_CONSENT_REVISION,
  });
}
export function validateInterview(input: { startsAt: unknown; endsAt: unknown; timezone: unknown; format: unknown; location: unknown; panelUserIds: unknown }, now = Date.now()) {
  const startsAt = v.instant(input.startsAt, 'startsAt'), endsAt = v.instant(input.endsAt, 'endsAt');
  const duration = Date.parse(endsAt) - Date.parse(startsAt);
  if (Date.parse(startsAt) <= now || duration < 5 * 60000 || duration > 8 * 3600000) throw new JobkixFault('INVALID_INPUT', { startsAt: 'future_time_and_duration' });
  const format = v.choice(input.format, ['video','phone','in_person'], 'format');
  const rawLocation = v.text(input.location, 'location', 1, 1500);
  const location = format === 'video' ? v.safeUrl(rawLocation, 'location', false) : rawLocation;
  const panelUserIds = v.strings(input.panelUserIds, 'panelUserIds', 20, 36).map(id => v.uuid(id, 'panelUserIds'));
  return { startsAt, endsAt, timezone: v.timezone(input.timezone), format, location, panelUserIds };
}
export function candidateOfferResponse(actor: Principal, offer: Offer, version: number, response: 'accepted' | 'declined', now = Date.now()): Offer {
  requirePrincipal(actor);
  if (offer.candidateUserId !== actor.userId) throw new JobkixFault('FORBIDDEN');
  expectedVersion(offer.version, version);
  if (offer.state !== 'sent') throw new JobkixFault('INVALID_TRANSITION');
  if (offer.responseDeadline && Date.parse(offer.responseDeadline) <= now) throw new JobkixFault('OFFER_EXPIRED');
  return { ...structuredClone(offer), version: offer.version + 1, state: response };
}
/** RFC 5545 values: no untrusted content may add properties or recipients. */
function calendarText(value: string): string { return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,'); }
function calendarInstant(value: string): string { return v.instant(value, 'calendarInstant').replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
function foldLine(value: string): string {
  const lines: string[] = []; let line = '';
  for (const character of value) {
    if (new TextEncoder().encode(line + character).length > 73) { lines.push(line); line = ' '; }
    line += character;
  }
  lines.push(line); return lines.join('\r\n');
}
export function interviewCalendar(interview: Interview, title: string, updatedAt: string): string {
  const method = interview.state === 'cancelled' ? 'CANCEL' : 'PUBLISH';
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//JOBKIX//Recruitment Calendar//EN','CALSCALE:GREGORIAN',`METHOD:${method}`,'BEGIN:VEVENT',
    `UID:${v.uuid(interview.id)}@jobkix`,`SEQUENCE:${v.integer(interview.version, 'version', 1, 1000000)}`,
    `DTSTAMP:${calendarInstant(updatedAt)}`,`DTSTART:${calendarInstant(interview.startsAt)}`,`DTEND:${calendarInstant(interview.endsAt)}`,
    `SUMMARY:${calendarText(title)}`,`LOCATION:${calendarText(interview.location)}`,
    `DESCRIPTION:${calendarText(interview.timezone)}`,`STATUS:${interview.state === 'cancelled' ? 'CANCELLED' : interview.state === 'scheduled' ? 'CONFIRMED' : 'TENTATIVE'}`,
    'END:VEVENT','END:VCALENDAR',''].map(foldLine).join('\r\n');
}
export function publicJobPosting(vacancy: Vacancy, organization: Organization, canonical: string, now = Date.now()) {
  if (!vacancyEligible(vacancy, organization, now)) return null;
  const value: Record<string, unknown> = {
    '@context': 'https://schema.org', '@type': 'JobPosting', title: vacancy.title,
    description: [vacancy.description, ...vacancy.duties, ...vacancy.requirements].join('\n'),
    identifier: { '@type': 'PropertyValue', name: 'JOBKIX', value: vacancy.id },
    datePosted: vacancy.publishedAt, validThrough: vacancy.expiresAt, url: canonical,
    hiringOrganization: { '@type': 'Organization', name: organization.publicName },
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: vacancy.city, addressRegion: vacancy.region, addressCountry: vacancy.country } },
  };
  const types = [vacancy.workSchedule === 'full_time' ? 'FULL_TIME' : vacancy.workSchedule === 'part_time' ? 'PART_TIME' : null,
    vacancy.contractType === 'temporary' || vacancy.contractType === 'seasonal' ? 'TEMPORARY' : vacancy.contractType === 'internship' ? 'INTERN' : null].filter(Boolean);
  if (types.length) value.employmentType = types;
  if (vacancy.workLocation === 'remote') value.jobLocationType = 'TELECOMMUTE';
  if (vacancy.compensation) {
    const pay = vacancy.compensation;
    value.baseSalary = { '@type':'MonetaryAmount', currency:pay.currency, value:{ '@type':'QuantitativeValue', ...(pay.minimum === null ? {} : { minValue:pay.minimum }), ...(pay.maximum === null ? {} : { maxValue:pay.maximum }), unitText:pay.unit.toUpperCase() } };
  }
  return value;
}
