import { getRefferqEnv } from '@refferq/lib/env';
import LoginClient from './login-client';

export default function LoginPage() {
  const { resendApiKey } = getRefferqEnv();

  return (
    <LoginClient
      otpConfigured={Boolean(resendApiKey)}
      showDevCredentials={process.env.NODE_ENV !== 'production'}
    />
  );
}
