import { NextResponse } from 'next/server';

export const REFFERQ_DEFAULT_APP_BASE_PATH = '/market-os/ambassadors/refferq';
export const REFFERQ_DEFAULT_API_BASE_PATH = '/api/market-os/refferq';

export const REFFERQ_COOKIE_NAMES = {
  session: 'refferq_session',
  token: 'refferq_token',
  user: 'refferq_user',
} as const;

export const REFFERQ_DATABASE_UNAVAILABLE_MESSAGE = 'REFFERQ_DATABASE_URL is not configured';

function readEnv(key: string): string | null {
  const value = process.env[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function getRefferqEnv() {
  return {
    databaseUrl: readEnv('REFFERQ_DATABASE_URL'),
    jwtSecret: readEnv('REFFERQ_JWT_SECRET'),
    appBasePath: readEnv('REFFERQ_APP_BASE_PATH') || REFFERQ_DEFAULT_APP_BASE_PATH,
    apiBasePath: readEnv('REFFERQ_API_BASE_PATH') || REFFERQ_DEFAULT_API_BASE_PATH,
    resendApiKey: readEnv('RESEND_API_KEY'),
    resendFromEmail: readEnv('RESEND_FROM_EMAIL'),
  };
}

export function getRefferqDatabaseUrl() {
  return getRefferqEnv().databaseUrl;
}

export function getRefferqJwtSecret() {
  return getRefferqEnv().jwtSecret || readEnv('JWT_SECRET') || (process.env.NODE_ENV === 'production' ? null : 'refferq-dev-fallback-secret');
}

export function getRefferqAppBasePath() {
  return getRefferqEnv().appBasePath;
}

export function getRefferqApiBasePath() {
  return getRefferqEnv().apiBasePath;
}

export function isRefferqDatabaseConfigured() {
  return Boolean(getRefferqDatabaseUrl());
}

export class RefferqDatabaseUnavailableError extends Error {
  constructor(message = REFFERQ_DATABASE_UNAVAILABLE_MESSAGE) {
    super(message);
    this.name = 'RefferqDatabaseUnavailableError';
  }
}

export function assertRefferqDatabaseConfigured() {
  if (!isRefferqDatabaseConfigured()) {
    throw new RefferqDatabaseUnavailableError();
  }
}

export function isRefferqDatabaseUnavailableError(error: unknown) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      ((error as Error).name === 'RefferqDatabaseUnavailableError' ||
        (error as Error).message === REFFERQ_DATABASE_UNAVAILABLE_MESSAGE)
  );
}

export function refferqDatabaseUnavailableResponse() {
  return NextResponse.json(
    { ok: false, error: REFFERQ_DATABASE_UNAVAILABLE_MESSAGE },
    { status: 503 }
  );
}
