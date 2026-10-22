import { WorldBoundary } from '@/angelcare-marketplace/jobkix/client/WorldBoundary';
import type { Metadata } from "next";
import "./globals.css";
import GlobalLocalStoragePersistenceBridge from "@/components/persistence/GlobalLocalStoragePersistenceBridge";
import DesktopRuntimeBridge from "@/components/desktop/DesktopRuntimeBridge";
import { buildWebPresenceMetadata } from "@/angelcare-marketplace/web-presence/runtime";
import { headers } from 'next/headers';
import { jobkixPresentation } from '@/angelcare-marketplace/jobkix/presentation-context';
import { direction } from '@/angelcare-marketplace/jobkix/i18n';

export async function generateMetadata(): Promise<Metadata> {
  return buildWebPresenceMetadata('GLOBAL_DOMAIN')
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jobkix=jobkixPresentation(await headers());
  return (
    <html lang={jobkix?.locale||'en'} {...(jobkix?{dir:direction(jobkix.locale)}:{})}>
      <body className="min-h-full flex flex-col">
        {children}
        <WorldBoundary><GlobalLocalStoragePersistenceBridge /><DesktopRuntimeBridge /></WorldBoundary>
      </body>
    </html>
  )
}
