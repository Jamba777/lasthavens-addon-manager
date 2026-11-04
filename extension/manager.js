import { importZip, exportZip } from "./archive.js";
import {
  mergeAddons,
  toggleAddon,
  removeAddon,
  missingDependencies,
} from "./library.js";
import { readLibrary, writeLibrary } from "./repository.js";
import { languages, setLocale, t, formatSize } from "./i18n.js";
const $ = (s) => document.querySelector(s),
  el = (tag, text, className) => {
    const n = document.createElement(tag);
    if (text) n.textContent = text;
    if (className) n.className = className;
    return n;
  };
let library = await readLibrary(),
  busy = false,
  messageKey = "",
  details = "";
const pref = await chrome.storage.local.get("language");
await setLocale(pref.language || chrome.i18n.getUILanguage());
for (const [code, name] of Object.entries(languages)) {
  const option = el("option", name);
  option.value = code;
  $("#language").append(option);
}
$("#language").value = document.documentElement.lang.replace("-", "_");
$("#version").textContent = " · v" + chrome.runtime.getManifest().version;
function showMessage(key, extra = "") {
  messageKey = key;
  details = extra;
  $("#message").textContent = (key ? t(key) : "") + (extra ? " " + extra : "");
}
function download(addon) {
  const url = URL.createObjectURL(
    new Blob([exportZip(addon)], { type: "application/zip" }),
  );
  const link = el("a");
  link.href = url;
  link.download = addon.folder + ".zip";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function commit(next) {
  library = await writeLibrary(next);
  showMessage("saved");
}
async function action(fn) {
  if (busy) return;
  busy = true;
  render();
  try {
    await fn();
  } catch (error) {
    showMessage(
      error.message === "libraryLimit" ? "libraryLimit" : "importError",
      error.message === "libraryLimit" ? "" : error.message,
    );
  } finally {
    busy = false;
    render();
  }
}
function render() {
  document.title = t("title") + " · Lasthavens";
  for (const node of document.querySelectorAll("[data-i18n]"))
    node.textContent = t(node.dataset.i18n);
  $("#import").disabled = busy;
  $("#count").textContent =
    `${library.addons.length} ${t("addons")} · ${library.addons.filter((a) => a.enabled).length} ${t("active")} · ${formatSize(library.addons.reduce((s, a) => s + a.size, 0))}`;
  const list = $("#list");
  list.replaceChildren();
  if (!library.addons.length) list.append(el("div", t("empty"), "empty"));
  for (const addon of library.addons) {
    const card = el("article");
    const row = el("div", "", "row");
    const title = el("div");
    title.append(
      el("h2", addon.title),
      el(
        "p",
        `${addon.folder} · ${addon.version || t("noVersion")} · ${Object.keys(addon.files).length} ${t("files")} · ${formatSize(addon.size)}`,
        "meta",
      ),
    );
    const label = el("label", "", "switch-control");
    const input = el("input");
    input.type = "checkbox";
    input.role = "switch";
    input.checked = addon.enabled;
    input.disabled = busy;
    input.setAttribute("aria-label", addon.title);
    input.onchange = () =>
      action(() => commit(toggleAddon(library, addon.folder, input.checked)));
    const track = el("span", "", "switch-track");
    track.setAttribute("aria-hidden", "true");
    label.append(
      input,
      track,
      el("span", t(addon.enabled ? "enabled" : "disabled"), "switch-text"),
    );
    row.append(title, label);
    card.append(row, el("p", t("hint"), "apply-note"));
    if (addon.notes) card.append(el("p", addon.notes));
    if (addon.warnings.length)
      card.append(el("p", t("interfaceWarning"), "warning"));
    const missing = missingDependencies(addon, library);
    if (missing.length)
      card.append(
        el("p", t("dependencies", { names: missing.join(", ") }), "warning"),
      );
    const buttons = el("div", "", "actions");
    for (const [key, fn] of [
      ["exportZip", () => download(addon)],
      [
        "remove",
        () => action(() => commit(removeAddon(library, addon.folder))),
      ],
    ]) {
      const button = el("button", t(key));
      button.disabled = busy;
      button.onclick = fn;
      buttons.append(button);
    }
    card.append(buttons);
    list.append(card);
  }
  showMessage(messageKey, details);
  status();
}
async function status() {
  const { lastStatus: s } = await chrome.storage.session.get("lastStatus");
  $("#status").textContent = !s
    ? t("waiting")
    : s.state === "error"
      ? t("loadError")
      : s.state === "pending" || s.revision !== library.revision
        ? t("changed")
        : t("ready", { count: s.loaded.length });
}
$("#import").onchange = (e) => {
  const files = [...e.target.files];
  action(async () => {
    const items = [];
    for (const file of files)
      items.push(
        ...(await importZip(new Uint8Array(await file.arrayBuffer()))),
      );
    await commit(mergeAddons(library, items));
    showMessage("imported");
  }).finally(() => (e.target.value = ""));
};
$("#language").onchange = async (e) => {
  await setLocale(e.target.value);
  await chrome.storage.local.set({ language: e.target.value });
  render();
};
$("#play").onclick = () =>
  chrome.tabs.create({ url: "https://lasthavens.com/play" });
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === "session") status();
  if (area === "local" && changes.library && !busy) {
    library = await readLibrary();
    render();
  }
});
render();
