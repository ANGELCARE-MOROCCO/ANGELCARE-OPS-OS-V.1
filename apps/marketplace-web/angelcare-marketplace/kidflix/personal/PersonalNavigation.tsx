"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, UserRound } from "lucide-react";
import { path, tr, type Locale } from "../catalogue";
import { usePersonal } from "../journey/store";
import s from "./navigation.module.css";

/** The single personal entry point used by every public KidFlix header. */
export function PersonalNavigation({ locale }: { locale: Locale }) {
  const personal = usePersonal();
  const pathname = usePathname();
  const saved = path(locale, "/saved");
  const mine = path(locale, "/my");
  const count = personal.ready ? personal.data.saved.length : 0;
  return (
    <nav
      className={s.navigation}
      data-kidflix-personal-navigation
      aria-label={tr(
        ["Your KidFlix space", "Votre espace KidFlix", "مساحتك في كيدفليكس"],
        locale,
      )}
    >
      <Link
        className={s.saved}
        href={saved}
        aria-current={pathname === saved ? "page" : undefined}
        aria-label={
          tr(
            ["Saved resources", "Ressources enregistrées", "الموارد المحفوظة"],
            locale,
          ) + (count ? ` · ${count}` : "")
        }
      >
        <span className={s.bookmark}>
          <Bookmark size={21} aria-hidden="true" />
          {count > 0 ? (
            <b className={s.count} aria-hidden="true">
              {count > 99 ? "99+" : count}
            </b>
          ) : null}
        </span>
        <span className={s.savedLabel}>
          {tr(["Saved", "Favoris", "محفوظاتي"], locale)}
        </span>
      </Link>
      <Link
        className={s.space}
        aria-label={tr(
          ["My KidFlix", "Mon KidFlix", "كيدفليكس الخاص بي"],
          locale,
        )}
        href={mine}
        aria-current={pathname === mine ? "page" : undefined}
      >
        <UserRound size={19} aria-hidden="true" />
        <span className={s.desktopLabel}>
          {tr(["My KidFlix", "Mon KidFlix", "كيدفليكس الخاص بي"], locale)}
        </span>
        <span className={s.mobileLabel} aria-hidden="true">
          {tr(["My space", "Mon espace", "مساحتي"], locale)}
        </span>
      </Link>
    </nav>
  );
}
