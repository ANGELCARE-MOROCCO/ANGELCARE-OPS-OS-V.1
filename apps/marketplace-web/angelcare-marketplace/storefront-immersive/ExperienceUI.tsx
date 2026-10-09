"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Heart,
  GitCompareArrows,
  ImageOff,
  Sparkles,
} from "lucide-react";
import type { CatalogLocale, DiscoveryItem } from "../catalog-discovery/types";
import { journeyForItem, journeyLabel } from "../conversion-universe/content";
import { C, tr } from "./content";
import {
  availabilityLabel,
  itemHref,
  offerMedia,
  priceLabel,
  unavailable,
} from "./contract";
import type { Selections } from "./useSelections";
import s from "./storefront.module.css";

export function Photo({
  src,
  alt = "",
  contain = false,
  priority = false,
}: {
  src: string | null;
  alt?: string;
  contain?: boolean;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const safe = offerMedia(src);
  return (
    <div
      className={contain ? s.offerPhoto : s.editorialPhoto}
      data-media-fit={contain ? "contain" : "cover"}
    >
      {safe && !failed ? (
        <img
          src={safe}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={s.mediaEmpty}>
          <ImageOff aria-hidden="true" />
          <span>{alt}</span>
        </div>
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
      className={soft ? s.softAction : s.action}
      href={href}
      onClick={onClick}
    >
      {children}
      <ArrowUpRight size={18} aria-hidden="true" />
    </Link>
  );
}
export function Head({
  number,
  title,
  lead,
  children,
}: {
  number: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <header className={s.sectionHead}>
      <div>
        <span className={s.index}>
          {number}
          <i />
        </span>
        <h2>{title}</h2>
        {lead ? <p>{lead}</p> : null}
      </div>
      {children ? <div className={s.headActions}>{children}</div> : null}
    </header>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className={s.empty}>
      <Sparkles aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
export function OfferCard({
  item,
  locale,
  selections,
  large = false,
}: {
  item: DiscoveryItem;
  locale: CatalogLocale;
  selections: Selections;
  large?: boolean;
}) {
  const href = itemHref(item, locale),
    saved = selections.saved.includes(item.id),
    compared = selections.compared.includes(item.id);
  return (
    <article
      className={s.offer}
      data-offer-id={item.id}
      data-kind={item.kind}
      data-large={large}
      data-unavailable={unavailable(item)}
    >
      <div className={s.offerTop}>
        <span className={s.kind}>{tr(C[item.kind], locale)}</span>
        {item.featured ? (
          <span className={s.featured}>
            <Sparkles size={11} />
            {tr(C.featured, locale)}
          </span>
        ) : null}
      </div>
      <Link
        className={s.offerImageLink}
        href={href}
        onClick={() => selections.remember(item.id)}
        aria-label={item.name}
      >
        <Photo
          src={item.media_url}
          alt={item.media_url ? item.name : tr(C.noMedia, locale)}
          contain
        />
      </Link>
      <div className={s.offerBody}>
        <div className={s.offerTags}>
          <span data-status={item.availability_status}>
            {availabilityLabel(item, locale)}
          </span>
          {item.category_title ? <span>{item.category_title}</span> : null}
        </div>
        <h3>
          <Link href={href} onClick={() => selections.remember(item.id)}>
            {item.name}
          </Link>
        </h3>
        <p>{item.short_description}</p>
        {item.trust_labels.length ? (
          <div className={s.trustTags}>
            {item.trust_labels.slice(0, 2).map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        ) : null}
        <strong className={s.price}>{priceLabel(item, locale)}</strong>
        <div className={s.offerButtons}>
          <button
            type="button"
            aria-label={`${tr(saved ? C.saved : C.save, locale)}: ${item.name}`}
            aria-pressed={saved}
            disabled={selections.pending.includes(`saved:${item.id}`)}
            onClick={() => void selections.select(item.id, "saved")}
          >
            <Heart size={16} fill={saved ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            aria-label={`${tr(C.compare, locale)}: ${item.name}`}
            aria-pressed={compared}
            disabled={selections.pending.includes(`compare:${item.id}`)}
            onClick={() => void selections.select(item.id, "compare")}
          >
            <GitCompareArrows size={16} />
          </button>
          <Link href={href} onClick={() => selections.remember(item.id)}>
            {unavailable(item)
              ? tr(C.discover, locale)
              : journeyLabel(journeyForItem(item), locale)}
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function Rail({
  id,
  locale,
  children,
}: {
  id: string;
  locale: CatalogLocale;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    ref.current?.scrollBy({
      left:
        direction *
        (locale === "ar" ? -1 : 1) *
        (ref.current.clientWidth * 0.8),
      behavior: reduced ? "instant" : "smooth",
    });
  };
  return (
    <div className={s.railWrap}>
      <div className={s.railTools}>
        <button
          type="button"
          aria-label={tr(C.previous, locale)}
          aria-controls={id}
          onClick={() => scroll(-1)}
        >
          <ArrowLeft size={18} />
        </button>
        <button
          type="button"
          aria-label={tr(C.next, locale)}
          aria-controls={id}
          onClick={() => scroll(1)}
        >
          <ArrowRight size={18} />
        </button>
      </div>
      <div className={s.rail} id={id} ref={ref}>
        {children}
      </div>
    </div>
  );
}
