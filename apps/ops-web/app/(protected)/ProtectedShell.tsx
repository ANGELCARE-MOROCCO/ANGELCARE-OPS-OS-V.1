'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import UserActivityTracker from '@/components/users/UserActivityTracker';
import VoicePhoneWidgetGate from '@/app/components/VoicePhoneWidgetGate';
import AngelCareConnect from '@/app/components/connect/AngelCareConnect';
import OverheadPanel from '@/app/components/erp/OverheadPanel';
import OpsosTelemetryProvider from '@/components/opsos-control-plane/OpsosTelemetryProvider';

const REFFERQ_BASE_PATH = '/market-os/ambassadors/refferq';

function isRefferqRoute(pathname: string | null) {
  return Boolean(
    pathname &&
      (pathname === REFFERQ_BASE_PATH || pathname.startsWith(`${REFFERQ_BASE_PATH}/`))
  );
}

export default function ProtectedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const embeddedRefferq = isRefferqRoute(pathname);

  return (
    <>
      <UserActivityTracker />

      {!embeddedRefferq && <OverheadPanel />}

      <div
        className={embeddedRefferq ? 'min-h-screen w-full overflow-x-hidden' : 'min-h-screen w-full'}
        style={embeddedRefferq ? undefined : { paddingTop: 86 }}
      >
        <OpsosTelemetryProvider>{children}</OpsosTelemetryProvider>
      </div>

      {!embeddedRefferq && <VoicePhoneWidgetGate />}
      {!embeddedRefferq && <AngelCareConnect />}
    </>
  );
}
