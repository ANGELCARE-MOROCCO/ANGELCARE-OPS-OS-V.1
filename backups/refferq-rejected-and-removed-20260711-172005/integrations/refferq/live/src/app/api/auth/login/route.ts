// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@refferq/lib/prisma';
import { issueRefferqSession, setRefferqSessionCookies } from '@refferq/lib/angelcare-auth-bridge';
import { checkRateLimit } from '@refferq/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const enforceRateLimit = process.env.NODE_ENV === 'production';
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    if (enforceRateLimit) {
      const rateLimit = await checkRateLimit(ip, 'auth/login', 5, 60 * 1000);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { success: false, message: 'Too many login attempts. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString(),
              'X-RateLimit-Limit': rateLimit.limit.toString(),
              'X-RateLimit-Remaining': '0',
            },
          }
        );
      }
    }

    const body = await request.json();
    const email = String(body?.email || '').toLowerCase().trim();
    const password = String(body?.password || '');

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        affiliate: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'Unable to log in. Please contact support if you need assistance.' },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const session = await issueRefferqSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role === 'ADMIN' ? 'ADMIN' : 'AFFILIATE',
      hasAffiliate: Boolean(user.affiliate),
      profilePicture: user.profilePicture || null,
      source: 'refferq',
    });

    const { password: _password, ...userData } = user;
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userData,
    });

    setRefferqSessionCookies(response, session);

    return response;
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });
}
