import { createHash } from "node:crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createServiceClient } from "@/lib/supabase/server";
import type { JsonRecord } from "./free-provider-types";
import { snapshotHash, type InstitutionalActor } from "./institutional-runtime";

const now = () => new Date().toISOString();
const clean = (value: unknown) => String(value ?? "").trim();
const object = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
const rows = (value: unknown): JsonRecord[] => Array.isArray(value) ? value.filter((item): item is JsonRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
const actorName = (actor: InstitutionalActor) => clean(actor.email || actor.name || actor.id || "AC Capital artifact factory");

type SupabaseAny = Awaited<ReturnType<typeof createServiceClient>>;

export type ArtifactSection = { title: string; content: string; evidence?: string[]; status?: string };
export type ArtifactDocument = {
  title: string;
  subtitle: string;
  artifactType: string;
  confidentiality: string;
  generatedAt: string;
  version: number;
  executiveSummary: string;
  sections: ArtifactSection[];
  evidenceReferences: string[];
  approvalStatus: string;
  metadata: JsonRecord;
};

function xmlEscape(value: unknown) {
  return clean(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function safeFileName(value: string) {
  return value.normalize("NFKD").replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "ac-capital-artifact";
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number) {
  const bytes = new Uint8Array(2); new DataView(bytes.buffer).setUint16(0, value, true); return bytes;
}
function u32(value: number) {
  const bytes = new Uint8Array(4); new DataView(bytes.buffer).setUint32(0, value >>> 0, true); return bytes;
}
function concat(...parts: Uint8Array[]) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length); let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

function zipStore(files: Array<{ name: string; data: Uint8Array }>) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = crc32(file.data);
    const local = concat(
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(file.data.length), u32(file.data.length), u16(name.length), u16(0), name, file.data,
    );
    localParts.push(local);
    const central = concat(
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(file.data.length), u32(file.data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name,
    );
    centralParts.push(central);
    offset += local.length;
  }
  const central = concat(...centralParts);
  const end = concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(central.length), u32(offset), u16(0));
  return concat(...localParts, central, end);
}

function paragraphXml(text: string, style = "Normal") {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return lines.map((line) => `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r></w:p>`).join("");
}

function renderDocx(document: ArtifactDocument) {
  const encoder = new TextEncoder();
  const body = [
    paragraphXml("ANGELCARE · AC CAPITAL OS", "Brand"),
    paragraphXml(document.title, "Title"),
    paragraphXml(document.subtitle, "Subtitle"),
    paragraphXml(`${document.confidentiality} · Version ${document.version} · ${document.generatedAt}`, "Meta"),
    paragraphXml("Executive Summary", "Heading1"),
    paragraphXml(document.executiveSummary),
    ...document.sections.flatMap((section) => [
      paragraphXml(section.title, "Heading1"),
      paragraphXml(section.content),
      section.evidence?.length ? paragraphXml(`Evidence: ${section.evidence.join(" · ")}`, "Meta") : "",
    ]),
    paragraphXml("Governance & Release", "Heading1"),
    paragraphXml(`Approval status: ${document.approvalStatus}. External release remains human-controlled.`),
  ].join("");
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="21"/><w:color w:val="24324A"/></w:rPr><w:pPr><w:spacing w:after="140" w:line="300" w:lineRule="auto"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="38"/><w:color w:val="102A56"/></w:rPr><w:pPr><w:spacing w:before="160" w:after="220"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:rPr><w:sz w:val="24"/><w:color w:val="5F6F86"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:rPr><w:b/><w:sz w:val="27"/><w:color w:val="B4232F"/></w:rPr><w:pPr><w:spacing w:before="300" w:after="130"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Brand"><w:name w:val="Brand"/><w:rPr><w:b/><w:sz w:val="18"/><w:color w:val="B4232F"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Meta"><w:name w:val="Meta"/><w:rPr><w:sz w:val="17"/><w:color w:val="718096"/></w:rPr></w:style></w:styles>`;
  const files = [
    { name: "[Content_Types].xml", data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`) },
    { name: "_rels/.rels", data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`) },
    { name: "word/document.xml", data: encoder.encode(documentXml) },
    { name: "word/styles.xml", data: encoder.encode(styles) },
    { name: "word/_rels/document.xml.rels", data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`) },
    { name: "docProps/core.xml", data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlEscape(document.title)}</dc:title><dc:creator>AngelCare AC Capital OS</dc:creator><cp:lastModifiedBy>AngelCare AC Capital OS</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now()}</dcterms:created></cp:coreProperties>`) },
    { name: "docProps/app.xml", data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>AngelCare AC Capital OS</Application></Properties>`) },
  ];
  return zipStore(files);
}

