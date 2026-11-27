import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    headless: true,
  });
  try {
    const c = await browser.newContext();
    const page = await c.newPage();
    page.on("pageerror", console.error);
    const binary = Buffer.alloc(140000);
    for (let i = 0; i < binary.length; i++) binary[i] = i % 251;
    const payload = {
      revision: "test",
      addons: [
        {
          folder: "RuntimeProbe",
          files: {
            "RuntimeProbe.toc": Buffer.from(
              "## Interface: 30300\nRuntimeProbe.lua\n",
            ).toString("base64"),
            "RuntimeProbe.lua": binary.toString("base64"),
          },
        },
      ],
    };
    await c.route("https://lasthavens.com/**", (route) => {
      const u = new URL(route.request().url());
      if (u.pathname === "/game-manifest.txt")
        return route.fulfill({
          contentType: "text/plain",
          body: "1\tData/test.MPQ\n",
        });
      if (u.pathname.startsWith("/blocks/"))
        return route.fulfill({ status: 404 });
      if (u.pathname === "/Wow.js")
        return route.fulfill({
          contentType: "text/javascript",
          body: `var wasmImports;function assignWasmImports(){wasmImports={WebVfsStoreIo:()=>0}};onmessage=()=>{assignWasmImports();const x=new XMLHttpRequest();x.open('GET','/game-manifest.txt',false);x.send();const a=new XMLHttpRequest();a.open('GET','/blocks/Interface/AddOns/RuntimeProbe/RuntimeProbe.lua/140000-1-64k.bin',false);a.responseType='arraybuffer';a.send();postMessage({manifest:x.responseText,bytes:[...new Uint8Array(a.response)],status:a.status})};`,
        });
      return route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><script>const w=new Worker('/Wow.js',{name:'em-pthread'});w.onmessage=e=>window.result=e.data;w.postMessage({go:true});</script>`,
      });
    });
    const code =
      ["runtime-core.js", "loader.js"]
        .map((p) => fs.readFileSync("extension/" + p, "utf8"))
        .join("\n") +
      '\nsetTimeout(()=>window.postMessage({channel:"lh-local-addons-v1",kind:"payload",payload:' +
      JSON.stringify(payload) +
      "},location.origin),50);";
    await page.addInitScript(code);
    await page.goto("https://lasthavens.com/play");
    await page.waitForFunction(() => window.result, { timeout: 15000 });
    const r = await page.evaluate(() => window.result);
    assert(
      r.manifest.includes(
        "140000\tInterface/AddOns/RuntimeProbe/RuntimeProbe.lua",
      ),
    );
    assert.deepEqual(Buffer.from(r.bytes), binary.subarray(65536, 131072));
    assert.equal(r.status, 200);
    const prefetched = await page.evaluate(async () => {
      const request = new Request(
        "/blocks/Interface/AddOns/RuntimeProbe/RuntimeProbe.lua/140000-2-64k.bin",
      );
      const local = await fetch(request);
      const remote = await fetch("/blocks/Data/test.MPQ/1-0-64k.bin");
      return {
        status: local.status,
        bytes: [...new Uint8Array(await local.arrayBuffer())],
        remote: remote.status,
      };
    });
    assert.equal(prefetched.status, 200);
    assert.deepEqual(Buffer.from(prefetched.bytes), binary.subarray(131072));
    assert.equal(prefetched.remote, 404);
    console.log(
      "PASS delayed payload + em-pthread bootstrap + manifest overlay + exact binary second 64KB block",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
