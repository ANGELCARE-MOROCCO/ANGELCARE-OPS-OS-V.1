import { array, object, text, number, type Data, type Locale } from "./types";
export function outputContent(
  data: Data,
  layout: Data,
  state: Data,
  locale: Locale,
) {
  const read = (row: Data, key: string) =>
    text(object(object(row.locales)[locale])[key]) || text(row[key]);
  const lines: string[] = [];
  const purpose = text(layout.purpose);
  if (purpose === "result") {
    if (typeof state.score !== "number")
      throw Error("Complete the experience before generating a result.");
    lines.push(String(state.score) + "%");
    if (state.resultTitle) lines.push(text(state.resultTitle));
    if (state.guidance) lines.push(text(state.guidance));
    for (const [skill, value] of Object.entries(object(state.skills))) {
      const v = object(value);
      lines.push(skill + ": " + number(v.earned) + " / " + number(v.total));
    }
  } else if (purpose === "planner" || purpose === "questionnaire") {
    const values = object(state.values),
      rows = array(data[purpose === "planner" ? "items" : "fields"]);
    if (!Object.keys(values).length)
      throw Error("Complete your personal copy before exporting.");
    for (const row of rows)
      if (values[text(row.id)] !== undefined)
        lines.push(
          (read(row, "label") || read(row, "title") || text(row.id)) +
            ": " +
            String(values[text(row.id)]),
        );
  } else if (purpose === "tool") {
    if (typeof state.toolResult !== "number")
      throw Error("Calculate a result before exporting.");
    lines.push(
      String(state.toolResult) + " " + text(data.outputUnit),
      read(data, "methodology"),
    );
  } else {
    const all = array(data[purpose === "cards" ? "cards" : "units"]),
      ids = text(layout.unitIds)
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      rows = all.filter((r, i) =>
        layout.scope === "selection"
          ? ids.includes(text(r.id))
          : layout.scope === "page"
            ? i === number(state.index)
            : true,
      );
    for (const row of rows) {
      lines.push(
        read(row, "title") || read(row, "front"),
        read(row, "text") || read(row, "back"),
      );
    }
    if (!lines.some(Boolean))
      throw Error(
        "No authored text is available for this output. Bind a source-file download for media-only pages.",
      );
  }
  return lines.filter(Boolean);
}
export async function generatePersonalOutput(
  data: Data,
  layout: Data,
  state: Data,
  locale: Locale,
  signal?: AbortSignal,
  bindings: Data = {},
) {
  const assembled = await assembleNativePages(
    data,
    layout,
    state,
    locale,
    bindings,
    signal,
  );
  if (assembled) return assembled;
  const check = () => {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  };
  check();
  const dpi = Math.max(96, Math.min(200, number(layout.dpi, 120))),
    ratio = dpi / 25.4,
    paper = layout.paper === "Letter" ? [215.9, 279.4] : [210, 297],
    size = layout.orientation === "landscape" ? [paper[1], paper[0]] : paper,
    w = Math.round(size[0] * ratio),
    h = Math.round(size[1] * ratio),
    margin = Math.max(8, Math.min(35, number(layout.marginMm, 18))) * ratio,
    lineHeight = dpi * 0.22,
    maxPages = Math.max(1, Math.min(40, number(layout.maxPages, 10))),
    rtl = locale === "ar",
    title =
      text(object(object(layout.locales)[locale]).title) ||
      text(layout.title) ||
      "AngelCare",
    lines = outputContent(data, layout, state, locale),
    pages: HTMLCanvasElement[] = [];
  let canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    y = 0;
  const newPage = () => {
    check();
    if (pages.length >= maxPages)
      throw Error(
        "The output exceeds its configured page limit. Choose fewer pages or increase the allowed limit.",
      );
    canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.direction = rtl ? "rtl" : "ltr";
    ctx.textAlign = rtl ? "right" : "left";
    ctx.fillStyle = "#194c76";
    ctx.font = `600 ${Math.round(dpi * 0.17)}px system-ui, sans-serif`;
    let top = margin;
    if (layout.includeBrand === true) {
      ctx.fillText("AngelCare", rtl ? w - margin : margin, top);
      top += lineHeight * 1.3;
    }
    ctx.font = `600 ${Math.round(dpi * 0.23)}px system-ui, sans-serif`;
    ctx.fillText(title, rtl ? w - margin : margin, top, w - 2 * margin);
    top += lineHeight * 1.6;
    ctx.font = `${Math.round(dpi * 0.15)}px system-ui, sans-serif`;
    ctx.fillStyle = "#17324c";
    pages.push(canvas);
    y = top;
  };
  newPage();
  const draw = (line: string) => {
    check();
    if (y > h - margin - lineHeight * 1.5) newPage();
    ctx.fillText(line, rtl ? w - margin : margin, y);
    y += lineHeight;
  };
  for (const paragraph of lines) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? line + " " + word : word;
      if (ctx!.measureText(next).width > w - 2 * margin) {
        if (line) draw(line);
        line = "";
        let segment = "";
        for (const ch of Array.from(word)) {
          if (ctx!.measureText(segment + ch).width > w - 2 * margin) {
            draw(segment);
            segment = "";
          }
          segment += ch;
        }
        line = segment;
      } else line = next;
    }
    if (line) draw(line);
    y += lineHeight * 0.45;
  }
  for (let i = 0; i < pages.length; i++) {
    check();
    const c = pages[i].getContext("2d")!;
    c.font = `${Math.round(dpi * 0.105)}px system-ui,sans-serif`;
    c.textAlign = "center";
    c.fillStyle = "#63788c";
    c.fillText(String(i + 1) + " / " + pages.length, w / 2, h - margin * 0.5);
    const watermark =
      text(object(object(layout.locales)[locale]).watermark) ||
      text(layout.watermark);
    if (watermark) {
      c.save();
      c.globalAlpha = 0.1;
      c.translate(w / 2, h / 2);
      c.rotate(-Math.PI / 6);
      c.font = `600 ${Math.round(dpi * 0.35)}px system-ui,sans-serif`;
      c.fillText(watermark, 0, 0, w * 0.8);
      c.restore();
    }
  }
  const mime = text(layout.mime),
    name = (text(layout.fileName) || "angelcare-personal")
      .replace(/[^\p{L}\p{N}_.-]+/gu, "-")
      .replace(/\.(png|pdf)$/i, "");
  if (mime === "image/png") {
    if (pages.length !== 1)
      throw Error(
        "PNG contains one page. Choose current page or use PDF for multiple pages.",
      );
    const blob = await new Promise<Blob>((resolve, reject) =>
      pages[0].toBlob(
        (v) => (v ? resolve(v) : reject(Error("PNG encoding failed."))),
        "image/png",
      ),
    );
    check();
    return { blob, name: name + ".png", pages: 1 };
  }
  if (mime !== "application/pdf")
    throw Error("Unsupported personal output format.");
  const { PDFDocument } = await import("pdf-lib"),
    pdf = await PDFDocument.create();
  pdf.setTitle(title);
  pdf.setProducer("AngelCare DCE");
  for (const c of pages) {
    check();
    const image = await pdf.embedPng(c.toDataURL("image/png"));
    pdf
      .addPage([(size[0] * 72) / 25.4, (size[1] * 72) / 25.4])
      .drawImage(image, {
        x: 0,
        y: 0,
        width: (size[0] * 72) / 25.4,
        height: (size[1] * 72) / 25.4,
      });
  }
  check();
  return {
    blob: new Blob([new Uint8Array(await pdf.save())], {
      type: "application/pdf",
    }),
    name: name + ".pdf",
    pages: pages.length,
  };
}