function excelColumn(index: number) {
  let value = index + 1; let output = "";
  while (value > 0) { const remainder = (value - 1) % 26; output = String.fromCharCode(65 + remainder) + output; value = Math.floor((value - 1) / 26); }
  return output;
}

function renderXlsx(document: ArtifactDocument) {
  const encoder = new TextEncoder();
  const data = [
    ["AC CAPITAL OS", document.title],
    ["Artifact type", document.artifactType],
    ["Version", String(document.version)],
    ["Generated", document.generatedAt],
    ["Approval", document.approvalStatus],
    [],
    ["Section", "Content", "Evidence", "Status"],
    ["Executive Summary", document.executiveSummary, "", "Human review"],
    ...document.sections.map((section) => [section.title, section.content, (section.evidence || []).join(" | "), section.status || "Draft"]),
  ];
  const sheetRows = data.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((cell, columnIndex) => `<c r="${excelColumn(columnIndex)}${rowIndex + 1}" t="inlineStr"><is><t>${xmlEscape(cell)}</t></is></c>`).join("")}</row>`).join("");
  const files = [
    { name: "[Content_Types].xml", data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`) },
    { name: "_rels/.rels", data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`) },
    { name: "xl/workbook.xml", data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Capital Artifact" sheetId="1" r:id="rId1"/></sheets></workbook>`) },
    { name: "xl/_rels/workbook.xml.rels", data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`) },
    { name: "xl/worksheets/sheet1.xml", data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="28" customWidth="1"/><col min="2" max="4" width="70" customWidth="1"/></cols><sheetData>${sheetRows}</sheetData></worksheet>`) },
    { name: "xl/styles.xml", data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Aptos"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="1"><xf xfId="0"/></cellXfs></styleSheet>`) },
  ];
  return zipStore(files);
}

function wrapText(text: string, maxChars = 95) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = []; let line = "";
  for (const word of words) {
    if (!word) continue;
    if (`${line} ${word}`.trim().length > maxChars && line) { lines.push(line); line = word; }
    else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines;
}

