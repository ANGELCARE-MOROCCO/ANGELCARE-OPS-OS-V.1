"use client";
import { useEffect, useMemo, useState } from "react";
import { asset, clampIndex, rows, str } from "./model";
import {
  Button,
  Empty,
  Modal,
  Pager,
  Progress,
  Source,
  type PlayerProps,
} from "./shared";
import { local, t } from "./copy";
import s from "./detail.module.css";
import { j } from "../journey/copy";
export function VisualCards({
  m,
  d,
  locale,
  engine,
  state,
  update,
}: PlayerProps) {
  const allCards = rows(d.cards),
    selected: string[] | null = Array.isArray(state.studyIds)
      ? state.studyIds
      : null,
    original = allCards.filter(
      (c) =>
        (selected === null || selected.includes(c.id)) &&
        (!state.reviewOnly ||
          !Array.isArray(state.known) ||
          !state.known.includes(c.id)),
    ),
    index = clampIndex(state.index, original.length),
    [flipped, setFlipped] = useState(false),
    [zoom, setZoom] = useState(1),
    [focus, setFocus] = useState(false),
    known = Array.isArray(state.known)
      ? state.known.filter((id: string) => allCards.some((c) => c.id === id))
      : [],
    order = Array.isArray(state.cardOrder) ? state.cardOrder : [],
    cards = useMemo(
      () =>
        order.length === original.length &&
        new Set(order).size === original.length &&
        order.every((id: string) => original.some((c) => c.id === id))
          ? order.map((id: string) => original.find((c) => c.id === id)!)
          : original,
      [JSON.stringify(original), JSON.stringify(order)],
    ),
    card = cards[index];
  useEffect(() => {
    if (d.shuffle === true && !order.length && original.length) {
      const ids = original.map((c) => c.id);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      update({ cardOrder: ids });
    }
  }, [d.shuffle, original.length, order.length]);
  useEffect(() => {
    setFlipped(false);
    setZoom(1);
  }, [index]);
  function select(i: number) {
    setFlipped(false);
    update({ index: i });
  }
  if (!card)
    return (
      <>
        <Button
          onClick={() =>
            update({
              studyIds: null,
              reviewOnly: false,
              index: 0,
              cardOrder: [],
            })
          }
        >
          {j("all", locale)}
        </Button>
        <Empty locale={locale} />
      </>
    );
  const canTurn =
      engine === "study" &&
      (asset(m, card.backAssetId, "image/") || str(card.back)),
    content = (
      <div
        className={s.studyCard}
        style={{ "--card-zoom": zoom } as React.CSSProperties}
      >
        <div>
          <Source
            m={m}
            id={flipped && card.backAssetId ? card.backAssetId : card.assetId}
            alt={local(card, "alt", locale) || local(card, "title", locale)}
          />
          <h2>{local(card, "title", locale)}</h2>
          <p>{local(card, flipped ? "back" : "front", locale)}</p>
        </div>
      </div>
    );
  return (
    <div className={s.cardAtelier}>
      {d.kidflixPractice !== false ? (
        <details className={s.disclosure}>
          <summary>{j("subset", locale)}</summary>
          <div className={s.controls}>
            <Button
              aria-pressed={!state.reviewOnly}
              onClick={() =>
                update({ reviewOnly: false, index: 0, cardOrder: [] })
              }
            >
              {j("all", locale)}
            </Button>
            <Button
              aria-pressed={state.reviewOnly === true}
              onClick={() =>
                update({ reviewOnly: true, index: 0, cardOrder: [] })
              }
            >
              {j("review", locale)}
            </Button>
            <Button
              onClick={() => {
                const ids = original.map((c) => c.id);
                for (let i = ids.length - 1; i > 0; i--) {
                  const n = Math.floor(Math.random() * (i + 1));
                  [ids[i], ids[n]] = [ids[n], ids[i]];
                }
                update({ cardOrder: ids, index: 0 });
              }}
            >
              {j("shuffle", locale)}
            </Button>
          </div>
          <div className={s.controls}>
            {allCards.map((c) => (
              <label key={c.id}>
                <input
                  type="checkbox"
                  checked={selected === null || selected.includes(c.id)}
                  onChange={(e) => {
                    let ids =
                      selected !== null
                        ? [...selected]
                        : allCards.map((x) => x.id);
                    ids = e.target.checked
                      ? [...new Set([...ids, c.id])]
                      : ids.filter((id) => id !== c.id);
                    update({
                      studyIds: ids.length ? ids : [],
                      index: 0,
                      cardOrder: [],
                    });
                  }}
                />
                {local(c, "title", locale)}
              </label>
            ))}
          </div>
        </details>
      ) : null}
      {engine === "gallery" || engine === "lightbox" ? (
        <div
          className={s.visualGrid}
          style={{ "--columns": d.columns || 3 } as React.CSSProperties}
        >
          {cards.map((c, i) => (
            <button
              key={c.id}
              onClick={() => {
                select(i);
                setFocus(true);
              }}
            >
              <Source
                m={m}
                id={c.assetId}
                alt={local(c, "alt", locale) || local(c, "title", locale)}
              />
              <strong>{local(c, "title", locale)}</strong>
              <span>{local(c, "front", locale)}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <Pager
            index={index}
            count={cards.length}
            locale={locale}
            onChange={select}
          />
          {content}
          <div className={s.controls}>
            {canTurn ? (
              <Button
                primary
                icon="RotateCcw"
                aria-pressed={flipped}
                onClick={() => setFlipped((v) => !v)}
              >
                {t("turn", locale)}
              </Button>
            ) : null}
            {engine === "study" ? (
              <Button
                icon="Check"
                onClick={() => {
                  const next = known.includes(card.id)
                    ? known.filter((id: string) => id !== card.id)
                    : [...known, card.id];
                  update({
                    known: next,
                    complete: next.length === allCards.length,
                  });
                }}
              >
                {t(known.includes(card.id) ? "unlearn" : "learned", locale)}
              </Button>
            ) : null}
            {d.allowZoom !== false ? (
              <>
                <Button
                  disabled={zoom <= 1}
                  onClick={() => setZoom((v) => Math.max(1, v - 0.25))}
                  aria-label={t("zoomOut", locale)}
                >
                  −
                </Button>
                <Button
                  disabled={zoom >= 2}
                  onClick={() => setZoom((v) => Math.min(2, v + 0.25))}
                  aria-label={t("zoomIn", locale)}
                >
                  +
                </Button>
                <Button onClick={() => setFocus(true)}>
                  {t("focus", locale)}
                </Button>
              </>
            ) : null}
          </div>
          {engine === "study" ? (
            <Progress
              value={
                (known.filter((id: string) => cards.some((c) => c.id === id))
                  .length /
                  cards.length) *
                100
              }
              label={
                known.filter((id: string) => cards.some((c) => c.id === id))
                  .length +
                " / " +
                cards.length +
                " " +
                t("marked", locale)
              }
            />
          ) : null}
        </>
      )}
      {focus ? (
        <Modal
          title={local(card, "title", locale)}
          locale={locale}
          onClose={() => setFocus(false)}
        >
          {content}
          {canTurn ? (
            <Button onClick={() => setFlipped((v) => !v)}>
              {t("turn", locale)}
            </Button>
          ) : null}
          <Pager
            index={index}
            count={cards.length}
            locale={locale}
            onChange={select}
          />
        </Modal>
      ) : null}
    </div>
  );
}
