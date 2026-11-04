import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { zipSync } from "fflate";
import {
  importZip,
  exportZip,
  base64,
  unbase64,
} from "../extension/archive.js";
import {
  mergeAddons,
  toggleAddon,
  removeAddon,
  emptyLibrary,
} from "../extension/library.js";
import { resolveLocale } from "../extension/i18n.js";
const bytes = (s) => new TextEncoder().encode(s);
test("binary ZIP roundtrip and nested libraries stay inside addon", async () => {
  const binary = Uint8Array.from({ length: 140000 }, (_, i) => i % 251);
  const zip = zipSync({
    "repo/Example/Example.toc": bytes("## Interface: 30300\nExample.lua"),
    "repo/Example/Example.lua": binary,
    "repo/Example/Libs/LibBabble-Faction-3.0/LibBabble-Faction-3.0.toc": bytes(
      "## Interface: 30300",
    ),
  });
  const addons = await importZip(zip);
  assert.equal(addons.length, 1);
  assert.equal(Object.keys(addons[0].files).length, 3);
  const again = await importZip(exportZip(addons[0]));
  assert.deepEqual(unbase64(again[0].files["Example.lua"]), binary);
});
test("flat ZIP with embedded library", async () => {
  const a = await importZip(
    zipSync({
      "Example.toc": bytes("## Interface: 30300"),
      "Libs/Test/Test.toc": bytes("## Interface: 30300"),
    }),
  );
  assert.equal(a.length, 1);
  assert.equal(a[0].folder, "Example");
});
test("invalid archive, path traversal, duplicate case and Blizzard rejected", async () => {
  for (const zip of [
    new Uint8Array([1, 2]),
    zipSync({ "../Bad/Bad.toc": bytes("x") }),
    zipSync({ "A/A.toc": bytes("x"), "A/a.TOC": bytes("x") }),
    zipSync({ "Blizzard_Test/Blizzard_Test.toc": bytes("x") }),
  ])
    await assert.rejects(() => importZip(zip));
});
test("immutable library operations preserve enabled state on update", () => {
  const item = { folder: "Example", size: 1, enabled: true };
  const a = mergeAddons(emptyLibrary(), [item]);
  assert.equal(a.addons[0].enabled, false);
  const b = toggleAddon(a, "Example", true);
  const c = mergeAddons(b, [{ ...item, version: "2" }]);
  assert.equal(c.addons[0].enabled, true);
  assert.equal(a.addons[0].enabled, false);
  assert.equal(removeAddon(c, "Example").addons.length, 0);
});
test("base64 and locale fallback", () => {
  assert.deepEqual(unbase64(base64(bytes("Привіт"))), bytes("Привіт"));
  assert.equal(resolveLocale("pt-BR"), "pt_BR");
  assert.equal(resolveLocale("es-MX"), "es");
  assert.equal(resolveLocale("xx"), "en");
});
test("all six locales have identical keys and placeholders; no demo UI", async () => {
  const root = new URL("../extension/_locales/", import.meta.url);
  let baseline;
  for (const lang of await readdir(root)) {
    const dict = JSON.parse(
      await readFile(new URL(lang + "/messages.json", root)),
    );
    const keys = Object.keys(dict).sort();
    baseline ??= dict;
    assert.deepEqual(keys, Object.keys(baseline).sort());
    for (const key of keys) {
      assert(dict[key].message);
      assert.deepEqual(
        dict[key].message.match(/\{\w+\}/g) || [],
        baseline[key].message.match(/\{\w+\}/g) || [],
      );
    }
  }
  const html = await readFile(
    new URL("../extension/manager.html", import.meta.url),
    "utf8",
  );
  assert(!/CodexProbe|Твои аддоны|Твой интерфейс/.test(html));
});
