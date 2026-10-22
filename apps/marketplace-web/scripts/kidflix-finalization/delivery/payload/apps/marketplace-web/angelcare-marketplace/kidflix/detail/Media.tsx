"use client";
import { useEffect, useRef, useState } from "react";
import {
  asset,
  clampIndex,
  num,
  obj,
  rows,
  str,
  time,
  type Row,
} from "./model";
import {
  Button,
  Empty,
  ErrorNote,
  Pager,
  Source,
  type PlayerProps,
} from "./shared";
import { local, t } from "./copy";
import s from "./detail.module.css";
import { j } from "../journey/copy";
import { usePersonal } from "../journey/store";
export function MediaPlayer({
  m,
  d,
  unit,
  locale,
  state,
  update,
  onComplete,
  video = false,
  autoPlay = false,
}: {
  m: Row;
  d: Row;
  unit: Row;
  locale: PlayerProps["locale"];
  state: Row;
  update: PlayerProps["update"];
  onComplete?: (naturalEnd?: boolean) => void;
  autoPlay?: boolean;
  video?: boolean;
}) {
  const personal = usePersonal();
  const ref = useRef<HTMLMediaElement | null>(null),
    a = asset(m, unit.assetId, video ? "video/" : "audio/"),
    poster = asset(
      m,
      unit.posterAssetId || d.posterAssetId || d.coverAssetId,
      "image/",
    ),
    id = str(unit.id) || str(unit.assetId),
    latest = useRef({ state, update, onComplete });
  latest.current = { state, update, onComplete };
  const [playing, setPlaying] = useState(false),
    [position, setPosition] = useState(0),
    [duration, setDuration] = useState(num(unit.duration)),
    [failed, setFailed] = useState(false),
    [buffering, setBuffering] = useState(false),
    [speed, setSpeed] = useState(1),
    [volume, setVolume] = useState(1),
    last = useRef(0),
    thresholdReported = useRef(false);
  function remember() {
    const node = ref.current;
    if (node && Number.isFinite(node.currentTime))
      latest.current.update({
        positions: {
          ...obj(latest.current.state.positions),
          [id]: { position: node.currentTime, duration: node.duration || 0 },
        },
      });
  }
  useEffect(() => {
    const node = ref.current;
    return () => {
      if (node) {
        node.pause();
        remember();
      }
    };
  }, [id]);
  useEffect(() => {
    const at = num(state.sleepAt);
    if (!at) return;
    const timer = setTimeout(
      () => {
        ref.current?.pause();
        update({ sleepAt: 0, mediaContinue: false });
      },
      Math.max(0, at - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [state.sleepAt, id]);
  function finish() {
    remember();
    setPlaying(false);
    setBuffering(false);
    latest.current.onComplete?.(true);
  }
  const common = {
    src: a?.url,
    preload: personal.data.preferences.lowData ? "none" : "metadata",
    autoPlay,
    onPlay: () => {
      latest.current.update({ started: true });
      setPlaying(true);
      setFailed(false);
    },
    onWaiting: () => setBuffering(true),
    onStalled: () => { if(ref.current && !ref.current.paused && !ref.current.ended) setBuffering(true); },
    onSeeking: () => setBuffering(true),
    onSeeked: () => setBuffering(false),
    onCanPlay: () => setBuffering(false),
    onPlaying: () => setBuffering(false),
    onEmptied: () => setBuffering(false),
    onPause: () => {
      setBuffering(false);
      setPlaying(false);
      remember();
    },
    onEnded: finish,
    onError: () => {
      setBuffering(false);
      setFailed(true);
      setPlaying(false);
    },
    onLoadedMetadata: () => {
      const n = ref.current;
      if (!n) return;
      setDuration(
        Number.isFinite(n.duration) ? n.duration : num(unit.duration),
      );
      const saved = num(obj(latest.current.state.positions?.[id]).position);
      if (saved > 0 && Number.isFinite(n.duration) && saved < n.duration - 1)
        n.currentTime = saved;
    },
    onTimeUpdate: () => {
      const n = ref.current;
      if (!n) return;
      setPosition(n.currentTime);
      if (Date.now() - last.current > 3000) {
        last.current = Date.now();
        remember();
      }
      if (
        d.completionPolicy === "threshold" &&
        n.duration > 0 &&
        (n.currentTime / n.duration) * 100 >= num(d.completionPercent, 90)
      )
        if (!thresholdReported.current) {
          thresholdReported.current = true;
          latest.current.onComplete?.(false);
        }
    },
  };
  async function toggle() {
    if (!ref.current) return;
    if (playing) ref.current.pause();
    else
      try {
        await ref.current.play();
      } catch {
        setFailed(true);
      }
  }
  if (!a) return <Empty locale={locale} />;
  const tracks = rows(d.captions).filter(
    (c) => c.captionAssetId && asset(m, c.captionAssetId, "text/"),
  );
  return (
    <div
      className={`${s.mediaPlayer} ${video ? s.videoPlayer : s.audioPlayer}`}
      data-vertical={video && d.mode === "Vertical / Mobile Video Viewer"}
    >
      {video ? (
        <video
          {...common}
          ref={(n) => {
            ref.current = n;
          }}
          controls
          playsInline
          poster={poster?.url}
        >
          {tracks.map((c) => (
            <track
              key={c.id}
              kind="captions"
              src={asset(m, c.captionAssetId)!.url}
              srcLang={str(c.locale) || locale}
              label={str(c.locale) || locale}
              default={c.locale === locale}
            />
          ))}
          {asset(m, d.captionAssetId, "text/") ? (
            <track
              kind="captions"
              src={asset(m, d.captionAssetId)!.url}
              srcLang={locale}
              label={locale}
              default
            />
          ) : null}
        </video>
      ) : (
        <>
          <div className={s.audioArtwork}>
            {poster ? (
              <img src={poster.url} alt={poster.alt || m.title} />
            ) : (
              <div className={s.audioGlyph} aria-hidden="true">
                ♪
              </div>
            )}
          </div>
          <audio
            {...common}
            ref={(n) => {
              ref.current = n;
            }}
          />
        </>
      )}
      <div className={s.mediaControls}>
        <Button
          primary
          icon={playing ? "Volume2" : "Play"}
          onClick={() => void toggle()}
          aria-label={t(playing ? "pause" : "play", locale)}
        >
          {playing ? "Ⅱ" : "▶"}
          <span>{t(playing ? "pause" : "play", locale)}</span>
        </Button>
        <div className={s.nowPlaying}>
          <strong>{local(unit, "title", locale) || m.title}</strong>
          <span aria-live="polite">
            {playing ? t("playing", locale) : t("play", locale)}
          </span>
        </div>
        <div className={s.scrub}>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={Math.min(position, duration || 1)}
            aria-label={t("seek", locale)}
            onChange={(e) => {
              if (ref.current) {
                ref.current.currentTime = Number(e.target.value);
                setPosition(Number(e.target.value));
                remember();
              }
            }}
          />
          <span>
            {time(position)} / {time(duration)}
          </span>
        </div>
        <label className={s.volume}>
          <span>{t("volume", locale)}</span>
          <input
            aria-label={t("volume", locale)}
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              if (ref.current) ref.current.volume = v;
            }}
          />
        </label>
        <label>
          <span className={s.sr}>{t("speed", locale)}</span>
          <select
            aria-label={t("speed", locale)}
            value={speed}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSpeed(v);
              if (ref.current) ref.current.playbackRate = v;
            }}
          >
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((v) => (
              <option key={v} value={v}>
                {v}×
              </option>
            ))}
          </select>
        </label>
      </div>
      {buffering && !failed ? <p role="status" data-kidflix-buffering><span aria-hidden="true">◌</span> {locale === "ar" ? "جارٍ تجهيز الوسائط…" : locale === "fr" ? "Préparation du média…" : "Preparing your media…"}</p> : null}
      {failed ? (
        <ErrorNote
          message={t("mediaError", locale)}
          locale={locale}
          retry={() => {
            setFailed(false);
            ref.current?.load();
          }}
        />
      ) : null}
      {d.kidflixQueue !== false ? (
        <div className={s.controls}>
          <label>
            {j("sleep", locale)}{" "}
            <select
              value={Number(state.sleepMinutes) || 0}
              onChange={(e) => {
                const minutes = Number(e.target.value);
                update({
                  sleepMinutes: minutes,
                  sleepAt: minutes ? Date.now() + minutes * 60000 : 0,
                });
              }}
            >
              <option value="0">{j("off", locale)}</option>
              {[2, 5, 10, 30, 60].map((n) => (
                <option key={n} value={n}>
                  {n} {j("duration", locale)}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      {rows(d.chapters).length ? (
        <div className={s.chapterPills}>
          {rows(d.chapters)
            .filter((c) => !c.unitId || c.unitId === unit.id)
            .map((c) => (
              <Button
                key={c.id}
                onClick={() => {
                  if (ref.current)
                    ref.current.currentTime = num(c.startSeconds);
                }}
              >
                {time(num(c.startSeconds))} · {local(c, "title", locale)}
              </Button>
            ))}
        </div>
      ) : null}
      {local(unit, "transcript", locale) || local(d, "transcript", locale) ? (
        <details className={s.disclosure}>
          <summary>{t("transcript", locale)}</summary>
          <p>
            {local(unit, "transcript", locale) ||
              local(d, "transcript", locale)}
          </p>
        </details>
      ) : null}
    </div>
  );
}
export function MediaExperience(props: PlayerProps) {
  const { m, d, locale, state, update } = props,
    units = rows(d.units),
    index = clampIndex(state.index, units.length),
    unit = units[index],
    video = m.family === "video",
    [autoTarget, setAutoTarget] = useState<string | null>(null),
    complete = (id: string, naturalEnd = false) => {
      const completed = [
        ...new Set([
          ...(Array.isArray(state.completed) ? state.completed : []),
          id,
        ]),
      ];
      const next =
        naturalEnd &&
        state.autoNext === true &&
        d.kidflixQueue !== false &&
        index + 1 < units.length;
      if (next) setAutoTarget(str(units[index + 1].id));
      update({
        completed,
        complete: completed.length === units.length,
        ...(next ? { index: index + 1 } : {}),
        mediaContinue: false,
      });
    };
  return unit ? (
    <div className={units.length > 1 ? s.mediaLayout : undefined}>
      <section>
        {d.kidflixQueue !== false && units.length > 1 ? (
          <label className={s.callout}>
            <input
              type="checkbox"
              checked={state.autoNext === true}
              onChange={(e) =>
                update({ autoNext: e.target.checked, mediaContinue: false })
              }
            />
            {trNext(locale)}
          </label>
        ) : null}
        <MediaPlayer
          key={unit.id}
          {...props}
          unit={unit}
          video={video}
          autoPlay={autoTarget === unit.id}
          onComplete={(naturalEnd) => complete(unit.id, naturalEnd)}
        />
        {units.length > 1 ? (
          <Pager
            index={index}
            count={units.length}
            onChange={(i) => {
              setAutoTarget(null);
              update({ index: i, mediaContinue: false });
            }}
            locale={locale}
          />
        ) : null}
      </section>
      {units.length > 1 ? (
        <aside className={s.episodeList}>
          <h2>{t(video ? "chapters" : "listen", locale)}</h2>
          {units.map((u, i) => (
            <button
              key={u.id}
              aria-current={i === index ? "true" : undefined}
              onClick={() => {
                setAutoTarget(null);
                update({ index: i, mediaContinue: false });
              }}
            >
              <span className={s.stepNumber}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <strong>{local(u, "title", locale)}</strong>
                {num(u.duration) > 0 ? <small>{time(u.duration)}</small> : null}
              </span>
            </button>
          ))}
        </aside>
      ) : null}
    </div>
  ) : (
    <Empty locale={locale} />
  );
}
export function Presentations(props: PlayerProps) {
  const { m, d, locale, engine, state, update } = props,
    frames = rows(d.frames),
    index = clampIndex(state.index, frames.length),
    frame = frames[index],
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing || !frames.length) return;
    const timer = setTimeout(
      () => {
        if (index + 1 < frames.length) update({ index: index + 1 });
        else if (d.loop === true) update({ index: 0 });
        else setPlaying(false);
      },
      Math.max(1, num(frame?.seconds, num(d.defaultSeconds, 6))) * 1000,
    );
    return () => clearTimeout(timer);
  }, [playing, index, frames.length, frame?.seconds, d.defaultSeconds, d.loop]);
  return frame ? (
    <div className={s.presentation}>
      <div className={s.slide}>
        <Source m={m} id={frame.assetId} alt={local(frame, "title", locale)} />
        <div>
          <h2>{local(frame, "title", locale)}</h2>
          <p>{local(frame, "text", locale)}</p>
        </div>
      </div>
      {frame.publicNotes === true && str(frame.publicNoteText) ? (
        <aside className={s.callout}>{frame.publicNoteText}</aside>
      ) : null}
      <div className={s.controls}>
        {engine === "autoplay" ? (
          <Button primary onClick={() => setPlaying((v) => !v)}>
            {t(playing ? "pause" : "autoplay", locale)}
          </Button>
        ) : null}
        {d.navigationAllowed !== false || engine !== "autoplay" ? (
          <Pager
            index={index}
            count={frames.length}
            locale={locale}
            onChange={(i) => update({ index: i })}
          />
        ) : null}
      </div>
      <div className={s.thumbs}>
        {frames.map((f, i) => (
          <button
            key={f.id}
            aria-label={local(f, "title", locale)}
            aria-current={i === index ? "true" : undefined}
            onClick={() => update({ index: i })}
          >
            <Source m={m} id={f.assetId} alt={local(f, "title", locale)} />
            <span>{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  ) : (
    <Empty locale={locale} />
  );
}

function trNext(l: PlayerProps["locale"]) {
  return l === "fr"
    ? "Lire automatiquement la suite de cette ressource"
    : l === "ar"
      ? "تشغيل الجزء التالي من هذا المورد تلقائياً"
      : "Automatically play the next part of this resource";
}
