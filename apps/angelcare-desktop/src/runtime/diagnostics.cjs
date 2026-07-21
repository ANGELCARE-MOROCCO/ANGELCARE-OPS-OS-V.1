"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { sanitizeFilename, sanitizeValue } = require("./security.cjs");

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

function createStoredZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const stamp = dosDateTime();
  for (const entry of entries) {
    const name = Buffer.from(entry.name.replace(/\\/g, "/"), "utf8");
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(String(entry.data), "utf8");
    const crc = crc32(data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(stamp.time, 10);
    local.writeUInt16LE(stamp.day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    localParts.push(local, data);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(stamp.time, 12);
    central.writeUInt16LE(stamp.day, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centralParts.push(central);
    offset += local.length + data.length;
  }
  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

function tailSanitizedLog(filePath, maxLines) {
  try {
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).slice(-maxLines);
    return lines.map((line) => {
      try { return JSON.stringify(sanitizeValue(JSON.parse(line))); }
      catch { return String(sanitizeValue(line)); }
    }).join("\n") + "\n";
  } catch {
    return "No local runtime log was available.\n";
  }
}

function createDiagnosticsController({ app, dialog, runtime, logger, getRuntimeState, getWhatsappState, getGovernanceState, getReleaseState, getStartupState }) {
  let lastExportAt = null;
  let lastExportPath = null;

  function getStatus() {
    return {
      available: true,
      lastExportAt,
      lastExportName: lastExportPath ? path.basename(lastExportPath) : null,
      excludes: ["WhatsApp messages", "WhatsApp cookies", "IndexedDB", "authentication secrets", "customer files"],
    };
  }

  async function exportBundle() {
    const suggested = sanitizeFilename(`ANGELCARE-Desktop-Diagnostics-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`);
    const result = await dialog.showSaveDialog({
      title: "Exporter les diagnostics ANGELCARE Desktop",
      defaultPath: path.join(app.getPath("documents"), suggested),
      filters: [{ name: "Archive ZIP", extensions: ["zip"] }],
      properties: ["createDirectory", "showOverwriteConfirmation"],
    });
    if (result.canceled || !result.filePath) return { cancelled: true, status: getStatus() };

    const report = sanitizeValue({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      application: {
        name: app.getName(),
        version: app.getVersion(),
        packaged: app.isPackaged,
        platform: process.platform,
        architecture: process.arch,
        operatingSystem: `${os.type()} ${os.release()}`,
        releaseChannel: runtime.releaseChannel,
        buildId: runtime.buildId,
        contractVersion: runtime.desktopContractVersion,
      },
      runtime: getRuntimeState(),
      whatsapp: getWhatsappState(),
      governance: getGovernanceState(),
      release: getReleaseState(),
      startupRecovery: getStartupState(),
      privacyBoundary: {
        messagesIncluded: false,
        cookiesIncluded: false,
        indexedDbIncluded: false,
        authenticationSecretsIncluded: false,
        customerFilesIncluded: false,
      },
    });

    const zip = createStoredZip([
      { name: "diagnostic-report.json", data: `${JSON.stringify(report, null, 2)}\n` },
      { name: "runtime-log-sanitized.ndjson", data: tailSanitizedLog(logger.logFile, runtime.diagnosticMaxLogLines) },
      { name: "README.txt", data: "ANGELCARE Desktop sanitized diagnostic package. This archive intentionally excludes WhatsApp messages, cookies, IndexedDB, authentication secrets and customer files.\n" },
    ]);
    fs.writeFileSync(result.filePath, zip, { mode: 0o600 });
    lastExportAt = new Date().toISOString();
    lastExportPath = result.filePath;
    logger.info("diagnostics_exported", { filename: path.basename(result.filePath), size: zip.length });
    return { cancelled: false, path: result.filePath, filename: path.basename(result.filePath), size: zip.length, status: getStatus() };
  }

  return { getStatus, exportBundle };
}

module.exports = { createDiagnosticsController, createStoredZip, crc32, tailSanitizedLog };