async function renderPdf(document: ArtifactDocument) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [595.28, 841.89];
  const margin = 52; let page = pdf.addPage(pageSize); let y = 790; let pageNumber = 1;
  const newPage = () => { page = pdf.addPage(pageSize); y = 790; pageNumber += 1; };
  const footer = () => {
    page.drawLine({ start: { x: margin, y: 35 }, end: { x: pageSize[0] - margin, y: 35 }, thickness: 0.6, color: rgb(0.82, 0.85, 0.9) });
    page.drawText(`ANGELCARE · AC CAPITAL OS · ${document.confidentiality}`, { x: margin, y: 20, size: 7.5, font: bold, color: rgb(0.25, 0.32, 0.45) });
    page.drawText(String(pageNumber), { x: pageSize[0] - margin - 8, y: 20, size: 8, font: regular, color: rgb(0.35, 0.4, 0.5) });
  };
  const ensure = (height: number) => { if (y - height < 55) { footer(); newPage(); } };
  const drawLines = (text: string, options: { size?: number; font?: typeof regular; color?: ReturnType<typeof rgb>; gap?: number; maxChars?: number } = {}) => {
    const size = options.size || 10; const gap = options.gap || size * 1.45; const lines = wrapText(text, options.maxChars || Math.max(50, Math.floor(96 * 10 / size)));
    ensure(lines.length * gap + 8);
    for (const line of lines) { page.drawText(line, { x: margin, y, size, font: options.font || regular, color: options.color || rgb(0.13, 0.19, 0.3) }); y -= gap; }
    y -= 4;
  };
  page.drawRectangle({ x: 0, y: 765, width: pageSize[0], height: 77, color: rgb(0.965, 0.975, 0.99) });
  page.drawRectangle({ x: 0, y: 765, width: 7, height: 77, color: rgb(0.72, 0.08, 0.12) });
  page.drawText("ANGELCARE", { x: margin, y: 812, size: 12, font: bold, color: rgb(0.72, 0.08, 0.12) });
  page.drawText("AC CAPITAL OS", { x: margin + 85, y: 812, size: 9, font: bold, color: rgb(0.10, 0.23, 0.42) });
  y = 745; drawLines(document.title, { size: 23, font: bold, color: rgb(0.06, 0.18, 0.35), maxChars: 48, gap: 29 });
  drawLines(document.subtitle, { size: 11, color: rgb(0.35, 0.42, 0.52), maxChars: 82 });
  drawLines(`${document.confidentiality} · Version ${document.version} · ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(document.generatedAt))}`, { size: 8.5, font: bold, color: rgb(0.45, 0.49, 0.58) });
  y -= 8; drawLines("EXECUTIVE SUMMARY", { size: 9, font: bold, color: rgb(0.72, 0.08, 0.12) });
  drawLines(document.executiveSummary, { size: 10.5, maxChars: 88 });
  for (const [index, section] of document.sections.entries()) {
    ensure(80); y -= 10;
    page.drawText(String(index + 1).padStart(2, "0"), { x: margin, y, size: 9, font: bold, color: rgb(0.72, 0.08, 0.12) });
    page.drawText(section.title, { x: margin + 28, y, size: 14, font: bold, color: rgb(0.06, 0.18, 0.35) }); y -= 22;
    drawLines(section.content, { size: 10, maxChars: 92 });
    if (section.evidence?.length) drawLines(`Evidence: ${section.evidence.join(" · ")}`, { size: 7.8, color: rgb(0.38, 0.45, 0.55), maxChars: 112 });
  }
  ensure(80); y -= 8;
  page.drawText("GOVERNANCE & RELEASE", { x: margin, y, size: 9, font: bold, color: rgb(0.72, 0.08, 0.12) }); y -= 18;
  drawLines(`Approval status: ${document.approvalStatus}. This artifact is an internal governed output. External communication, submission and legal or financial commitment remain human-controlled.`, { size: 9.5, maxChars: 95 });
  footer();
  return new Uint8Array(await pdf.save());
}

function renderCsv(document: ArtifactDocument) {
  const quote = (value: unknown) => `"${clean(value).replaceAll('"', '""')}"`;
  const lines = [["section","content","evidence","status"], ["Executive Summary",document.executiveSummary,"","Human review"], ...document.sections.map((section) => [section.title,section.content,(section.evidence||[]).join(" | "),section.status||"Draft"])];
  return new TextEncoder().encode(lines.map((row) => row.map(quote).join(",")).join("\r\n"));
}

function documentFromArtifact(artifact: JsonRecord): ArtifactDocument {
  const content = object(artifact.content_snapshot);
  const sectionRows = rows(content.sections);
  return {
    title: clean(content.title || artifact.title),
    subtitle: clean(content.subtitle || content.purpose || "AngelCare Capital Intelligence & Execution"),
    artifactType: clean(artifact.artifact_type),
    confidentiality: clean(artifact.confidentiality || "Confidential"),
    generatedAt: clean(artifact.generated_at || artifact.created_at || now()),
    version: Number(artifact.current_version || 1),
    executiveSummary: clean(content.executiveSummary || content.executive_summary || content.summary || "No executive summary is available."),
    sections: sectionRows.map((section) => ({ title: clean(section.title || section.section_title || "Section"), content: clean(section.content || section.content_markdown || section.body || "No content."), evidence: Array.isArray(section.evidence) ? section.evidence.map(clean).filter(Boolean) : [], status: clean(section.status || section.readiness || "Draft") })),
    evidenceReferences: Array.isArray(artifact.evidence_references) ? artifact.evidence_references.map(clean).filter(Boolean) : [],
    approvalStatus: clean(artifact.approval_status || "not-requested"),
    metadata: object(content.metadata),
  };
}

