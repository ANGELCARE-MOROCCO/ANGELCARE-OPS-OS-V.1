"use client";
import { usePartner, countText } from "./partner/Locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import s from "./journey.module.css";
export function Pagination({
  page,
  pages,
  count,
  onPage,
  target,
}: {
  page: number;
  pages: number;
  count: number;
  onPage: (page: number) => void;
  target?: string;
}) {
  const { t: tr, locale } = usePartner();

  const numbers = [
    ...new Set([
      1,
      ...Array.from({ length: 5 }, (_, index) => page - 2 + index).filter(
        (value) => value > 1 && value < pages,
      ),
      pages,
    ]),
  ].filter((value) => value > 0 && value <= pages);
  function change(next: number) {
    onPage(next);
    if (target)
      requestAnimationFrame(() =>
        document
          .getElementById(target)
          ?.scrollIntoView({ block: "start", behavior: "instant" }),
      );
  }
  return (
    <div className={s.pagination}>
      <span role="status">
        {countText(locale, count, "result")}
        {tr(" · page ")}
        {tr(page)}
        {tr("/")}
        {tr(pages)}
      </span>
      <nav aria-label={tr("Pagination des résultats")}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => change(page - 1)}
          aria-label={tr("Page précédente")}
        >
          <ChevronLeft size={16} />
        </button>
        {numbers.map((number, index) => (
          <span key={number}>
            {index > 0 && number - numbers[index - 1] > 1 && (
              <i aria-hidden="true">{tr("…")}</i>
            )}
            <button
              type="button"
              aria-label={tr(`Page ${number}`)}
              aria-current={page === number ? "page" : undefined}
              onClick={() => change(number)}
            >
              {tr(number)}
            </button>
          </span>
        ))}
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => change(page + 1)}
          aria-label={tr("Page suivante")}
        >
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}
