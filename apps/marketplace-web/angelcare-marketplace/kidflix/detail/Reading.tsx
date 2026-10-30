"use client";
import { useEffect, useState } from "react";
import { asset, clampIndex, obj, rows, str, num, storyProfile } from "./model";
import {
  Button,
  Editorial,
  Empty,
  Modal,
  Pager,
  Source,
  type PlayerProps,
} from "./shared";
import { MediaPlayer } from "./Media";
import { local, t } from "./copy";
import s from "./detail.module.css";
export function Reading(props: PlayerProps) {
  const { m, d, locale, engine, state, update } = props,
    [search, setSearch] = useState(""),
    [zoom, setZoom] = useState(1),
    [focus, setFocus] = useState(false),
    [playing, setPlaying] = useState(false),
    story = m.family === "stories",
    printable = m.family === "printables",
    all = rows(d.units),
    units = all.filter(
      (u) =>
        !search ||
        [local(u, "title", locale), local(u, "text", locale)]
          .join(" ")
          .toLocaleLowerCase(locale)
          .includes(search.toLocaleLowerCase(locale)),
    ),
    index =
      state.readerUnitId && all.some((u) => u.id === state.readerUnitId)
        ? all.findIndex((u) => u.id === state.readerUnitId)
        : clampIndex(state.index, all.length),
    unit = all[index],
    profile = story ? storyProfile(m) : null;
  function select(i: number) {
    const next = all[clampIndex(i, all.length)];
    if (next) update({ index: i, readerUnitId: next.id });
  }
  useEffect(() => {
    if (engine !== "slideshow" || !playing || all.length < 2) return;
    const timer = setTimeout(
      () => {
        if (index + 1 < all.length) select(index + 1);
        else setPlaying(false);
      },
      Math.max(1, num(unit?.duration, num(d.pageSeconds, 8))) * 1000,
    );
    return () => clearTimeout(timer);
  }, [playing, index, all.length, engine, unit?.duration, d.pageSeconds]);
  // Story reading and listening are separate presentations. A narration binding alone never enables audio in a reading mode.
  if (story && profile?.narration) {
    const id = str(d.narrationAssetId) || str(unit?.narrationAssetId),
      audioUnit = {
        ...unit,
        id: d.narrationAssetId ? id : unit?.id || id || m.id,
        assetId: id,
        title: m.title,
      };
    return (
      <div className={s.listeningStory}>
        <MediaPlayer
          key={id + (d.narrationAssetId ? ":whole" : ":" + unit?.id)}
          {...props}
          d={{ ...d, transcript: "" }}
          unit={audioUnit}
        />
        {!d.narrationAssetId && all.length > 1 ? (
          <Pager
            index={index}
            count={all.length}
            locale={locale}
            onChange={select}
          />
        ) : null}
      </div>
    );
  }
  const source = unit ? (
    <>
      {str(unit.assetId) || ["pdf", "image"].includes(str(unit.kind)) ? <Source
        m={m}
        locale={locale}
        id={unit.assetId}
        alt={local(unit, "alt", locale) || local(unit, "title", locale)}
        pdf={unit.kind === "pdf" || engine === "pdf"}
      /> : null}
      {!printable && engine !== "slideshow" ? (
        <div className={s.storyText}>
          <h2>{local(unit, "title", locale)}</h2>
          {unit.contentId && m.bindings.records?.[unit.contentId] ? (
            <Editorial
              m={m.bindings.records[unit.contentId]}
              data={obj(m.bindings.records[unit.contentId].definition)}
              locale={locale}
            />
          ) : (
            <p>{local(unit, "text", locale)}</p>
          )}
        </div>
      ) : null}
    </>
  ) : null;
  if (!unit && !rows(d.blocks).length && !str(d.body))
    return <Empty locale={locale} />;
  const reader = (
    <div
      className={`${s.readingCanvas} ${story ? s.storyCanvas : ""} ${printable ? s.paperCanvas : ""}`}
      data-layout={d.pageLayout}
      style={{ "--reader-zoom": zoom } as React.CSSProperties}
    >
      {source}
    </div>
  );
  return (
    <div className={`${s.reading} ${printable ? s.printAtelier : ""}`}>
      <div className={s.readerTools}>
        {d.searchEnabled === true && !story ? (
          <label className={s.search}>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder={t("search", locale)}
              aria-label={t("search", locale)}
            />
          </label>
        ) : null}
        <div className={s.controls}>
          <Button
            onClick={() => setZoom((v) => Math.max(0.75, v - 0.25))}
            disabled={zoom <= 0.75}
            aria-label={t("zoomOut", locale)}
          >
            −
          </Button>
          <output>{Math.round(zoom * 100)}%</output>
          <Button
            onClick={() => setZoom((v) => Math.min(2, v + 0.25))}
            disabled={zoom >= 2}
            aria-label={t("zoomIn", locale)}
          >
            +
          </Button>
          <Button icon="ArrowUpRight" onClick={() => setFocus(true)}>
            {t("focus", locale)}
          </Button>
          {engine === "slideshow" ? (
            <Button primary onClick={() => setPlaying((v) => !v)}>
              {t(playing ? "pause" : "play", locale)}
            </Button>
          ) : null}
        </div>
      </div>
      <div className={s.readerLayout}>
        {all.length > 1 ? (
          <aside className={s.pageList}>
            {units.map((u, i) => (
              <button
                key={u.id}
                aria-current={u.id === unit?.id ? "page" : undefined}
                onClick={() => select(all.findIndex((x) => x.id === u.id))}
              >
                <span>{all.findIndex((x) => x.id === u.id) + 1}</span>
                {asset(m, u.assetId, "image/") ? (
                  <Source
                    m={m}
                    id={u.assetId}
                    alt={local(u, "title", locale)}
                  />
                ) : (
                  <strong>{local(u, "title", locale)}</strong>
                )}
              </button>
            ))}
          </aside>
        ) : null}
        <section className={s.readerMain}>
          {reader}
          {engine === "rich" || !unit ? (
            <Editorial m={m} data={d} locale={locale} />
          ) : null}
          {unit &&
          rows(d.storyChoices).filter((c) => c.unitId === unit.id).length ? (
            <div className={s.controls}>
              {rows(d.storyChoices)
                .filter(
                  (c) =>
                    c.unitId === unit.id &&
                    all.some((u) => u.id === c.nextUnitId),
                )
                .map((c) => (
                  <Button
                    key={c.id}
                    onClick={() =>
                      select(all.findIndex((u) => u.id === c.nextUnitId))
                    }
                  >
                    {local(c, "label", locale) || local(c, "title", locale)}
                  </Button>
                ))}
            </div>
          ) : null}
          {unit && all.length > 1 ? (
            <Pager
              index={index}
              count={all.length}
              locale={locale}
              onChange={select}
            />
          ) : null}
        </section>
      </div>
      {printable && d.printAllowed === true ? (
        <details className={s.disclosure}>
          <summary>{t("printGuide", locale)}</summary>
          <p>{t("printHelp", locale)}</p>
          {d.paper ? (
            <strong>
              {d.paper} · {d.orientation} · {d.colourMode}
            </strong>
          ) : null}
        </details>
      ) : null}
      {focus ? (
        <Modal title={m.title} locale={locale} onClose={() => setFocus(false)}>
          {reader}
          {all.length > 1 ? (
            <Pager
              index={index}
              count={all.length}
              locale={locale}
              onChange={select}
            />
          ) : null}
        </Modal>
      ) : null}
    </div>
  );
}
