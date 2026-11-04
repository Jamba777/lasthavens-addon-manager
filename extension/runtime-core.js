// Runs both on the page and in game workers. All addon bytes stay local.
globalThis.LHInstallOverlay = function (files, base) {
  const Native = XMLHttpRequest,
    paths = Object.keys(files);
  const entries = paths.map((p) => files[p].size + "\t" + p).join("\n");
  globalThis.XMLHttpRequest = class extends Native {
    open(method, url, ...args) {
      this.answer = null;
      this.p = new URL(String(url), base);
      this.method = method;
      this.path = decodeURIComponent(this.p.pathname);
      this.local = paths.find(
        (p) =>
          this.path === "/game/" + p ||
          this.path.startsWith("/blocks/" + p + "/"),
      );
      this.bundle =
        /^\/blocks\/Interface\/AddOns\/[^/]+\/bundle-/.test(this.path) &&
        paths.some((p) =>
          this.path.startsWith(
            "/blocks/" + p.split("/").slice(0, 3).join("/") + "/",
          ),
        );
      return super.open(
        method,
        this.local ? files[this.local].url : this.p.href,
        ...args,
      );
    }
    setRequestHeader(k, v) {
      if (this.local && k.toLowerCase() === "range") {
        this.range = v;
        return;
      }
      return super.setRequestHeader(k, v);
    }
    send(body) {
      if (this.bundle && this.method === "GET") {
        this.answer = { status: 404, text: "" };
        return;
      }
      if (this.local && this.method === "GET") {
        const type = this.responseType;
        this.responseType = "arraybuffer";
        super.send();
        let bytes = new Uint8Array(super.response);
        let start = 0,
          end = bytes.length;
        const block = this.path.match(/\/(\d+)-(\d+)-(\d+)k\.bin$/);
        if (block) {
          start = Number(block[2]) * Number(block[3]) * 1024;
          end = start + Number(block[3]) * 1024;
        }
        if (this.range) {
          const m = this.range.match(/bytes=(\d+)-(\d+)/);
          if (m) {
            start = +m[1];
            end = +m[2] + 1;
          }
        }
        bytes = bytes.slice(start, end);
        this.answer = { status: this.range ? 206 : 200, bytes, type };
        return;
      }
      const r = super.send(body);
      if (this.path === "/game-manifest.txt" && super.status === 200 && entries)
        this.answer = {
          status: 200,
          text: super.responseText.trimEnd() + "\n" + entries + "\n",
        };
      return r;
    }
    get status() {
      return this.answer?.status ?? super.status;
    }
    get readyState() {
      return this.answer ? 4 : super.readyState;
    }
    get responseText() {
      return this.answer
        ? (this.answer.text ?? new TextDecoder().decode(this.answer.bytes))
        : super.responseText;
    }
    get response() {
      return this.answer
        ? this.answer.bytes
          ? this.answer.type === "arraybuffer"
            ? this.answer.bytes.buffer
            : new TextDecoder().decode(this.answer.bytes)
          : this.answer.text
        : super.response;
    }
  };
};
