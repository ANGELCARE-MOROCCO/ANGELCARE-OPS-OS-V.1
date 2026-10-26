"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { tr, type Locale } from "./catalogue";
import { GuestProvider } from "./continuity";
import { usePersonal } from "./journey/store";
import { j } from "./journey/copy";
import { Navigation } from "./Navigation";
import { KidFlixFooter } from "./personal/KidFlixFooter";
import { WorldHeader } from "./world/WorldHeader";
import { WorldSettingsProvider, useWorldSettings } from "./world/Settings";
import { routeFamily } from "./world/model";
import base from "./kidflix.module.css";
import world from "./world/shell.module.css";
import journey from "./journey/journey.module.css";
function Content({
  locale,
  children,
  categoryFamily,
}: {
  locale: Locale;
  children: ReactNode;
  categoryFamily?: string;
}) {
  const personal = usePersonal(),
    settings = useWorldSettings(),
    pathname = usePathname();
  return (
    <div
      className={`${base.root} ${world.root}`}
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-kidflix-shell
      data-kidflix-world-shell="r1"
    >
      <a className={base.skip} href="#kidflix-content">
        {tr(
          ["Skip to content", "Aller au contenu", "انتقل إلى المحتوى"],
          locale,
        )}
      </a>
      <WorldHeader locale={locale} />
      <main id="kidflix-content">
        {personal.error ? (
          <p className={journey.notice} role="status">
            {j("storage", locale)}
          </p>
        ) : null}
        {children}
      </main>
      <KidFlixFooter
        locale={locale}
        family={routeFamily(pathname) || categoryFamily}
        socialLinks={settings.socialLinks}
      />
      <Navigation locale={locale} />
    </div>
  );
}
export function KidFlixShell({
  locale,
  children,
  categoryFamily,
}: {
  locale: Locale;
  children: ReactNode;
  variant?: "documents" | "home";
  categoryFamily?: string;
}) {
  return (
    <GuestProvider>
      <WorldSettingsProvider locale={locale}>
        <Content locale={locale} categoryFamily={categoryFamily}>
          {children}
        </Content>
      </WorldSettingsProvider>
    </GuestProvider>
  );
}
