/** Execution contract §§12–14, 21–26. No commerce or internal HR identity. */
export const LOCALES = ['en', 'fr', 'es', 'hi', 'tl', 'id', 'ar'] as const;
export type Locale = typeof LOCALES[number];
export function isLocale(value: string): value is Locale {
  return LOCALES.some(locale => locale === value);
}
export type UUID = string;
export type Declaration = 'yes' | 'no' | 'unknown';
export type VacancyState = 'draft' | 'pending_review' | 'published' | 'paused' | 'expired' | 'filled' | 'closed' | 'archived' | 'suspended';
export type ApplicationState = 'submitted' | 'acknowledged' | 'under_review' | 'shortlisted' | 'interview' | 'offer' | 'hired' | 'declined' | 'withdrawn' | 'on_hold' | 'closed_due_to_vacancy';
export type OrganizationKind = 'household' | 'institution' | 'healthcare' | 'hospitality' | 'ngo' | 'public' | 'multi_site';
export type MembershipRole = 'owner' | 'admin' | 'recruiter' | 'hiring_manager' | 'interviewer' | 'viewer';
export type Capability = 'organization.manage' | 'team.manage' | 'vacancy.write' | 'vacancy.publish' | 'application.read' | 'application.decide' | 'interview.manage' | 'evaluation.write' | 'offer.write' | 'message.write' | 'talent.search' | 'analytics.read';
export type FaultCode = 'INVALID_INPUT' | 'AUTHENTICATION_REQUIRED' | 'EMAIL_UNCONFIRMED' | 'FORBIDDEN' | 'ACCOUNT_RESTRICTED' | 'NOT_FOUND' | 'VERSION_CONFLICT' | 'IDEMPOTENCY_CONFLICT' | 'VACANCY_UNAVAILABLE' | 'ALREADY_APPLIED' | 'DOCUMENT_NOT_READY' | 'INVALID_TRANSITION' | 'OFFER_EXPIRED' | 'DEPENDENCY_UNAVAILABLE' | 'RATE_LIMITED';
export class JobkixFault extends Error {
  constructor(public readonly code: FaultCode, public readonly fields: Record<string, string> = {}) {
    super(code);
    this.name = 'JobkixFault';
  }
}
export interface CountryContext {
  detectedConnection: string | null;
  origin: string | null;
  destination: string | null;
  reach: 'domestic' | 'abroad' | 'worldwide';
  locale: Locale;
  timezone: string;
}
export interface Principal { userId: UUID; emailConfirmed: boolean; restricted: boolean }
export interface Membership {
  id: UUID; userId: UUID; organizationId: UUID; role: MembershipRole;
  siteIds: UUID[]; vacancyIds: UUID[]; active: boolean; expiresAt: string | null;
}
export interface Organization {
  id: UUID; kind: OrganizationKind; publicName: string; country: string;
  status: 'active' | 'suspended' | 'closed'; identityReviewedUntil: string | null;
  version: number;
}
export interface Compensation {
  minimum: number | null; maximum: number | null; currency: string;
  unit: 'hour' | 'day' | 'week' | 'month' | 'year';
}
export interface ScreeningQuestion { id: UUID; label: string; required: boolean; kind: 'text' | 'yes_no'; maxLength: number }
export interface Vacancy {
  id: UUID; organizationId: UUID; siteId: UUID | null; version: number;
  state: VacancyState; title: string; settingId: string; occupationId: string;
  country: string; region: string; city: string; originalLocale: Locale;
  description: string; duties: string[]; requirements: string[]; benefits: string[];
  workSchedule: 'full_time' | 'part_time' | 'flexible';
  contractType: 'permanent' | 'fixed_term' | 'temporary' | 'seasonal' | 'internship' | 'other';
  workLocation: 'on_site' | 'remote' | 'hybrid'; liveIn: boolean;
  hoursPerWeek: number | null; languages: string[];
  compensation: Compensation | null; overseasApplicants: Declaration;
  sponsorship: Declaration; relocation: Declaration; requiredDocument: boolean;
  questions: ScreeningQuestion[]; publishedAt: string | null; expiresAt: string | null;
  reviewedVersion: number | null; updatedAt: string;
}
export interface CandidateProfile {
  id: UUID; userId: UUID; version: number; displayName: string; headline: string;
  country: string | null; timezone: string; locale: Locale; summary: string;
  skills: string[]; occupations: string[]; languages: string[];
  experience: ProfileEntry[]; education: ProfileEntry[];
  adultConfirmedAt: string | null;
  discoverable: boolean; blockedOrganizationIds: UUID[];
}
export interface ProfileEntry {id:string;title:string;organization:string;start:string;end:string;description:string}
export interface PrivateFile {
  id: UUID; ownerUserId: UUID; organizationId: UUID | null;
  purpose: 'cv' | 'credential' | 'portfolio' | 'verification' | 'report';
  status: 'uploading' | 'quarantined' | 'ready' | 'rejected' | 'deleted';
  mime: string; bytes: number; sha256: string | null; revision: number;
}
export interface ApplicationSnapshot {
  vacancyId: UUID; vacancyVersion: number; profileVersion: number;
  profile: Pick<CandidateProfile, 'displayName' | 'headline' | 'country' | 'summary' | 'skills' | 'occupations' | 'languages' | 'experience' | 'education'>;
  answers: Record<string, string>; file: Pick<PrivateFile, 'id' | 'revision' | 'sha256'> | null;
  sharedAt: string; consentRevision: string;
}
export interface Application {
  id: UUID; candidateUserId: UUID; vacancyId: UUID; organizationId: UUID;
  version: number; state: ApplicationState; snapshot: ApplicationSnapshot;
  submittedAt: string; receipt: string;
}
export interface Offer {
  id: UUID; applicationId: UUID; organizationId: UUID; candidateUserId: UUID;
  version: number; state: 'draft' | 'sent' | 'accepted' | 'declined' | 'withdrawn' | 'expired';
  title: string; terms: string; compensation: Compensation | null;
  startsAt: string | null; responseDeadline: string | null; sentAt: string | null;
}
export interface Interview {
  id: UUID; applicationId: UUID; organizationId: UUID; candidateUserId: UUID;
  version: number; state: 'proposed' | 'scheduled' | 'completed' | 'cancelled' | 'declined';
  startsAt: string; endsAt: string; timezone: string; format: 'video' | 'phone' | 'in_person';
  location: string; panelUserIds: UUID[]; candidateResponse: 'pending' | 'accepted' | 'declined' | 'reschedule_requested';
}
export interface DurableEvent {
  id: UUID; type: string; objectId: UUID; actorUserId: UUID;
  occurredAt: string; payload: Record<string, unknown>;
}
export interface CommandReceipt<T> { id: UUID; result: T; replayed: boolean }
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