export async function buildArtifactContext(input: { artifactType: string; entityType?: string; entityId?: string; reportId?: string }) {
  const supabase = await createServiceClient();
  const artifactType = clean(input.artifactType);
  const entityId = clean(input.entityId);
  const context: JsonRecord = { artifactType, generatedAt: now() };
  if (input.reportId) {
    const report = await supabase.from("ac_capital_strategy_reports").select("*").eq("id", input.reportId).maybeSingle();
    if (report.error) throw report.error;
    const sections = await supabase.from("ac_capital_strategy_report_sections").select("*").eq("report_id", input.reportId).order("section_order", { ascending: true });
    if (sections.error) throw sections.error;
    context.report = report.data || {};
    context.sections = sections.data || [];
  } else if (input.entityType === "case" && entityId) {
    const tables = ["ac_capital_cases","ac_capital_case_narratives","ac_capital_case_financial_sections","ac_capital_case_risk_plans","ac_capital_case_impact_sections","ac_capital_case_proof_packs","ac_capital_case_documents"];
    const [caseResult, ...details] = await Promise.all([
      supabase.from(tables[0]).select("*").eq("id", entityId).maybeSingle(),
      ...tables.slice(1).map((table) => supabase.from(table).select("*").eq("case_id", entityId).limit(100)),
    ]);
    if (caseResult.error) throw caseResult.error;
    context.case = caseResult.data || {};
    tables.slice(1).forEach((table, index) => { const result = details[index]; if (result.error) throw result.error; context[table] = result.data || []; });
  } else if (input.entityType === "qualification" && entityId) {
    const dossier = await supabase.from("ac_capital_qualification_dossiers").select("*").eq("id", entityId).maybeSingle();
    if (dossier.error) throw dossier.error;
    context.dossier = dossier.data || {};
    for (const table of ["ac_capital_qualification_scores","ac_capital_qualification_risks","ac_capital_qualification_missing_documents","ac_capital_qualification_next_actions","ac_capital_qualification_decisions"]) {
      const result = await supabase.from(table).select("*").eq("dossier_id", entityId).limit(100); if (result.error) throw result.error; context[table] = result.data || [];
    }
  } else if (input.entityType === "pipeline" && entityId) {
    const pipeline = await supabase.from("ac_capital_pipeline_records").select("*").eq("id", entityId).maybeSingle();
    if (pipeline.error) throw pipeline.error; context.pipeline = pipeline.data || {};
    for (const table of ["ac_capital_pipeline_stage_events","ac_capital_pipeline_followups","ac_capital_pipeline_tasks","ac_capital_pipeline_submissions","ac_capital_pipeline_negotiations","ac_capital_pipeline_outcomes"]) {
      const result = await supabase.from(table).select("*").eq("pipeline_record_id", entityId).limit(100); if (result.error) throw result.error; context[table] = result.data || [];
    }
  } else if (input.entityType === "document" && entityId) {
    const document = await supabase.from("ac_capital_data_room_documents").select("*").eq("id", entityId).maybeSingle(); if (document.error) throw document.error; context.document = document.data || {};
  } else {
    const [workflows, opportunities, cases, pipeline, approvals, integrity] = await Promise.all([
      supabase.from("ac_capital_orchestrator_workflows").select("*").order("updated_at", { ascending: false }).limit(30),
      supabase.from("ac_capital_radar_opportunities").select("*").order("updated_at", { ascending: false }).limit(30),
      supabase.from("ac_capital_cases").select("*").order("updated_at", { ascending: false }).limit(30),
      supabase.from("ac_capital_pipeline_records").select("*").order("updated_at", { ascending: false }).limit(30),
      supabase.from("ac_capital_universal_approvals").select("*").order("requested_at", { ascending: false }).limit(30),
      supabase.from("ac_capital_integrity_issues").select("*").order("detected_at", { ascending: false }).limit(30),
    ]);
    for (const result of [workflows, opportunities, cases, pipeline, approvals, integrity]) if (result.error) throw result.error;
    Object.assign(context, { workflows: workflows.data, opportunities: opportunities.data, cases: cases.data, pipeline: pipeline.data, approvals: approvals.data, integrity: integrity.data });
  }
  return context;
}

