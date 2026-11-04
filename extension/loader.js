(() => {
  if (location.pathname !== "/play" && location.pathname !== "/play/") return;
  const channel = "lh-local-addons-v1",
    NativeWorker = Worker,
    install = LHInstallOverlay;
  let resolve;
  const ready = new Promise((r) => (resolve = r));
  let received = false;
  const report = (state, message, revision = "", loaded = []) =>
    window.postMessage(
      { channel, kind: "status", status: { state, message, revision, loaded } },
      location.origin,
    );
  const prepare = async (payload) => {
    if (payload.error) throw Error(payload.error);
    const files = {},
      folders = payload.addons.map((a) => a.folder);
    const original = await (await fetch("/game-manifest.txt")).text();
    for (const folder of folders)
      if (
        original
          .toLowerCase()
          .includes("interface/addons/" + folder.toLowerCase() + "/")
      )
        throw Error("Конфликт со штатным аддоном: " + folder);
    for (const a of payload.addons)
      for (const [p, b64] of Object.entries(a.files)) {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        files["Interface/AddOns/" + a.folder + "/" + p] = {
          size: bytes.length,
          url: URL.createObjectURL(new Blob([bytes])),
        };
      }
    // Mask cached local-addon records only in reads, preserving every byte position.
    // Persistent blocks.idx is never edited by the extension.
    const spans = [];
    try {
      const root = await navigator.storage.getDirectory();
      const text = await (
        await (await root.getFileHandle("blocks.idx")).getFile()
      ).text();
      let offset = 0;
      for (const line of text.split("\n")) {
        const cols = line.split("\t");
        if (
          cols.length === 5 &&
          folders.some((f) =>
            cols[4]
              .toLowerCase()
              .startsWith("interface/addons/" + f.toLowerCase() + "/"),
          )
        ) {
          const h = line.indexOf("\t") + 1;
          spans.push([offset + h, cols[1].length, 48]);
          const pathAt = line.lastIndexOf("\t") + 1;
          spans.push([offset + pathAt, 1, 35]);
        }
        offset += new TextEncoder().encode(line + "\n").length;
      }
    } catch (e) {
      if (e.name !== "NotFoundError") throw e;
    }
    install(files, location.href);
    report(
      "ready",
      "Подготовлено локальных аддонов: " + folders.length,
      payload.revision,
      folders,
    );
    return { files, spans };
  };
  addEventListener("message", (e) => {
    if (
      e.source !== window ||
      e.origin !== location.origin ||
      e.data?.channel !== channel
    )
      return;
    if (e.data.kind === "payload" && !received) {
      received = true;
      prepare(e.data.payload)
        .then(resolve)
        .catch((err) => {
          report("error", String(err));
          resolve({ files: {}, spans: [] });
        });
    }
    if (e.data.kind === "changed")
      report("pending", "Список изменён. Перезагрузите игру для применения.");
  });
  window.Worker = class extends NativeWorker {
    constructor(url, options) {
      if (options?.name !== "em-pthread") {
        super(url, options);
        return;
      }
      const original = new URL(String(url), location.href).href;
      const source = `const queue=[];function boot(e){if(!e.data?.__lhBoot){queue.push(e);return}removeEventListener('message',boot);(${install.toString()})(e.data.files,${JSON.stringify(original)});importScripts(${JSON.stringify(original)});const assign=assignWasmImports;assignWasmImports=function(){assign();const io=wasmImports.WebVfsStoreIo;wasmImports.WebVfsStoreIo=function(file,write,ptr,count,at){const got=io(file,write,ptr,count,at);if(file===1&&!write&&got>0){for(const [start,len,value]of e.data.spans){const lo=Math.max(start,at),hi=Math.min(start+len,at+got);if(hi>lo)HEAPU8.fill(value,ptr+lo-at,ptr+hi-at)}}return got}};for(const event of queue)dispatchEvent(new MessageEvent('message',{data:event.data}));}addEventListener('message',boot);`;
      super(
        URL.createObjectURL(
          new Blob([source], { type: "application/javascript" }),
        ),
        options,
      );
      ready.then((data) => this.postMessage({ __lhBoot: true, ...data }));
    }
  };
  window.postMessage({ channel, kind: "hello" }, location.origin);
  setTimeout(() => {
    if (!received) {
      received = true;
      report(
        "error",
        "Нет ответа от расширения. Игра запущена без локальных аддонов.",
      );
      resolve({ files: {}, spans: [] });
    }
  }, 10000);
})();
