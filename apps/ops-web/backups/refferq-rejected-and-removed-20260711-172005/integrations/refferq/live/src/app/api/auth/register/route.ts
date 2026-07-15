// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@refferq/lib/auth';
import { emailService } from '@refferq/lib/email';
import { checkRateLimit } from '@refferq/lib/rate-limit';
import { getRefferqAppBasePath } from '@refferq/lib/env';

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rateLimit = await checkRateLimit(ip, 'auth/register', 3, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many registration attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString() } }
      );
    }

    const body = await request.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { success: false, message: 'Email and name are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    const userRole = 'AFFILIATE';
    const crypto = await import('crypto');
    const randomPassword = crypto.randomBytes(24).toString('base64url');

    const result = await auth.register({
      email: email.toLowerCase().trim(),
      password: randomPassword,
      name: name.trim(),
      role: userRole,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    try {
      const appBasePath = getRefferqAppBasePath();
      const appOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://app.refferq.com';
      const loginUrl = `${appOrigin}${appBasePath}/login`;
      await emailService.sendWelcomeEmail({
        name: result.user!.name,
        email: result.user!.email,
        role: result.user!.role.toLowerCase() as 'affiliate' | 'admin',
        loginUrl,
        password: randomPassword,
      });
      console.log('✅ Welcome email sent to:', result.user!.email);
    } catch (emailError) {
      console.error('⚠️ Failed to send welcome email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      user: {
        id: result.user?.id,
        email: result.user?.email,
        name: result.user?.name,
        role: result.user?.role,
        status: result.user?.status,
      },
    });
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { success: false, message: 'Registration failed' },
      { status: 500 }
    );
  }
}