export function deterministicArtifactContent(input: { artifactType: string; title?: string; context: JsonRecord }) {
  const type = clean(input.artifactType);
  const context = input.context;
  const report = object(context.report);
  const caseRow = object(context.case);
  const dossier = object(context.dossier);
  const pipeline = object(context.pipeline);
  const title = clean(input.title || report.report_type || caseRow.case_title || dossier.title || pipeline.title || type.replaceAll("-", " "));
  if (report.id) return { title, subtitle: clean(report.purpose || report.audience), executiveSummary: clean(report.generated_body ? object(report.generated_body).executiveSummary : report.purpose), sections: rows(context.sections).map((section) => ({ title: clean(section.section_title), content: clean(section.content_markdown || section.content_placeholder), evidence: [clean(section.source_workspace)].filter(Boolean), status: clean(section.readiness) })) };
  if (caseRow.id) return { title, subtitle: `${clean(caseRow.package_type)} · ${clean(caseRow.funding_type)}`, executiveSummary: clean(rows(context.ac_capital_case_narratives)[0]?.opening_message || caseRow.next_action), sections: [
    ...rows(context.ac_capital_case_narratives).map((row) => ({ title: clean(row.headline || row.narrative_type), content: clean(row.opening_message), evidence: [clean(row.proof_to_emphasize)].filter(Boolean), status: clean(row.status) })),
    ...rows(context.ac_capital_case_financial_sections).map((row) => ({ title: "Financial Strategy & Use of Funds", content: `${clean(row.base_scenario)}\nConservative: ${clean(row.conservative_scenario)}\nUpside: ${clean(row.upside_scenario)}\nUse of funds: ${JSON.stringify(row.use_of_funds || [])}`, evidence: [], status: clean(row.status) })),
    ...rows(context.ac_capital_case_risk_plans).map((row) => ({ title: `Risk · ${clean(row.risk_type)}`, content: `${clean(row.description)}\nMitigation: ${clean(row.mitigation)}\nPlan B: ${clean(row.plan_b)}\nPlan C: ${clean(row.plan_c)}\nPlan D: ${clean(row.plan_d)}`, evidence: [clean(row.related_proof)].filter(Boolean), status: clean(row.status) })),
    ...rows(context.ac_capital_case_impact_sections).map((row) => ({ title: `Impact · ${clean(row.impact_category)}`, content: `${clean(row.statement)}\nIndicator: ${clean(row.measurable_indicator)}\nSafe wording: ${clean(row.recommended_wording)}`, evidence: [clean(row.proof_needed)].filter(Boolean), status: "Human verification" })),
  ] };
  if (dossier.id) return { title, subtitle: `${clean(dossier.opportunity_type)} · Qualification Committee`, executiveSummary: clean(dossier.executive_summary), sections: [
    { title: "Eligibility & AngelCare Fit", content: `${clean(dossier.eligibility_summary)}\n${clean(dossier.angelcare_match_summary)}`, status: clean(dossier.decision_label) },
    ...rows(context.ac_capital_qualification_scores).map((row) => ({ title: clean(row.criterion_label), content: `${clean(row.explanation)}\nScore: ${row.score}/100 · Weight: ${row.weight}\nMissing evidence: ${clean(row.missing_evidence)}`, evidence: [clean(row.evidence_status)].filter(Boolean), status: clean(row.risk_note || "Reviewed") })),
    { title: "Proof Gaps", content: rows(context.ac_capital_qualification_missing_documents).map((row) => `${clean(row.document_name)} — ${clean(row.status)} — ${clean(row.priority)}`).join("\n") || "No proof gaps recorded.", status: "Human closure required" },
    { title: "Next Actions", content: rows(context.ac_capital_qualification_next_actions).map((row) => `${clean(row.action_label)} — ${clean(row.owner)} — ${clean(row.expected_output)}`).join("\n") || clean(dossier.next_action), status: "Operational" },
  ] };
  if (pipeline.id) return { title, subtitle: `${clean(pipeline.stage)} · ${clean(pipeline.status)}`, executiveSummary: `Weighted value: ${clean(pipeline.weighted_value)} ${clean(pipeline.currency_label)}. Probability: ${clean(pipeline.probability_percent)}%. Next action: ${clean(pipeline.next_action)}.`, sections: [
    { title: "Pipeline Position", content: JSON.stringify(pipeline, null, 2), status: clean(pipeline.health_status || pipeline.risk_level) },
    { title: "Follow-ups", content: rows(context.ac_capital_pipeline_followups).map((row) => `${clean(row.followup_type)} · ${clean(row.channel)} · ${clean(row.status)} · ${clean(row.due_date)}`).join("\n") || "No follow-ups.", status: "Internal" },
    { title: "Tasks", content: rows(context.ac_capital_pipeline_tasks).map((row) => `${clean(row.task_title)} · ${clean(row.owner)} · ${clean(row.status)}`).join("\n") || "No tasks.", status: "Internal" },
  ] };
  const workflows = rows(context.workflows); const opportunities = rows(context.opportunities); const cases = rows(context.cases); const pipelines = rows(context.pipeline); const approvals = rows(context.approvals); const integrity = rows(context.integrity);
  return { title, subtitle: "Capital Executive Department Brief", executiveSummary: `${workflows.length} workflow(s), ${opportunities.length} opportunity record(s), ${cases.length} case(s), ${pipelines.length} pipeline record(s), ${approvals.filter((row) => clean(row.status) === "pending").length} pending approval(s), and ${integrity.filter((row) => clean(row.status) === "open").length} open integrity issue(s).`, sections: [
    { title: "Active Capital Lifecycles", content: workflows.map((row) => `${clean(row.title)} · ${clean(row.current_stage)} · ${clean(row.status)} · ${clean(row.next_action)}`).join("\n") || "No active lifecycles.", status: "Executive" },
    { title: "Opportunity Portfolio", content: opportunities.map((row) => `${clean(row.title)} · ${clean(row.status)} · deadline ${clean(row.deadline || row.deadline_label)}`).join("\n") || "No opportunities.", status: "Intelligence" },
    { title: "Case & Pipeline Readiness", content: [...cases.map((row) => `${clean(row.case_title)} · readiness ${clean(row.total_readiness_score)} · ${clean(row.status)}`), ...pipelines.map((row) => `${clean(row.title)} · ${clean(row.stage)} · ${clean(row.next_action)}`)].join("\n") || "No case or pipeline records.", status: "Execution" },
    { title: "Governance Decisions", content: approvals.map((row) => `${clean(row.approval_type)} · ${clean(row.status)} · ${clean(row.decision_requested)}`).join("\n") || "No approval records.", status: "Founder-controlled" },
    { title: "Integrity & Risk", content: integrity.map((row) => `${clean(row.severity)} · ${clean(row.title)} · ${clean(row.recommended_action)}`).join("\n") || "No integrity issues.", status: "Governance" },
  ] };
}

