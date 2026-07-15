'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@refferq/components/ui/button';
import { Input } from '@refferq/components/ui/input';
import { Label } from '@refferq/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@refferq/components/ui/card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@refferq/components/ui/input-otp';
import { Alert, AlertDescription } from '@refferq/components/ui/alert';
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck, Target } from 'lucide-react';

type LoginMode = 'password' | 'otp';
type OtpStep = 'email' | 'code';

type LoginClientProps = {
  otpConfigured: boolean;
  showDevCredentials: boolean;
};

function getRedirectPath(role: string | undefined) {
  const normalizedRole = String(role || '').toUpperCase();

  if (normalizedRole === 'ADMIN') {
    return '/market-os/ambassadors/refferq/admin';
  }

  if (normalizedRole === 'AFFILIATE' || normalizedRole === 'PARTNER') {
    return '/market-os/ambassadors/refferq/affiliate';
  }

  return '/market-os/ambassadors/refferq';
}

async function readResponseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export default function LoginClient({ otpConfigured, showDevCredentials }: LoginClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>('password');
  const [otpStep, setOtpStep] = useState<OtpStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  const loginApiPath = '/api/market-os/refferq/auth/login';
  const otpSendApiPath = '/api/market-os/refferq/auth/send-otp';
  const otpVerifyApiPath = '/api/market-os/refferq/auth/verify-otp';

  const switchMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    setPasswordError('');
    setOtpError('');
    setOtpMessage('');

    if (nextMode === 'password') {
      setPasswordLoading(false);
      return;
    }

    setOtpStep('email');
    setOtp('');
    setOtpLoading(false);
  };

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordLoading(true);

    try {
      const response = await fetch(loginApiPath, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await readResponseJson(response);

      if (response.ok && data?.success !== false && data?.user) {
        router.push(getRedirectPath(data.user.role));
        return;
      }

      setPasswordError(
        data?.message ||
          data?.error ||
          'Sign in failed. Check your email and password and try again.'
      );
    } catch (_error) {
      setPasswordError('Password sign in failed. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setOtpError('');
    setOtpMessage('');

    if (!otpConfigured) {
      setOtpError('Email code login is not configured yet. Use password login or configure RESEND_API_KEY.');
      return;
    }

    setOtpLoading(true);

    try {
      const response = await fetch(otpSendApiPath, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await readResponseJson(response);

      if (response.ok && data?.success) {
        setOtpStep('code');
        setOtp('');
        setOtpMessage(data.message || 'A verification code has been sent to your email.');
        return;
      }

      setOtpError(
        data?.message ||
          data?.error ||
          'Failed to send verification code. Please try again.'
      );
    } catch (_error) {
      setOtpError('Failed to send verification code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setOtpError('');

    if (!otpConfigured) {
      setOtpError('Email code login is not configured yet. Use password login or configure RESEND_API_KEY.');
      return;
    }

    if (otp.length < 6) {
      setOtpError('Please enter the full 6-digit code');
      return;
    }

    setOtpLoading(true);

    try {
      const response = await fetch(otpVerifyApiPath, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await readResponseJson(response);

      if (response.ok && data?.success && data?.user) {
        router.push(getRedirectPath(data.user.role));
        return;
      }

      setOtpError(data?.message || data?.error || 'Invalid verification code');
    } catch (_error) {
      setOtpError('Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError('');
    setOtpMessage('');

    if (!otpConfigured) {
      setOtpError('Email code login is not configured yet. Use password login or configure RESEND_API_KEY.');
      return;
    }

    setOtpLoading(true);

    try {
      const response = await fetch(otpSendApiPath, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await readResponseJson(response);

      if (response.ok && data?.success) {
        setOtpMessage(data.message || 'A new verification code has been sent.');
        return;
      }

      setOtpError(data?.message || data?.error || 'Failed to resend code. Please try again.');
    } catch (_error) {
      setOtpError('Failed to resend code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Target className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Refferq</h1>
          <p className="text-sm text-muted-foreground">
            Affiliate Marketing Platform
          </p>
        </div>

        <Card className="border-0 shadow-xl shadow-black/5">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 grid w-full max-w-sm grid-cols-2 rounded-full bg-muted p-1">
              <button
                type="button"
                onClick={() => switchMode('password')}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  mode === 'password'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Password login
              </button>
              <button
                type="button"
                onClick={() => switchMode('otp')}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  mode === 'otp'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Email code / OTP login
              </button>
            </div>

            {mode === 'password' ? (
              <>
                <CardTitle className="text-xl">Welcome back</CardTitle>
                <CardDescription>
                  Sign in with your email and password
                </CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Email code login</CardTitle>
                <CardDescription>
                  Use a 6-digit code sent to your email
                </CardDescription>
              </>
            )}
          </CardHeader>

          {mode === 'password' ? (
            <form onSubmit={handlePasswordLogin}>
              <CardContent className="space-y-4">
                {passwordError && (
                  <Alert variant="destructive">
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password-email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="pl-10"
                      required
                      autoFocus
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-input">Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password-input"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pl-10"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {showDevCredentials && (
                  <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 p-3 text-xs text-muted-foreground">
                    <div className="font-medium text-foreground">Demo credentials</div>
                    <div>Admin: admin@example.com / password</div>
                    <div>Affiliate: sarah.johnson@example.com / password</div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={passwordLoading || !email || !password}
                >
                  {passwordLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="mr-2 h-4 w-4" />
                  )}
                  {passwordLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={otpStep === 'email' ? handleSendOtp : handleVerifyOtp}>
              <CardContent className="space-y-4">
                {!otpConfigured && (
                  <Alert>
                    <AlertDescription>
                      Email code login is not configured yet. Use password login or configure RESEND_API_KEY.
                    </AlertDescription>
                  </Alert>
                )}

                {otpError && (
                  <Alert variant="destructive">
                    <AlertDescription>{otpError}</AlertDescription>
                  </Alert>
                )}

                {otpMessage && (
                  <Alert>
                    <AlertDescription>{otpMessage}</AlertDescription>
                  </Alert>
                )}

                {otpStep === 'email' ? (
                  <div className="space-y-2">
                    <Label htmlFor="otp-email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="otp-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="pl-10"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      We sent a 6-digit code to{' '}
                      <span className="font-medium text-foreground">{email}</span>
                    </p>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex-col gap-3">
                {otpStep === 'email' ? (
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={otpLoading || !email || !otpConfigured}
                  >
                    {otpLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    {otpLoading ? 'Sending code...' : 'Continue with Email'}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={otpLoading || otp.length < 6 || !otpConfigured}
                  >
                    {otpLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-2 h-4 w-4" />
                    )}
                    {otpLoading ? 'Verifying...' : 'Verify & Sign in'}
                  </Button>
                )}

                <div className="flex w-full items-center justify-between gap-3">
                  {otpStep === 'email' ? (
                    <div />
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setOtpStep('email');
                        setOtp('');
                        setOtpError('');
                        setOtpMessage('');
                      }}
                    >
                      <ArrowLeft className="mr-1 h-3 w-3" />
                      Change email
                    </Button>
                  )}

                  {otpStep === 'code' ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResendOtp}
                      disabled={otpLoading || !otpConfigured}
                    >
                      Resend code
                    </Button>
                  ) : (
                    <div />
                  )}
                </div>
              </CardFooter>
            </form>
          )}
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/market-os/ambassadors/refferq/register"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
