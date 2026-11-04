import { chromium } from "playwright";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import assert from "node:assert/strict";
import { zipSync } from "fflate";
const server = http.createServer((req, res) => {
  try {
    const p = path.join(
      process.cwd(),
      "extension",
      new URL(req.url, "http://x").pathname,
    );
    res.setHeader(
      "Content-Type",
      p.endsWith(".js")
        ? "application/javascript"
        : p.endsWith(".json")
          ? "application/json"
          : p.endsWith(".css")
            ? "text/css"
            : "text/html",
    );
    res.end(fs.readFileSync(p));
  } catch {
    res.statusCode = 404;
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  headless: true,
});
try {
  const context = await browser.newContext({ acceptDownloads: true });
  await context.addInitScript(() => {
    const store = {
      get: async (key) => ({
        [key]: JSON.parse(localStorage.getItem(key) || "null"),
      }),
      set: async (obj) => {
        for (const [k, v] of Object.entries(obj))
          localStorage.setItem(k, JSON.stringify(v));
      },
    };
    window.chrome = {
      i18n: { getUILanguage: () => "en" },
      runtime: { getManifest: () => ({ version: "0.2.0" }) },
      storage: {
        local: store,
        session: store,
        onChanged: { addListener() {} },
      },
      tabs: { create() {} },
    };
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/manager.html`);
  await page.waitForSelector("h1:not(:empty)");
  assert.equal(await page.locator("#sample").count(), 0);
  const zip = zipSync({
    "Example/Example.toc": new TextEncoder().encode(
      "## Interface: 30300\n## Title: Example\nExample.lua",
    ),
    "Example/Example.lua": new TextEncoder().encode('print("example")'),
  });
  await page.locator("#import").setInputFiles({
    name: "Example.zip",
    mimeType: "application/zip",
    buffer: Buffer.from(zip),
  });
  const sw = page.getByRole("switch", { name: "Example" });
  await sw.waitFor();
  await sw.check();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem("library")).addons[0].enabled,
  );
  await page.reload();
  await sw.waitFor();
  assert(await sw.isChecked());
  for (const locale of ["uk", "ru", "en", "es", "fr", "pt_BR"]) {
    await page.locator("#language").selectOption(locale);
    await page.waitForFunction(
      (l) => document.documentElement.lang === l.replace("_", "-"),
      locale,
    );
    assert((await page.locator("h1").innerText()).length > 0);
    assert(await sw.isChecked());
  }
  await page.locator("#language").selectOption("ru");
  await page.waitForFunction(() => document.documentElement.lang === "ru");
  await sw.focus();
  await page.keyboard.press("Space");
  await page.waitForFunction(
    () => !JSON.parse(localStorage.getItem("library")).addons[0].enabled,
  );
  assert(!(await sw.isChecked()));
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Экспорт ZIP", exact: true }).click();
  assert.equal((await download).suggestedFilename(), "Example.zip");
  fs.mkdirSync("test-results", { recursive: true });
  await page.screenshot({
    path: "test-results/manager-ru.png",
    fullPage: true,
  });
  await page.locator("#language").selectOption("en");
  await page.waitForFunction(() => document.documentElement.lang === "en");
  await sw.check();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem("library")).addons[0].enabled,
  );
  await page.reload();
  await sw.waitFor();
  fs.mkdirSync("docs/images", { recursive: true });
  await page.screenshot({ path: "docs/images/manager-en.png", fullPage: true });
  for (const [locale, expected] of [
    ["en", "ZIP archive"],
    ["ru", "ZIP-архив"],
    ["uk", "ZIP-архів"],
    ["es", "archivo ZIP"],
    ["fr", "archive ZIP"],
    ["pt_BR", "arquivo ZIP"],
  ]) {
    await page.locator("#language").selectOption(locale);
    await page.waitForFunction(
      (l) => document.documentElement.lang === l.replace("_", "-"),
      locale,
    );
    await page.locator("#import").setInputFiles({
      name: "broken.zip",
      mimeType: "application/zip",
      buffer: Buffer.from([1, 2, 3]),
    });
    await page.waitForFunction(
      (text) => document.querySelector("#message").textContent.includes(text),
      expected,
    );
  }
  await page.locator("#language").selectOption("ru");
  await page.waitForFunction(() => document.documentElement.lang === "ru");
  await page.setViewportSize({ width: 390, height: 844 });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.getByRole("button", { name: "Удалить", exact: true }).click();
  await page.waitForSelector(".empty");
  assert.deepEqual(errors, []);
  console.log(
    "PASS UI import, toggle, reload, six languages, keyboard, export, delete, mobile overflow",
  );
} finally {
  await browser.close();
  server.close();
}