export async function createCapitalArtifact(input: { artifactType: string; title: string; entityType?: string; entityId?: string; workflowId?: string; reportId?: string; formats?: string[]; content: JsonRecord; sourceSnapshot: JsonRecord; evidenceReferences?: unknown[]; confidentiality?: string; actor: InstitutionalActor }) {
  const supabase = await createServiceClient();
  const result = await supabase.from("ac_capital_artifacts").insert({
    artifact_type: clean(input.artifactType), title: clean(input.title), entity_type: clean(input.entityType) || null, entity_id: clean(input.entityId) || null,
    workflow_id: clean(input.workflowId) || null, report_id: clean(input.reportId) || null, status: "draft-human-review", approval_status: "not-requested",
    formats: input.formats?.length ? input.formats : ["pdf","docx"], content_snapshot: input.content, source_snapshot: input.sourceSnapshot,
    evidence_references: input.evidenceReferences || [], confidentiality: clean(input.confidentiality || "Confidential"), generated_by: actorName(input.actor), generated_at: now(),
  }).select("*").single();
  if (result.error) throw result.error;
  return result.data as JsonRecord;
}

export async function renderCapitalArtifact(artifact: JsonRecord, format: string, actor: InstitutionalActor) {
  const document = documentFromArtifact(artifact);
  const normalizedFormat = clean(format).toLowerCase();
  let bytes: Uint8Array; let mimeType: string; let extension: string;
  if (normalizedFormat === "pdf") { bytes = await renderPdf(document); mimeType = "application/pdf"; extension = "pdf"; }
  else if (normalizedFormat === "docx") { bytes = renderDocx(document); mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; extension = "docx"; }
  else if (normalizedFormat === "xlsx") { bytes = renderXlsx(document); mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"; extension = "xlsx"; }
  else if (normalizedFormat === "csv") { bytes = renderCsv(document); mimeType = "text/csv; charset=utf-8"; extension = "csv"; }
  else if (normalizedFormat === "json") { bytes = new TextEncoder().encode(JSON.stringify(document, null, 2)); mimeType = "application/json; charset=utf-8"; extension = "json"; }
  else if (normalizedFormat === "zip") {
    const pdf = await renderPdf(document); const docx = renderDocx(document); const xlsx = renderXlsx(document); const json = new TextEncoder().encode(JSON.stringify(document, null, 2));
    bytes = zipStore([{ name: `${safeFileName(document.title)}.pdf`, data: pdf }, { name: `${safeFileName(document.title)}.docx`, data: docx }, { name: `${safeFileName(document.title)}.xlsx`, data: xlsx }, { name: `${safeFileName(document.title)}.json`, data: json }]);
    mimeType = "application/zip"; extension = "zip";
  } else throw Object.assign(new Error(`AC_CAPITAL_UNSUPPORTED_ARTIFACT_FORMAT:${format}`), { status: 400 });
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const supabase = await createServiceClient();
  const version = Number(artifact.current_version || 1);
  const outputReference = `ac-capital-artifact://${artifact.id}/v${version}/${extension}`;
  const persisted = await supabase.from("ac_capital_artifact_versions").upsert({
    artifact_id: artifact.id, version_no: version, format: extension, content_snapshot: artifact.content_snapshot || {}, sha256, byte_size: bytes.length,
    output_reference: outputReference, status: clean(artifact.approval_status) === "approved" ? "approved-snapshot" : "generated-draft", generated_by: actorName(actor), generated_at: now(),
  }, { onConflict: "artifact_id,version_no,format" }).select("*").single();
  if (persisted.error) throw persisted.error;
  if (clean(artifact.approval_status) === "approved" && !artifact.immutable_snapshot_hash) {
    await supabase.from("ac_capital_artifacts").update({ immutable_snapshot_hash: snapshotHash(object(artifact.content_snapshot)), approved_version: version, updated_at: now() }).eq("id", artifact.id);
  }
  return { bytes, mimeType, filename: `${safeFileName(document.title)}-v${version}.${extension}`, sha256, outputReference, version: persisted.data as JsonRecord };
}