async function assembleNativePages(
  data: Data,
  layout: Data,
  state: Data,
  locale: Locale,
  bindings: Data,
  signal?: AbortSignal,
) {
  if (!["cards", "pages"].includes(text(layout.purpose))) return null;
  const all = array(data[layout.purpose === "cards" ? "cards" : "units"]),
    ids = text(layout.unitIds)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    rows = all.filter((r, i) =>
      layout.scope === "selection"
        ? ids.includes(text(r.id))
        : layout.scope === "page"
          ? i === number(state.index)
          : true,
    );
  if (!rows.length || !rows.some((r) => r.assetId)) return null;
  const { PDFDocument } = await import("pdf-lib"),
    pdf = await PDFDocument.create(),
    max = Math.max(1, Math.min(40, number(layout.maxPages, 10))),
    paper = layout.paper === "Letter" ? [612, 792] : [595.28, 841.89],
    size = layout.orientation === "landscape" ? [paper[1], paper[0]] : paper;
  let png: Blob | undefined,
    bytesTotal = 0;
  for (const row of rows) {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    const source = object(object(bindings.media)[text(row.assetId)]),
      url = text(source.url),
      mime = text(source.mime);
    if (
      !/^(https:\/\/|\/(?!\/))/.test(url) ||
      !["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(
        mime,
      )
    )
      throw Error(
        "Every assembled page needs a supported native PDF or image binding.",
      );
    const response = await fetch(url, { signal });
    if (!response.ok)
      throw Error(
        "A bound source could not be read. Existing content is retained.",
      );
    const length = Number(response.headers.get("content-length"));
    if (length > 25 * 1024 * 1024)
      throw Error("A source exceeds the 25 MB export limit.");
    const reader = response.body?.getReader();
    if (!reader) throw Error("The bound source has no readable body.");
    const chunks: Uint8Array[] = [];
    let lengthRead = 0;
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      lengthRead += part.value.byteLength;
      bytesTotal += part.value.byteLength;
      if (lengthRead > 25 * 1024 * 1024 || bytesTotal > 100 * 1024 * 1024) {
        await reader.cancel();
        throw Error("The export source limit was exceeded.");
      }
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(lengthRead);
    let cursor = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, cursor);
      cursor += chunk.length;
    }
    if (mime === "application/pdf") {
      if (layout.mime === "image/png")
        throw Error(
          "Use the original PNG rendition for an image download; PDF pages remain PDF.",
        );
      const sourcePdf = await PDFDocument.load(bytes);
      if (sourcePdf.getPageCount() + pdf.getPageCount() > max)
        throw Error("The assembled PDF exceeds its configured page limit.");
      for (const page of await pdf.copyPages(
        sourcePdf,
        sourcePdf.getPageIndices(),
      ))
        pdf.addPage(page);
    } else {
      if (pdf.getPageCount() >= max)
        throw Error("The assembled document exceeds its page limit.");
      const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
      try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = () => reject(Error("Invalid image source."));
          i.src = blobUrl;
        });
        if (image.width * image.height > 50000000)
          throw Error("Use an image rendition below 50 megapixels.");
        const scale = Math.max(96, Math.min(200, number(layout.dpi, 120))) / 72,
          canvas = document.createElement("canvas");
        canvas.width = Math.round(size[0] * scale);
        canvas.height = Math.round(size[1] * scale);
        const c = canvas.getContext("2d")!;
        c.fillStyle = "#fff";
        c.fillRect(0, 0, canvas.width, canvas.height);
        const margin =
            ((Math.max(8, Math.min(35, number(layout.marginMm, 18))) * 72) /
              25.4) *
            scale,
          fit = Math.min(
            (canvas.width - 2 * margin) / image.width,
            (canvas.height - 2 * margin) / image.height,
          );
        c.drawImage(
          image,
          (canvas.width - image.width * fit) / 2,
          (canvas.height - image.height * fit) / 2,
          image.width * fit,
          image.height * fit,
        );
        png = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (v) => (v ? resolve(v) : reject(Error("PNG encoding failed."))),
            "image/png",
          ),
        );
        const embedded = await pdf.embedPng(await png.arrayBuffer());
        pdf
          .addPage(size as [number, number])
          .drawImage(embedded, { x: 0, y: 0, width: size[0], height: size[1] });
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    }
  }
  const name = (text(layout.fileName) || "angelcare-pages")
    .replace(/[^\p{L}\p{N}_.-]+/gu, "-")
    .replace(/\.(png|pdf)$/i, "");
  if (layout.mime === "image/png") {
    if (rows.length !== 1 || !png)
      throw Error(
        "PNG exports one native image page. Choose one page or use PDF.",
      );
    return { blob: png, name: name + ".png", pages: 1 };
  }
  return {
    blob: new Blob([new Uint8Array(await pdf.save())], {
      type: "application/pdf",
    }),
    name: name + ".pdf",
    pages: pdf.getPageCount(),
  };
}
