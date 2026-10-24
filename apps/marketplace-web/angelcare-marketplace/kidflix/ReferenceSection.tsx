import Link from "next/link";
import type { ReactNode } from "react";
import { tr, type Tri, type Locale } from "./catalogue";
import { I } from "./Icons";
import s from "./reference.module.css";
export function ReferenceSection({
  title,
  sub,
  icon,
  href,
  locale,
  children,
  className = "",
  id,
}: {
  title: Tri;
  sub?: Tri;
  icon: string;
  href?: string;
  locale: Locale;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={`${s.section} ${className}`} id={id}>
      <div className={s.sectionHeading}>
        <div>
          <h2>
            <span>
              <I name={icon} size={23} />
            </span>
            {tr(title, locale)}
          </h2>
          {sub ? <p>{tr(sub, locale)}</p> : null}
        </div>
        {href ? (
          <Link href={href}>
            {tr(["View all", "Tout voir", "عرض الكل"], locale)}
            <I name="ArrowRight" size={14} />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
