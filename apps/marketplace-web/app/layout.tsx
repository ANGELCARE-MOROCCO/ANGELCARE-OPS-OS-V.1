import type { Metadata } from "next";
import "./globals.css";
import GlobalLocalStoragePersistenceBridge from "@/components/persistence/GlobalLocalStoragePersistenceBridge";
import DesktopRuntimeBridge from "@/components/desktop/DesktopRuntimeBridge";
import { buildWebPresenceMetadata } from "@/angelcare-marketplace/web-presence/runtime";

export async function generateMetadata(): Promise<Metadata> {
  return buildWebPresenceMetadata('GLOBAL_DOMAIN')
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">
        {children}
        <GlobalLocalStoragePersistenceBridge />
        <DesktopRuntimeBridge />
      </body>
    </html>
  )
}
