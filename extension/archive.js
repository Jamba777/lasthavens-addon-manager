import { AddonError } from "./errors.js";
import { unzipSync, zipSync } from "./vendor/fflate.js";
export const LIMITS = {
  archive: 128 * 1024 * 1024,
  expanded: 256 * 1024 * 1024,
  file: 64 * 1024 * 1024,
  count: 32000,
  total: 384 * 1024 * 1024,
};
const decoder = new TextDecoder();
export function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) {
    c ^= b;
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
export function base64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 32768)
    s += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(s);
}
export function unbase64(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
function safePath(name) {
  const p = name.replaceAll("\\", "/");
  if (
    p.startsWith("/") ||
    /[\x00-\x1f:]/.test(p) ||
    p.split("/").some((s) => s === ".." || s === ".")
  )
    throw new AddonError("errorPath", { detail: name });
  return p;
}
function inspectZip(bytes) {
  if (bytes.length > LIMITS.archive) throw new AddonError("errorArchiveSize");
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let e = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (
      v.getUint32(i, true) === 0x06054b50 &&
      i + 22 + v.getUint16(i + 20, true) === bytes.length
    ) {
      e = i;
      break;
    }
  }
  if (e < 0) throw new AddonError("errorZip");
  if (v.getUint16(e + 4, true) || v.getUint16(e + 6, true))
    throw new AddonError("errorUnsupported");
  const count = v.getUint16(e + 10, true),
    start = v.getUint32(e + 16, true),
    length = v.getUint32(e + 12, true);
  if (count === 65535 || start === 0xffffffff || length === 0xffffffff)
    throw new AddonError("errorZip");
  if (count > LIMITS.count || start + length > e)
    throw new AddonError("errorZip");
  let at = start,
    total = 0;
  const meta = new Map(),
    seen = new Set();
  for (let i = 0; i < count; i++) {
    if (at + 46 > bytes.length || v.getUint32(at, true) !== 0x02014b50)
      throw new AddonError("errorZip");
    const flags = v.getUint16(at + 8, true),
      method = v.getUint16(at + 10, true),
      size = v.getUint32(at + 24, true),
      n = v.getUint16(at + 28, true),
      extra = v.getUint16(at + 30, true),
      comment = v.getUint16(at + 32, true),
      offset = v.getUint32(at + 42, true);
    if (flags & 1 || ![0, 8].includes(method))
      throw new AddonError("errorUnsupported");
    if (at + 46 + n + extra + comment > start + length)
      throw new AddonError("errorZip");
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + n)),
      path = safePath(name);
    if (((v.getUint32(at + 38, true) >>> 16) & 0xf000) === 0xa000)
      throw new AddonError("errorUnsupported");
    if (offset + 30 > start || v.getUint32(offset, true) !== 0x04034b50)
      throw new AddonError("errorZip");
    const ln = v.getUint16(offset + 26, true),
      le = v.getUint16(offset + 28, true),
      compressed = v.getUint32(at + 20, true);
    if (
      offset + 30 + ln + le + compressed > start ||
      decoder.decode(bytes.subarray(offset + 30, offset + 30 + ln)) !== name
    )
      throw new AddonError("errorZip");
    total += size;
    if (size > LIMITS.file || total > LIMITS.expanded)
      throw new AddonError("errorExpanded");
    if (seen.has(path.toLowerCase()))
      throw new AddonError("errorDuplicate", { detail: path });
    seen.add(path.toLowerCase());
    meta.set(name, { path, size, crc: v.getUint32(at + 16, true) });
    at += 46 + n + extra + comment;
  }
  if (at !== start + length) throw new AddonError("errorZip");
  return meta;
}
function tocMeta(text) {
  const m = {};
  for (const line of text.split(/\r?\n/)) {
    const x = line.match(/^##\s*([^:]+):\s*(.*)$/);
    if (x) m[x[1].trim().toLowerCase()] = x[2].trim();
  }
  const clean = (s) => (s || "").replace(/\|c[0-9a-f]{8}|\|r/gi, "");
  return {
    title: clean(m.title),
    version: clean(m.version),
    notes: clean(m.notes),
    interface: m.interface || "",
    dependencies: (m.dependencies || m.requireddeps || m.deps || "")
      .split(/[,\s]+/)
      .filter(Boolean),
  };
}
export async function importZip(bytes) {
  const meta = inspectZip(bytes),
    raw = unzipSync(bytes, { filter: (f) => meta.has(f.name) }),
    files = new Map();
  for (const [name, data] of Object.entries(raw)) {
    const m = meta.get(name);
    if (!m || data.length !== m.size || crc32(data) !== m.crc)
      throw new AddonError("errorIntegrity", { detail: name });
    if (!m.path.endsWith("/") && !m.path.startsWith("__MACOSX/"))
      files.set(m.path, data);
  }
  const roots = [];
  for (const path of files.keys()) {
    const parts = path.split("/"),
      toc = parts.pop(),
      folder = parts.at(-1);
    if (folder && toc.toLowerCase() === folder.toLowerCase() + ".toc")
      roots.push({ root: parts.join("/"), folder, toc: path });
  }
  // Also accept a ZIP containing the contents of one addon folder.
  {
    const tocs = [...files.keys()].filter(
      (p) => !p.includes("/") && /\.toc$/i.test(p),
    );
    if (tocs.length === 1)
      roots.push({ root: "", folder: tocs[0].slice(0, -4), toc: tocs[0] });
  }
  if (!roots.length) throw new AddonError("errorToc");
  // Embedded libraries belong to their parent addon, not separate addons.
  const topRoots = roots.filter(
    (r) =>
      !roots.some(
        (parent) =>
          parent !== r &&
          (parent.root === "" ||
            r.root.toLowerCase().startsWith(parent.root.toLowerCase() + "/")),
      ),
  );
  roots.splice(0, roots.length, ...topRoots);
  const addons = [],
    seen = new Set();
  for (const r of roots) {
    if (
      !/^[A-Za-z0-9_-]+$/.test(r.folder) ||
      r.folder.toLowerCase().startsWith("blizzard_")
    )
      throw new AddonError("errorFolder", { detail: r.folder });
    if (seen.has(r.folder.toLowerCase()))
      throw new AddonError("errorFolder", { detail: r.folder });
    seen.add(r.folder.toLowerCase());
    const info = tocMeta(decoder.decode(files.get(r.toc))),
      own = {};
    let size = 0;
    for (const [p, data] of files) {
      if (r.root && !p.startsWith(r.root + "/")) continue;
      if (
        roots.some(
          (other) =>
            other !== r &&
            other.root.startsWith(r.root + "/") &&
            p.startsWith(other.root + "/"),
        )
      )
        continue;
      const relative = r.root ? p.slice(r.root.length + 1) : p;
      if (/(^|\/)\.(git|svn)(\/|$)/.test(relative)) continue;
      own[relative] = base64(data);
      size += data.length;
    }
    if (
      !Object.keys(own).some(
        (p) => p.toLowerCase() === r.folder.toLowerCase() + ".toc",
      )
    )
      throw new AddonError("errorToc");
    const signature = new TextEncoder().encode(
      JSON.stringify(
        Object.entries(own).sort(([a], [b]) => a.localeCompare(b)),
      ),
    );
    const digest = [
      ...new Uint8Array(await crypto.subtle.digest("SHA-256", signature)),
    ]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
    addons.push({
      ...info,
      title: info.title || r.folder,
      folder: r.folder,
      files: own,
      size,
      digest,
      enabled: false,
      importedAt: Date.now(),
      warnings:
        info.interface && !info.interface.split(/[,\s]+/).includes("30300")
          ? ["TOC не заявляет Interface 30300. Совместимость не подтверждена."]
          : [],
    });
  }
  return addons;
}
export function exportZip(addon) {
  return zipSync(
    Object.fromEntries(
      Object.entries(addon.files).map(([p, s]) => [
        addon.folder + "/" + p,
        unbase64(s),
      ]),
    ),
    { level: 6 },
  );
}
