// @ts-nocheck
import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getCurrentAppUser } from '@/lib/auth/session';
import { prisma } from './prisma';
import {
  REFFERQ_COOKIE_NAMES,
  getRefferqAppBasePath,
  isRefferqDatabaseConfigured,
} from './env';

export type RefferqSessionUser = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'AFFILIATE';
  hasAffiliate: boolean;
  profilePicture?: string | null;
  source?: 'refferq' | 'angelcare';
  sessionId?: string;
};

const ADMIN_COMPATIBLE_ROLES = new Set([
  'ceo',
  'owner',
  'super_admin',
  'superadmin',
  'admin',
  'direction',
  'operations',
  'operator',
  'session_leader',
  'manager',
  'finance',
  'hr',
  'academy_admin',
]);

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function toBase64UrlJson(value: unknown) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(value))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64UrlJson<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(decodeURIComponent(escape(atob(padded)))) as T;
  } catch {
    return null;
  }
}

function mapAngelCareRoleToRefferqRole(role: unknown) {
  return ADMIN_COMPATIBLE_ROLES.has(normalize(role)) ? 'ADMIN' : 'AFFILIATE';
}

function getSessionJwtSecret() {
  const secret = process.env.REFFERQ_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('REFFERQ_JWT_SECRET or JWT_SECRET is not configured');
  }

  return new TextEncoder().encode(secret);
}

function buildSessionUser(user: {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'AFFILIATE';
  hasAffiliate: boolean;
  profilePicture?: string | null;
  source?: 'refferq' | 'angelcare';
}): RefferqSessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    hasAffiliate: Boolean(user.hasAffiliate),
    profilePicture: user.profilePicture || null,
    source: user.source || 'refferq',
  };
}

async function signSessionToken(user: RefferqSessionUser, sessionId: string) {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    hasAffiliate: user.hasAffiliate,
    profilePicture: user.profilePicture || null,
    source: user.source || 'refferq',
    sessionId,
    appBasePath: getRefferqAppBasePath(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSessionJwtSecret());
}

export async function issueRefferqSession(user: RefferqSessionUser, sessionId = crypto.randomUUID()) {
  const token = await signSessionToken(user, sessionId);

  return {
    user,
    sessionId,
    token,
    userCookie: toBase64UrlJson(user),
  };
}

export async function verifyRefferqSessionToken(token: string | null | undefined) {
  let secret: Uint8Array;
  try {
    secret = getSessionJwtSecret();
  } catch {
    return null;
  }
  if (!token || !secret) return null;

  try {
    const result = await jwtVerify(token, secret);
    const payload = result.payload as Record<string, any>;
    const user = buildSessionUser({
      id: String(payload.userId || payload.sub || ''),
      email: String(payload.email || ''),
      name: String(payload.name || ''),
      role: payload.role === 'ADMIN' ? 'ADMIN' : 'AFFILIATE',
      hasAffiliate: Boolean(payload.hasAffiliate),
      profilePicture: payload.profilePicture || null,
      source: payload.source === 'angelcare' ? 'angelcare' : 'refferq',
    });

    return {
      user,
      sessionId: String(payload.sessionId || ''),
      payload,
    };
  } catch {
    return null;
  }
}

export function decodeRefferqUserCookie(value: string | null | undefined) {
  return fromBase64UrlJson<RefferqSessionUser>(value);
}

export function setRefferqSessionCookies(response: { cookies: { set: Function } }, session: Awaited<ReturnType<typeof issueRefferqSession>>) {
  const secure = process.env.NODE_ENV === 'production';
  const common = {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
  };

  response.cookies.set(REFFERQ_COOKIE_NAMES.session, session.sessionId, {
    ...common,
    maxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.set(REFFERQ_COOKIE_NAMES.token, session.token, {
    ...common,
    maxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.set(REFFERQ_COOKIE_NAMES.user, session.userCookie, {
    ...common,
    maxAge: 60 * 60 * 24 * 7,
  });
}

function createAffiliateReferralCode(email: string) {
  return `AC-${crypto.createHash('sha256').update(email).digest('hex').slice(0, 10).toUpperCase()}`;
}

async function ensureRefferqUserInDatabase(angelcareUser: any): Promise<RefferqSessionUser> {
  const email = String(angelcareUser?.email || '').trim().toLowerCase();
  const name = String(angelcareUser?.name || angelcareUser?.full_name || email || 'AngelCare User').trim();
  const role = mapAngelCareRoleToRefferqRole(angelcareUser?.role);
  const adminSafe = role === 'ADMIN';

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { affiliate: true },
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          role: adminSafe ? 'ADMIN' : existingUser.role,
          status: 'ACTIVE',
          profilePicture: angelcareUser?.profilePicture || existingUser.profilePicture || null,
        },
        include: { affiliate: true },
      })
    : await prisma.user.create({
        data: {
          email,
          name,
          password: crypto.randomBytes(32).toString('base64url'),
          role: adminSafe ? 'ADMIN' : 'AFFILIATE',
          status: 'ACTIVE',
          profilePicture: angelcareUser?.profilePicture || null,
        },
        include: { affiliate: true },
      });

  let affiliate = user.affiliate || null;
  if (!adminSafe && !affiliate) {
    affiliate = await prisma.affiliate.create({
      data: {
        userId: user.id,
        referralCode: createAffiliateReferralCode(email),
        payoutDetails: {},
        balanceCents: 0,
      },
    });
  }

  return buildSessionUser({
    id: user.id,
    email: user.email,
    name: user.name,
    role: adminSafe ? 'ADMIN' : 'AFFILIATE',
    hasAffiliate: Boolean(affiliate),
    profilePicture: user.profilePicture || null,
    source: 'angelcare',
  });
}

export async function bridgeAngelCareUserToRefferq() {
  const angelcareUser = await getCurrentAppUser();
  if (!angelcareUser) return null;

  if (!isRefferqDatabaseConfigured()) {
    return buildSessionUser({
      id: String(angelcareUser.id),
      email: String(angelcareUser.email || '').toLowerCase(),
      name: String(angelcareUser.name || angelcareUser.full_name || angelcareUser.email || 'AngelCare User'),
      role: mapAngelCareRoleToRefferqRole((angelcareUser as any).role),
      hasAffiliate: false,
      profilePicture: angelcareUser.profilePicture || null,
      source: 'angelcare',
    });
  }

  return ensureRefferqUserInDatabase(angelcareUser);
}

export async function resolveRefferqSessionFromCookies(cookieStore: Awaited<ReturnType<typeof cookies>> | { get: Function }) {
  const tokenCookie = cookieStore.get(REFFERQ_COOKIE_NAMES.token)?.value || null;
  const verified = await verifyRefferqSessionToken(tokenCookie);
  if (verified?.user) {
    return verified.user;
  }

  const userCookie = decodeRefferqUserCookie(cookieStore.get(REFFERQ_COOKIE_NAMES.user)?.value || null);
  return userCookie || null;
}

export function buildRefferqSessionUserFromRecord(record: any, hasAffiliate = false): RefferqSessionUser {
  return buildSessionUser({
    id: String(record.id),
    email: String(record.email || '').toLowerCase(),
    name: String(record.name || record.email || 'RefferQ User'),
    role: record.role === 'ADMIN' ? 'ADMIN' : 'AFFILIATE',
    hasAffiliate,
    profilePicture: record.profilePicture || null,
    source: 'refferq',
  });
}
