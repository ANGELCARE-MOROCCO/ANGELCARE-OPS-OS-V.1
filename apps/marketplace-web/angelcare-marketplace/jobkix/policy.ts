import { JobkixFault, type Application, type ApplicationState, type CandidateProfile, type Capability, type Membership, type MembershipRole, type Organization, type Principal, type PrivateFile, type Vacancy, type VacancyState } from './contracts';

const GRANTS: Readonly<Record<MembershipRole, readonly Capability[]>> = {
  owner: ['organization.manage','team.manage','vacancy.write','vacancy.publish','application.read','application.decide','interview.manage','evaluation.write','offer.write','message.write','talent.search','analytics.read'],
  admin: ['organization.manage','team.manage','vacancy.write','vacancy.publish','application.read','application.decide','interview.manage','evaluation.write','offer.write','message.write','talent.search','analytics.read'],
  recruiter: ['vacancy.write','vacancy.publish','application.read','application.decide','interview.manage','evaluation.write','offer.write','message.write','talent.search','analytics.read'],
  hiring_manager: ['application.read','application.decide','interview.manage','evaluation.write','offer.write','message.write','analytics.read'],
  interviewer: ['evaluation.write'],
  viewer: [],
};
export function requirePrincipal(actor: Principal | null): Principal {
  if (!actor) throw new JobkixFault('AUTHENTICATION_REQUIRED');
  if (actor.restricted) throw new JobkixFault('ACCOUNT_RESTRICTED');
  if (!actor.emailConfirmed) throw new JobkixFault('EMAIL_UNCONFIRMED');
  return actor;
}
export function canAct(actor: Principal, memberships: readonly Membership[], capability: Capability, organizationId: string, scope: { siteId?: string | null; vacancyId?: string | null } = {}, now = Date.now()): boolean {
  if (actor.restricted || !actor.emailConfirmed) return false;
  return memberships.some(m => m.active && m.userId === actor.userId && m.organizationId === organizationId &&
    (!m.expiresAt || Date.parse(m.expiresAt) > now) && GRANTS[m.role].includes(capability) &&
    (!m.siteIds.length || Boolean(scope.siteId && m.siteIds.includes(scope.siteId))) &&
    (!m.vacancyIds.length || Boolean(scope.vacancyId && m.vacancyIds.includes(scope.vacancyId))));
}
export function requireCapability(actor: Principal, memberships: readonly Membership[], capability: Capability, vacancy: Pick<Vacancy, 'organizationId' | 'siteId' | 'id'>, now = Date.now()): void {
  requirePrincipal(actor);
  if (!canAct(actor, memberships, capability, vacancy.organizationId, { siteId: vacancy.siteId, vacancyId: vacancy.id }, now)) throw new JobkixFault('FORBIDDEN');
}
export function vacancyEligible(vacancy: Vacancy, organization: Organization, now = Date.now()): boolean {
  return vacancy.organizationId === organization.id && vacancy.state === 'published' && organization.status === 'active' &&
    vacancy.publishedAt !== null && Number.isFinite(Date.parse(vacancy.publishedAt)) && Date.parse(vacancy.publishedAt) <= now &&
    vacancy.expiresAt !== null && Number.isFinite(Date.parse(vacancy.expiresAt)) && Date.parse(vacancy.expiresAt) > now &&
    organization.identityReviewedUntil !== null && Date.parse(organization.identityReviewedUntil) > now;
}
export function canDiscoverCandidate(profile: CandidateProfile, organization: Organization, actor: Principal, memberships: readonly Membership[], now = Date.now()): boolean {
  return profile.discoverable && !profile.blockedOrganizationIds.includes(organization.id) && organization.status === 'active' &&
    Boolean(organization.identityReviewedUntil && Date.parse(organization.identityReviewedUntil) > now) &&
    canAct(actor, memberships, 'talent.search', organization.id, {}, now);
}
export function canReadApplication(actor: Principal, memberships: readonly Membership[], application: Application, vacancy: Vacancy, now = Date.now()): boolean {
  if (actor.restricted || !actor.emailConfirmed) return false;
  return application.candidateUserId === actor.userId || canAct(actor, memberships, 'application.read', application.organizationId, { siteId: vacancy.siteId, vacancyId: vacancy.id }, now);
}
export function canReadPrivateFile(actor: Principal, file: PrivateFile, application: Application | null, vacancy: Vacancy | null, memberships: readonly Membership[], profile: CandidateProfile | null, now = Date.now()): boolean {
  if (actor.restricted || !actor.emailConfirmed || file.status !== 'ready') return false;
  if (file.ownerUserId === actor.userId) return true;
  if (!application || !vacancy || !profile || application.snapshot.file?.id !== file.id || application.snapshot.file.revision !== file.revision || application.candidateUserId !== file.ownerUserId) return false;
  if (application.state === 'withdrawn' || profile.blockedOrganizationIds.includes(application.organizationId)) return false;
  return canAct(actor, memberships, 'application.read', application.organizationId, { siteId: vacancy.siteId, vacancyId: vacancy.id }, now);
}
const VACANCY_TRANSITIONS: Readonly<Record<VacancyState, readonly VacancyState[]>> = {
  draft: ['pending_review','closed','archived'], pending_review: ['draft','published','closed','suspended'],
  published: ['paused','expired','filled','closed','suspended'], paused: ['draft','pending_review','closed','archived','suspended'],
  expired: ['draft','archived'], filled: ['archived'], closed: ['draft','archived'],
  archived: [], suspended: ['draft','archived'],
};
const APPLICATION_TRANSITIONS: Readonly<Record<ApplicationState, readonly ApplicationState[]>> = {
  submitted: ['acknowledged','under_review','shortlisted','declined','on_hold','closed_due_to_vacancy'],
  acknowledged: ['under_review','shortlisted','declined','on_hold','closed_due_to_vacancy'],
  under_review: ['shortlisted','interview','declined','on_hold','closed_due_to_vacancy'],
  shortlisted: ['interview','offer','declined','on_hold','closed_due_to_vacancy'],
  interview: ['shortlisted','offer','declined','on_hold','closed_due_to_vacancy'],
  offer: ['hired','shortlisted','declined','closed_due_to_vacancy'],
  on_hold: ['under_review','shortlisted','declined','closed_due_to_vacancy'],
  hired: [], declined: [], withdrawn: [], closed_due_to_vacancy: [],
};
/** UI options only; the canonical SQL command rechecks the current application under lock. */
export function recruiterStages(state:ApplicationState):readonly ApplicationState[]{return APPLICATION_TRANSITIONS[state].filter(target=>target!=='offer'&&target!=='hired');}
export function assertVacancyTransition(from: VacancyState, to: VacancyState): void {
  if (!VACANCY_TRANSITIONS[from].includes(to)) throw new JobkixFault('INVALID_TRANSITION');
}
export function assertApplicationTransition(from: ApplicationState, to: ApplicationState, acceptedOffer = false): void {
  if (!APPLICATION_TRANSITIONS[from].includes(to) || to === 'hired' && !acceptedOffer) throw new JobkixFault('INVALID_TRANSITION');
}
export function expectedVersion(actual: number, expected: number): void {
  if (!Number.isSafeInteger(expected) || expected < 1 || expected !== actual) throw new JobkixFault('VERSION_CONFLICT');
}
/** Public projection is a whitelist: private organization/profile/household fields never enter rendering. */
export function publicVacancy(v: Vacancy, organization: Organization, now = Date.now()) {
  if (!vacancyEligible(v, organization, now)) return null;
  return {
    id: v.id, title: v.title, organizationId: organization.id, employerName: organization.publicName,
    employerKind: organization.kind, country: v.country, region: v.region, city: v.city,
    settingId: v.settingId, occupationId: v.occupationId, description: v.description,
    duties: v.duties, requirements: v.requirements, benefits: v.benefits,
    workSchedule: v.workSchedule, contractType: v.contractType, workLocation: v.workLocation,
    liveIn: v.liveIn, hoursPerWeek: v.hoursPerWeek, languages: v.languages,
    compensation: v.compensation, overseasApplicants: v.overseasApplicants,
    sponsorship: v.sponsorship, relocation: v.relocation, originalLocale: v.originalLocale,
    publishedAt: v.publishedAt, expiresAt: v.expiresAt, updatedAt: v.updatedAt,
  };
}
