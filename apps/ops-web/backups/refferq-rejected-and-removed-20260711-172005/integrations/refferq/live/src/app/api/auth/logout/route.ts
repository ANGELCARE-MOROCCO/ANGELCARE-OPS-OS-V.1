// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { REFFERQ_COOKIE_NAMES } from '@refferq/lib/env';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    for (const cookieName of Object.values(REFFERQ_COOKIE_NAMES)) {
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0),
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
