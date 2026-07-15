// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@refferq/lib/otp';
import { issueRefferqSession, setRefferqSessionCookies } from '@refferq/lib/angelcare-auth-bridge';
import { checkRateLimit } from '@refferq/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rateLimit = await checkRateLimit(ip, 'auth/verify-otp', 5, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString() } }
      );
    }

    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    const result = await otpService.verifyOTP(email, code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    const user = result.user!;
    const session = await issueRefferqSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role === 'ADMIN' ? 'ADMIN' : 'AFFILIATE',
      hasAffiliate: Boolean(user.affiliate),
      profilePicture: user.profilePicture || null,
      source: 'refferq',
    });

    const response = NextResponse.json({
      success: true,
      message: result.message,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hasAffiliate: !!user.affiliate
      }
    });

    setRefferqSessionCookies(response, session);

    return response;
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
