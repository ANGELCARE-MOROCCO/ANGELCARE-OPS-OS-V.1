import { text, object, type Data } from "./types";
const allowed = new Set([
  "article",
  "section",
  "div",
  "h2",
  "h3",
  "h4",
  "p",
  "span",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "button",
  "br",
  "img",
]);
const escape = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
/** A small fixed HTML vocabulary; authored scripts, styles, URLs and arbitrary attributes never execute. */
export function restrictedMarkup(source: string) {
  if (new TextEncoder().encode(source).length > 100000)
    throw Error("HTML exceeds 100 KB.");
  return source
    .split(/(<[^>]*>)/g)
    .map((part) => {
      if (!part.startsWith("<")) return escape(part);
      const m = part.match(/^<(\/)?([a-zA-Z][\w-]*)([^>]*)>$/);
      if (!m || !allowed.has(m[2].toLowerCase())) return "";
      const tag = m[2].toLowerCase();
      if (m[1]) return tag === "br" ? "" : `</${tag}>`;
      if (tag === "img") {
        const asset = m[3].match(
          /\bdata-dce-asset\s*=\s*["']([a-fA-F0-9-]{36})["']/,
        );
        return asset ? '<img data-dce-asset="' + asset[1] + '" alt="">' : "";
      }
      const choice = m[3].match(
        /\bdata-dce-choice\s*=\s*["']([\w-]{1,80}\|\d{1,3})["']/,
      );
      return `<${tag}${tag === "button" ? ' type="button"' : ""}${tag === "button" && choice ? ' data-dce-choice="' + escape(choice[1]) + '"' : ""}>`;
    })
    .join("");
}
export function htmlActivityIssues(data: Data) {
  const p = object(data.htmlActivity);
  if (p.enabled !== true) return [];
  const issues = [];
  if (p.version !== 1) issues.push("HTML activity version 1 is required.");
  if (!text(p.markup)) issues.push("Author the selected language HTML layout.");
  try {
    restrictedMarkup(text(p.markup));
  } catch (e) {
    issues.push((e as Error).message);
  }
  return issues;
}
export function activityDocument(
  markup: string,
  nonce: string,
  channel: string,
  bindings: Data = {},
) {
  if (!/^[\w-]{16,80}$/.test(nonce) || !/^[\w-]{16,80}$/.test(channel))
    throw Error("Invalid activity context.");
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'none'; img-src https: data: blob:; media-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'"><style nonce="${nonce}">body{font:16px system-ui;color:#173655;margin:20px;line-height:1.6}section,article{border:1px solid #dbe6f4;border-radius:16px;padding:20px;margin:12px 0}button{padding:12px 18px;margin:6px;border:1px solid #1675d8;border-radius:12px;color:#15538c;background:#eef7ff;cursor:pointer}img{max-width:100%;max-height:280px;object-fit:contain}button:focus-visible{outline:3px solid #edb04b}button[aria-pressed=true]{background:#cfe6ff}</style>${restrictedMarkup(
    markup,
  ).replace(/<img data-dce-asset="([a-fA-F0-9-]{36})" alt="">/g, (_, id) => {
    const m = object(object(bindings.media)[id]),
      url = text(m.url);
    return /^image\//.test(text(m.mime)) && /^(https:\/\/|\/(?!\/))/.test(url)
      ? '<img src="' +
          escape(url) +
          '" alt="' +
          escape(text(m.alt) || text(m.title)) +
          '">'
      : "";
  })}<script nonce="${nonce}">document.addEventListener('click',e=>{const b=e.target.closest('button[data-dce-choice]');if(!b)return;parent.postMessage({type:'angelcare.activity.choice',channel:${JSON.stringify(channel)},value:b.getAttribute('data-dce-choice')},'*');b.setAttribute('aria-pressed','true')})</script>`;
}
/** Generate a controlled layout from native tasks, without exposing answer keys or writing IDs by hand. */
export function composeChoiceLayout(
  data: Data,
  locale: string,
  layout: "cards" | "list" | "illustrated" = "cards",
) {
  return arrayTasks(data)
    .map((task) => {
      const l = object(object(task.locales)[locale]),
        choices = text(l.choices || task.choices)
          .split("\n")
          .filter(Boolean);
      if (!/^[\w-]{1,80}$/.test(text(task.id)))
        throw Error("Use a native task identity.");
      return `<${layout === "cards" ? "section" : "article"}><h3>${escape(text(l.prompt || task.prompt || l.label || task.label))}</h3>${layout === "illustrated" && task.assetId ? `<img data-dce-asset="${escape(text(task.assetId))}" alt="">` : ""}${choices.map((choice, i) => `<button data-dce-choice="${task.id}|${i}">${escape(choice)}</button>`).join("")}</${layout === "cards" ? "section" : "article"}>`;
    })
    .join("");
}
function arrayTasks(d: Data): Data[] {
  return Array.isArray(d.tasks) ? d.tasks.map(object) : [];
}
