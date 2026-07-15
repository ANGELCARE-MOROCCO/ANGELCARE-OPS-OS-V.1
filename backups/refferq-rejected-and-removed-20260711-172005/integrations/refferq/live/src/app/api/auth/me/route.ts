// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@refferq/lib/prisma';
import {
  bridgeAngelCareUserToRefferq,
  decodeRefferqUserCookie,
  issueRefferqSession,
  resolveRefferqSessionFromCookies,
  setRefferqSessionCookies,
} from '@refferq/lib/angelcare-auth-bridge';

export async function GET(request: NextRequest) {
  try {
    const hasToken = Boolean(request.cookies.get('refferq_token')?.value);
    const cookieSession = await resolveRefferqSessionFromCookies(request.cookies);

    if (cookieSession) {
      let user = cookieSession;

      try {
        if (user.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
              affiliate: true
            }
          });

          if (dbUser) {
            user = {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
              role: dbUser.role === 'ADMIN' ? 'ADMIN' : 'AFFILIATE',
              hasAffiliate: Boolean(dbUser.affiliate),
              profilePicture: dbUser.profilePicture || null,
              source: 'refferq',
            };
          }
        }
      } catch {
        // Fall back to the cookie session if the database is unavailable.
      }

      const response = NextResponse.json({ user });
      if (!hasToken) {
        const session = await issueRefferqSession(user);
        setRefferqSessionCookies(response, session);
      }
      return response;
    }

    const bridgedUser = await bridgeAngelCareUserToRefferq();
    if (bridgedUser) {
      const response = NextResponse.json({ user: bridgedUser });
      if (!hasToken) {
        const session = await issueRefferqSession(bridgedUser);
        setRefferqSessionCookies(response, session);
      }
      return response;
    }

    const cached = decodeRefferqUserCookie(request.cookies.get('refferq_user')?.value || null);
    if (cached) {
      return NextResponse.json({ user: cached });
    }

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}
