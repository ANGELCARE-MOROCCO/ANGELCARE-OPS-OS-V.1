"use client";
import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink';
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Heart,
  GitCompareArrows,
  ImageOff,
  Plus,
  Check,
} from "lucide-react";
import type {
  HomepageItem,
  HomepageLocale,
} from "../../homepage-flagship/types";
import {
  journeyForItem,
  journeyLabel,
  journeyPath,
} from "../../conversion-universe/content";
import { canPurchase, detailHref, offerMediaUrl } from "./contract";
import { C, translate, type Words } from "./content";
import type { CommerceState } from "./useCommerce";
import styles from "./immersive.module.css";

export const editorial = (key: string) =>
  `/angelcare-marketplace/families-world-r2/${key}.jpg`;
export function Photo({
  src,
  alt = "",
  priority = false,
  contain = false,
}: {
  src: string | null;
  alt?: string;
  priority?: boolean;
  contain?: boolean;
}) {
  const displaySrc = contain ? offerMediaUrl(src) : src;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <div
      className={contain ? styles.containedPhoto : styles.editorialPhoto}
      data-media-fit={contain ? "contain" : "cover"}
      data-media-state={src && !failed ? "ready" : "missing"}
    >
      {displaySrc && !failed ? (
        <img
          src={displaySrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={styles.noPhoto}>
          <ImageOff aria-hidden="true" />
          <span>{alt}</span>
        </span>
      )}
    </div>
  );
}
export function Action({
  href,
  children,
  soft = false,
  onClick,
}: {
  href: string;
  children: ReactNode;
  soft?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      className={soft ? styles.softAction : styles.action}
      href={href}
      onClick={onClick}
    >
      {children}
      <ArrowUpRight size={19} aria-hidden="true" />
    </Link>
  );
}
export function Head({
  number,
  title,
  lead,
  locale,
  children,
}: {
  number: string;
  title: Words;
  lead?: Words;
  locale: HomepageLocale;
  children?: ReactNode;
}) {
  return (
    <header className={styles.sectionHead}>
      <div>
        <span className={styles.sectionIndex}>
          {number}
          <span />
        </span>
        <h2>{translate(title, locale)}</h2>
        {lead ? <p>{translate(lead, locale)}</p> : null}
      </div>
      {children ? <div className={styles.headActions}>{children}</div> : null}
    </header>
  );
}
export function Empty({
  locale,
  href,
  message = C.empty,
}: {
  locale: HomepageLocale;
  href: string;
  message?: Words;
}) {
  return (
    <div className={styles.empty}>
      <Plus size={24} aria-hidden="true" />
      <p>{translate(message, locale)}</p>
      <Action href={href} soft>
        {translate(C.all, locale)}
      </Action>
    </div>
  );
}
export function price(item: HomepageItem, locale: HomepageLocale) {
  const t = (value: Words) => translate(value, locale);
  if (item.price_mode === "quote_only") return t(C.quote);
  if (item.price_amount === null || !Number.isFinite(item.price_amount))
    return t(C.noPrice);
  const amount = new Intl.NumberFormat(
    locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-MA",
    { maximumFractionDigits: 2 },
  ).format(item.price_amount);
  return `${item.price_mode === "starting_from" ? t(C.from) + " " : ""}${amount} ${item.currency_label}`;
}
export function availability(item: HomepageItem, locale: HomepageLocale) {
  return translate(
    item.availability_status === "available"
      ? C.available
      : item.availability_status === "limited"
        ? C.limited
        : [
              "unavailable",
              "out_of_stock",
              "sold_out",
              "closed",
              "paused",
            ].includes(item.availability_status)
          ? C.unavailable
          : C.conditions,
    locale,
  );
}
export function OfferCard({
  item,
  locale,
  commerce,
  large = false,
}: {
  item: HomepageItem;
  locale: HomepageLocale;
  commerce: CommerceState;
  large?: boolean;
}) {
  const t = (value: Words) => translate(value, locale),
    saved = commerce.saved.includes(item.id),
    compared = commerce.compared.includes(item.id);
  const pending = commerce.pending.includes(`saved:${item.id}`),
    detail = detailHref(locale, item);
  return (
    <article
      className={`${styles.offerCard} ${large ? styles.largeCard : ""}`}
      data-home-offer={item.id}
      data-kind={item.kind}
      data-home-card="full-artwork-commerce"
    >
      <div className={styles.cardTop}>
        <span>{t(C[item.kind])}</span>
        <button
          type="button"
          aria-label={`${t(saved ? C.unsave : C.save)} · ${item.name}`}
          aria-pressed={saved}
          disabled={pending}
          onClick={() => void commerce.select(item.id, "saved")}
        >
          <Heart
            size={19}
            fill={saved ? "currentColor" : "none"}
            aria-hidden="true"
          />
        </button>
      </div>
      <Link
        className={styles.offerImage}
        href={detail}
        onClick={() => commerce.remember(item.id)}
        aria-label={item.name}
      >
        <Photo src={item.media_url} alt={item.name} contain />
      </Link>
      <div className={styles.cardBody}>
        <span className={styles.categoryLine}>
          {item.category_title || t(C[item.kind])}
        </span>
        <h3>
          <Link href={detail} onClick={() => commerce.remember(item.id)}>
            {item.name}
          </Link>
        </h3>
        {item.short_description ? <p>{item.short_description}</p> : null}
        <span
          className={styles.availability}
          data-available={canPurchase(item)}
        >
          {availability(item, locale)}
        </span>
        <div className={styles.priceLine}>
          <strong>{price(item, locale)}</strong>
          <button
            type="button"
            aria-label={`${t(compared ? C.uncompare : C.compare)} · ${item.name}`}
            aria-pressed={compared}
            disabled={commerce.pending.some((key) =>
              key.startsWith("compare:"),
            )}
            onClick={() => void commerce.select(item.id, "compare")}
          >
            <GitCompareArrows size={17} aria-hidden="true" />
          </button>
        </div>
        <Link
          className={styles.cardAction}
          href={canPurchase(item) ? journeyPath(locale, item) : detail}
          onClick={() => commerce.remember(item.id)}
        >
          {canPurchase(item)
            ? journeyLabel(journeyForItem(item), locale)
            : t(C.view)}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
export function Rail({
  id,
  locale,
  children,
  label,
}: {
  id: string;
  locale: HomepageLocale;
  children: ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null),
    drag = useRef<{ x: number; scroll: number; moved: boolean } | null>(null);
  const [position, setPosition] = useState({
    start: true,
    end: false,
    progress: 0,
  });
  const rtl = locale === "ar",
    t = (value: Words) => translate(value, locale);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => {
      const max = node.scrollWidth - node.clientWidth,
        value = Math.abs(node.scrollLeft);
      setPosition({
        start: value < 2,
        end: max < 2 || value >= max - 2,
        progress: max > 0 ? Math.min(1, value / max) : 1,
      });
    };
    update();
    node.addEventListener("scroll", update, { passive: true });
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(node);
    return () => {
      node.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [children]);
  const move = (step: number) => {
    const node = ref.current;
    if (node)
      node.scrollBy({
        left: step * (rtl ? -1 : 1) * node.clientWidth * 0.82,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  };
  return (
    <div className={styles.railWrap}>
      <div
        className={styles.rail}
        id={id}
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        onDragStart={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            move(event.key === "ArrowRight" ? (rtl ? -1 : 1) : rtl ? 1 : -1);
          }
        }}
        onPointerDown={(event) => {
          if (
            event.pointerType !== "mouse" ||
            event.button !== 0 ||
            (event.target as HTMLElement).closest("button")
          )
            return;
          drag.current = {
            x: event.clientX,
            scroll: event.currentTarget.scrollLeft,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const state = drag.current;
          if (!state) return;
          const delta = event.clientX - state.x;
          if (Math.abs(delta) > 6) {
            state.moved = true;
            event.currentTarget.scrollLeft = state.scroll - delta;
            event.preventDefault();
          }
        }}
        onPointerUp={() => {
          if (!drag.current?.moved) drag.current = null;
        }}
        onPointerLeave={() => {
          drag.current = null;
        }}
        onClickCapture={(event) => {
          if (drag.current?.moved) {
            event.preventDefault();
            event.stopPropagation();
            drag.current = null;
          }
        }}
      >
        {children}
      </div>
      <div className={styles.railControls}>
        <span className={styles.railTrack} aria-hidden="true">
          <span style={{ width: `${Math.max(8, position.progress * 100)}%` }} />
        </span>
        <button
          type="button"
          aria-label={`${t(C.previous)} · ${label}`}
          aria-controls={id}
          disabled={position.start}
          onClick={() => move(-1)}
        >
          {rtl ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
        </button>
        <button
          type="button"
          aria-label={`${t(C.next)} · ${label}`}
          aria-controls={id}
          disabled={position.end}
          onClick={() => move(1)}
        >
          {rtl ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
        </button>
      </div>
    </div>
  );
}
export function OfferRail({
  id,
  items,
  locale,
  commerce,
  href,
  label,
  limit = 14,
}: {
  id: string;
  items: readonly HomepageItem[];
  locale: HomepageLocale;
  commerce: CommerceState;
  href: string;
  label: string;
  limit?: number;
}) {
  return items.length ? (
    <Rail id={id} locale={locale} label={label}>
      {items.slice(0, limit).map((item) => (
        <OfferCard
          key={item.id}
          item={item}
          locale={locale}
          commerce={commerce}
        />
      ))}
    </Rail>
  ) : (
    <Empty locale={locale} href={href} />
  );
}
export function Chips<K extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: ReadonlyArray<{ key: K; label: string }>;
  value: K;
  onChange: (value: K) => void;
  label: string;
}) {
  return (
    <div className={styles.chips} role="group" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          aria-pressed={value === item.key}
          onClick={() => onChange(item.key)}
        >
          {value === item.key ? <Check size={15} aria-hidden="true" /> : null}
          {item.label}
        </button>
      ))}
    </div>
  );
}
