"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { tr, type Locale } from "./catalogue";
import s from "./navigation-toast.module.css";

export function NavigationToast({
  locale,
  state,
  onRetry,
  onDismiss,
}: {
  locale: Locale;
  state: "pending" | "slow" | "error";
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const message = tr(
    state === "error"
      ? ["This discovery could not open.", "Cette découverte n’a pas pu s’ouvrir.", "تعذر فتح هذا الاكتشاف."]
      : state === "slow"
        ? ["Still opening your discovery…", "Votre découverte s’ouvre encore…", "ما زلنا نفتح اكتشافك…"]
        : ["Opening your discovery…", "Ouverture de votre découverte…", "جارٍ فتح اكتشافك…"],
    locale,
  );

  return createPortal(
    <div className={s.anchor} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className={s.toast} data-kidflix-navigation-toast="r1" data-navigation-state={state}>
        <span className={s.orbit} aria-hidden="true" />
        <img className={s.logo} src="/kidflix/kidflix-official-optimized.webp" alt="" width={103} height={34} />
        <span className={s.message} role={state === "error" ? "alert" : "status"} aria-atomic="true">
          <span className={s.srOnly}>KidFlix. </span>{message}
        </span>
        {state !== "pending" ? (
          <button type="button" className={s.retry} onClick={onRetry}>
            {tr(["Retry", "Réessayer", "حاول مجدداً"], locale)}
          </button>
        ) : null}
        <button type="button" className={s.dismiss} onClick={onDismiss} aria-label={tr(["Dismiss navigation feedback", "Fermer le message", "إغلاق حالة التنقل"], locale)}>
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>,
    document.body,
  );
}
